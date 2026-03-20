#Requires -RunAsAdministrator
<#
.SYNOPSIS
    One-click CouchDB installer for ClinicSoftware.
    Self-contained: downloads CouchDB, installs, configures, creates users, verifies.
    Run this ONCE on the doctor's Windows machine.

.DESCRIPTION
    This script handles everything:
    1. Downloads CouchDB 3.5.1 MSI
    2. Installs as a Windows service (auto-starts on boot)
    3. Opens firewall for LAN access
    4. Creates the database with role-based security
    5. Creates doctor + nurse user accounts
    6. Deploys document-level write restrictions
    7. Runs 6 verification checks

    No other files needed. Just run this script.

.EXAMPLE
    Right-click PowerShell > "Run as administrator"
    cd path\to\ClinicSoftware\scripts\couchdb-setup
    .\install-couchdb.ps1
#>

$ErrorActionPreference = 'Stop'

# -----------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------
$CouchDbVersion  = "3.5.1"
$CouchDbMsiUrl   = "https://couchdb.neighbourhood.ie/downloads/$CouchDbVersion/win/apache-couchdb-$CouchDbVersion.msi"
$DefaultInstall   = "C:\CouchDB"
$DbName          = "clinicsoftware_v2"

# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------
function Write-Banner {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-OK {
    param([string]$Message)
    Write-Host "    [OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "    [!] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    [FAIL] $Message" -ForegroundColor Red
}

function Write-Pass {
    param([string]$Detail = "")
    Write-Host "    [PASS]$(if ($Detail) { " $Detail" })" -ForegroundColor Green
    $script:PassCount++
}

# -----------------------------------------------------------------------
# Embedded: validate_doc_update design document
# -----------------------------------------------------------------------
$ValidateDocUpdate = @'
{
  "_id": "_design/roles",
  "validate_doc_update": "function(newDoc, oldDoc, userCtx, secObj) { var isAdmin = userCtx.roles.indexOf('_admin') !== -1 || userCtx.roles.indexOf('doctor') !== -1; var isNurse = userCtx.roles.indexOf('nurse') !== -1; var restricted = ['visit', 'visitmed', 'drug']; if (isNurse && restricted.indexOf(newDoc.type) !== -1) { throw({ forbidden: 'Nurse role cannot write ' + newDoc.type + ' documents.' }); } }"
}
'@

# -----------------------------------------------------------------------
# Embedded: local.ini configuration
# -----------------------------------------------------------------------
$LocalIniContent = @'
; CouchDB configuration for ClinicSoftware LAN deployment
; Applied automatically by install-couchdb.ps1

[chttpd]
bind_address = 0.0.0.0
port = 5984

[chttpd_auth]
require_valid_user_except_for_up = true

[httpd]
enable_cors = true

[cors]
origins = *
credentials = false
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer
'@

# =====================================================================
#  PHASE 1: COLLECT PASSWORDS
# =====================================================================
Write-Banner "ClinicSoftware CouchDB Installer"

Write-Host "  This will install and configure CouchDB on this machine."
Write-Host "  The nurse's machine needs nothing installed (just the same WiFi)."
Write-Host ""
$AdminPw  = "admin123"
$DoctorPw = "doctor123"
$NursePw  = "nurse123"
$InstallPath = $DefaultInstall

if ($InstallPath -match ' ') {
    Write-Fail "Install path '$InstallPath' contains spaces. Erlang cannot handle spaces in paths. Use something like C:\CouchDB"
    exit 1
}

$BaseUrl  = "http://localhost:5984"
$AdminUrl = "http://admin:${AdminPw}@localhost:5984"

# =====================================================================
#  PHASE 2: DOWNLOAD COUCHDB
# =====================================================================
Write-Banner "Downloading CouchDB $CouchDbVersion"

$MsiPath = Join-Path $env:TEMP "apache-couchdb-$CouchDbVersion.msi"

if ((Test-Path $MsiPath) -and (Get-Item $MsiPath).Length -gt 50MB) {
    Write-Warn "MSI already exists at $MsiPath (reusing)"
} else {
    if (Test-Path $MsiPath) { Remove-Item $MsiPath -Force }
    Write-Step "Downloading CouchDB (this may take a few minutes)"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($CouchDbMsiUrl, $MsiPath)
        Write-OK "Downloaded to $MsiPath"
    } catch {
        Write-Fail "Download failed: $_"
        Write-Host ""
        Write-Host "  Manual download: https://couchdb.apache.org/#download" -ForegroundColor Yellow
        Write-Host "  Then re-run this script (it will find the MSI in $env:TEMP)" -ForegroundColor Yellow
        exit 1
    }
}

# =====================================================================
#  PHASE 3: INSTALL COUCHDB
# =====================================================================
Write-Banner "Installing CouchDB"

Write-Step "Running MSI installer (silent, this takes ~60 seconds)"

$msiArgs = @(
    "/i", $MsiPath,
    "/quiet",
    "INSTALLSERVICE=1",
    "ADMINUSER=admin",
    "ADMINPASSWORD=$AdminPw",
    "APPLICATIONFOLDER=$InstallPath",
    "/norestart",
    "/l*", (Join-Path $env:TEMP "couchdb-install.log")
)

$msiProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru
if ($msiProcess.ExitCode -ne 0) {
    Write-Fail "MSI installer failed (exit code $($msiProcess.ExitCode)). Check $env:TEMP\couchdb-install.log"
    exit 1
}
Write-OK "MSI installer completed"

# Wait for files
Write-Step "Waiting for installation files"
$localIniPath = Join-Path $InstallPath "etc\local.ini"
$timeout = 60; $elapsed = 0
while (-not (Test-Path $localIniPath) -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 2; $elapsed += 2
}
if (-not (Test-Path $localIniPath)) {
    Write-Fail "local.ini not found at $localIniPath after ${timeout}s"
    exit 1
}
Write-OK "Installation files confirmed"

# =====================================================================
#  PHASE 4: CONFIGURE
# =====================================================================
Write-Banner "Configuring CouchDB"

Write-Step "Applying local.ini (LAN binding, auth, CORS)"
Set-Content -Path $localIniPath -Value $LocalIniContent -Encoding UTF8
Write-OK "local.ini written to $localIniPath"

Write-Step "Opening Windows Firewall port 5984 (LAN only)"
$existingRule = Get-NetFirewallRule -DisplayName "CouchDB LAN" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -DisplayName "CouchDB LAN"
    Write-Warn "Removed existing rule"
}
New-NetFirewallRule `
    -DisplayName "CouchDB LAN" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5984 `
    -Action Allow `
    -Profile Domain, Private | Out-Null
Write-OK "Firewall rule created (Domain/Private profiles only, not Public)"

# =====================================================================
#  PHASE 5: START SERVICE
# =====================================================================
Write-Banner "Starting CouchDB Service"

Restart-Service -Name Apache_CouchDB -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$svc = Get-Service -Name Apache_CouchDB -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Write-Fail "Service 'Apache_CouchDB' not found. Installation may have failed."
    exit 1
}
if ($svc.Status -ne 'Running') {
    Start-Service -Name Apache_CouchDB
    Start-Sleep -Seconds 3
    $svc.Refresh()
}
if ($svc.Status -ne 'Running') {
    Write-Fail "Service failed to start. Check Windows Event Log for Erlang errors."
    exit 1
}
Write-OK "Service running (auto-starts on boot)"

# Wait for HTTP
Write-Step "Waiting for CouchDB HTTP"
$timeout = 30; $elapsed = 0; $ready = $false
while (-not $ready -and $elapsed -lt $timeout) {
    try {
        $ErrorActionPreference = 'Stop'
        $up = Invoke-RestMethod -Uri "$BaseUrl/_up"
        if ($up.status -eq "ok") { $ready = $true }
        $ErrorActionPreference = 'Stop'
    } catch { }
    if (-not $ready) { Start-Sleep -Seconds 2; $elapsed += 2 }
}
if (-not $ready) {
    Write-Fail "CouchDB not responding after ${timeout}s"
    exit 1
}
Write-OK "CouchDB accepting connections"

# =====================================================================
#  PHASE 6: CREATE DATABASE AND USERS
# =====================================================================
Write-Banner "Setting Up Database"

# System databases (required for CouchDB 3.x)
Write-Step "Creating system databases"
foreach ($sysDb in @("_users", "_replicator", "_global_changes")) {
    try {
        Invoke-RestMethod -Method Put -Uri "$AdminUrl/$sysDb" | Out-Null
        Write-OK "$sysDb created"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 412) {
            Write-Warn "$sysDb already exists"
        }
    }
}

# Application database
Write-Step "Creating database: $DbName"
try {
    Invoke-RestMethod -Method Put -Uri "$AdminUrl/$DbName" | Out-Null
    Write-OK "Database created"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 412) {
        Write-Warn "Database already exists"
    } else {
        Write-Fail "Failed to create database: $_"
        exit 1
    }
}

# Doctor user
Write-Step "Creating doctor user"
$doctorDoc = @{
    _id      = "org.couchdb.user:doctor"
    name     = "doctor"
    password = $DoctorPw
    roles    = @("doctor")
    type     = "user"
} | ConvertTo-Json -Compress

try {
    Invoke-RestMethod -Method Put -Uri "$AdminUrl/_users/org.couchdb.user:doctor" `
        -ContentType "application/json" -Body $doctorDoc | Out-Null
    Write-OK "Doctor user created (role: doctor)"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Warn "Doctor user already exists"
    } else {
        Write-Fail "Failed: $_"; exit 1
    }
}

# Nurse user
Write-Step "Creating nurse user"
$nurseDoc = @{
    _id      = "org.couchdb.user:nurse"
    name     = "nurse"
    password = $NursePw
    roles    = @("nurse")
    type     = "user"
} | ConvertTo-Json -Compress

try {
    Invoke-RestMethod -Method Put -Uri "$AdminUrl/_users/org.couchdb.user:nurse" `
        -ContentType "application/json" -Body $nurseDoc | Out-Null
    Write-OK "Nurse user created (role: nurse)"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Warn "Nurse user already exists"
    } else {
        Write-Fail "Failed: $_"; exit 1
    }
}

# Security object
Write-Step "Setting database security"
$securityDoc = @{
    admins  = @{ names = @(); roles = @("doctor") }
    members = @{ names = @(); roles = @("doctor", "nurse") }
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Put -Uri "$AdminUrl/$DbName/_security" `
    -ContentType "application/json" -Body $securityDoc | Out-Null
Write-OK "Doctor=admin+member, Nurse=member only"

# Design document (role enforcement)
Write-Step "Deploying write restrictions"
try {
    Invoke-RestMethod -Method Put -Uri "$AdminUrl/$DbName/_design/roles" `
        -ContentType "application/json" -Body $ValidateDocUpdate | Out-Null
    Write-OK "Nurse blocked from writing: visit, visitmed, drug"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Warn "Design document already exists"
    } else {
        Write-Fail "Failed: $_"; exit 1
    }
}

# =====================================================================
#  PHASE 7: VERIFICATION (6 checks)
# =====================================================================
Write-Banner "Verifying Installation"

$DoctorUrl = "http://doctor:${DoctorPw}@localhost:5984"
$NurseUrl  = "http://nurse:${NursePw}@localhost:5984"
$PassCount = 0
$TotalCount = 6

# Check 1: Service running + auto-start
Write-Host ""
Write-Host "--- Check 1/6: Service running and auto-start ---" -ForegroundColor Cyan
$svc = Get-Service -Name Apache_CouchDB
if ($svc.Status -eq 'Running') {
    $startType = (Get-WmiObject -Class Win32_Service -Filter "Name='Apache_CouchDB'" -ErrorAction SilentlyContinue).StartMode
    if ($startType -eq "Auto" -or $svc.StartType -eq "Automatic") {
        Write-Pass "Running, StartType=Automatic"
    } else {
        Write-Fail "Running but StartType=$startType (expected Auto)"
    }
} else {
    Write-Fail "Service status: $($svc.Status)"
}

# Check 2: /_up responds
Write-Host ""
Write-Host "--- Check 2/6: CouchDB responding ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    $up = Invoke-RestMethod -Uri "$BaseUrl/_up"
    $ErrorActionPreference = 'Stop'
    if ($up.status -eq "ok") { Write-Pass "/_up status=ok" }
    else { Write-Fail "/_up status=$($up.status)" }
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "/_up failed: $_"
}

# Check 3: Unauthenticated rejected
Write-Host ""
Write-Host "--- Check 3/6: Auth enforced (401 on unauthenticated) ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Uri "$BaseUrl/$DbName" | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Fail "Unauthenticated request succeeded (should be 401)"
} catch {
    $ErrorActionPreference = 'Stop'
    $sc = $_.Exception.Response.StatusCode.value__
    if ($sc -eq 401 -or $sc -eq 403) { Write-Pass "Rejected with HTTP $sc" }
    else { Write-Fail "Unexpected HTTP $sc" }
}

# Check 4: Doctor writes visit
Write-Host ""
Write-Host "--- Check 4/6: Doctor CAN write visit ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put -Uri "$DoctorUrl/$DbName/visit:verify_test" `
        -ContentType "application/json" `
        -Body '{"_id":"visit:verify_test","type":"visit","patientId":"p_test"}' | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Pass "Doctor wrote visit document"
    try {
        $doc = Invoke-RestMethod -Uri "$AdminUrl/$DbName/visit:verify_test"
        Invoke-RestMethod -Method Delete -Uri "$AdminUrl/$DbName/visit:verify_test?rev=$($doc._rev)" | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "Doctor write failed: $_"
}

# Check 5: Nurse blocked from visit
Write-Host ""
Write-Host "--- Check 5/6: Nurse CANNOT write visit ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put -Uri "$NurseUrl/$DbName/visit:verify_test2" `
        -ContentType "application/json" `
        -Body '{"_id":"visit:verify_test2","type":"visit","patientId":"p_test"}' | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Fail "Nurse write SUCCEEDED (should be forbidden)"
    try {
        $doc = Invoke-RestMethod -Uri "$AdminUrl/$DbName/visit:verify_test2"
        Invoke-RestMethod -Method Delete -Uri "$AdminUrl/$DbName/visit:verify_test2?rev=$($doc._rev)" | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'Stop'
    $body = $_.ErrorDetails.Message
    $sc = $_.Exception.Response.StatusCode.value__
    if ($body -match "forbidden" -or $sc -eq 403) {
        Write-Pass "Nurse correctly blocked (HTTP 403)"
    } else {
        Write-Fail "Unexpected error (HTTP $sc): $_"
    }
}

# Check 6: Nurse writes patient
Write-Host ""
Write-Host "--- Check 6/6: Nurse CAN write patient ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put -Uri "$NurseUrl/$DbName/patient:verify_test" `
        -ContentType "application/json" `
        -Body '{"_id":"patient:verify_test","type":"patient","firstName":"Test"}' | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Pass "Nurse wrote patient document"
    try {
        $doc = Invoke-RestMethod -Uri "$AdminUrl/$DbName/patient:verify_test"
        Invoke-RestMethod -Method Delete -Uri "$AdminUrl/$DbName/patient:verify_test?rev=$($doc._rev)" | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "Nurse patient write failed: $_"
}

# =====================================================================
#  SUMMARY
# =====================================================================
Write-Host ""
Write-Host ""

if ($PassCount -eq $TotalCount) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  ALL $TotalCount/$TotalCount CHECKS PASSED" -ForegroundColor Green
    Write-Host "  CouchDB is ready!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    $failed = $TotalCount - $PassCount
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "  $failed CHECK(S) FAILED" -ForegroundColor Red
    Write-Host "  Review errors above" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "  Endpoint:  http://localhost:5984" -ForegroundColor White
Write-Host "  Database:  $DbName" -ForegroundColor White
Write-Host ""

# Print LAN IP for nurse
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.PrefixOrigin -eq 'Dhcp' } |
    Select-Object -First 1).IPAddress

if ($lanIp) {
    Write-Host "  Doctor writes: everything" -ForegroundColor White
    Write-Host "  Nurse writes:  patient, recent, settings (blocked: visit, visitmed, drug)" -ForegroundColor White
    Write-Host ""
    Write-Host "  --------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  NURSE CONNECTION URL:  http://$lanIp`:5984" -ForegroundColor Yellow
    Write-Host "  --------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Save this URL. You will need it when configuring the app." -ForegroundColor Yellow
} else {
    Write-Host "  Could not detect LAN IP. Find it manually:" -ForegroundColor Yellow
    Write-Host "    ipconfig | findstr IPv4" -ForegroundColor Yellow
}

Write-Host ""

if ($PassCount -ne $TotalCount) { exit 1 }
