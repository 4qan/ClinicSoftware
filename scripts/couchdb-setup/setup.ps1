#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Sets up CouchDB on the doctor's Windows machine for ClinicSoftware LAN sync.

.DESCRIPTION
    Installs CouchDB as a Windows service, applies the LAN configuration,
    opens the firewall, creates the database, creates user accounts, sets the
    security object, and deploys the role enforcement design document.

    Run this script ONCE on the doctor's machine before using Phase 22 sync.

.PARAMETER CouchDbInstaller
    Path to the downloaded CouchDB MSI installer (e.g. C:\Downloads\apache-couchdb-3.5.1.msi)

.PARAMETER AdminPassword
    Password for the CouchDB admin account. Used for maintenance only.

.PARAMETER DoctorPassword
    Password for the doctor user account. Used by the app for sync.

.PARAMETER NursePassword
    Password for the nurse user account. Used by the app for sync on the nurse's machine.

.PARAMETER InstallPath
    CouchDB installation directory. Default: C:\CouchDB
    WARNING: Do not use a path with spaces. Erlang has issues with spaces in paths.

.EXAMPLE
    .\setup.ps1 -CouchDbInstaller "C:\Downloads\apache-couchdb-3.5.1.msi" `
                -AdminPassword "ADMIN_PW" `
                -DoctorPassword "DOCTOR_PW" `
                -NursePassword "NURSE_PW"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$CouchDbInstaller,

    [Parameter(Mandatory = $true)]
    [string]$AdminPassword,

    [Parameter(Mandatory = $true)]
    [string]$DoctorPassword,

    [Parameter(Mandatory = $true)]
    [string]$NursePassword,

    [Parameter(Mandatory = $false)]
    [string]$InstallPath = "C:\CouchDB"
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BaseUrl = "http://localhost:5984"
$AdminUrl = "http://admin:${AdminPassword}@localhost:5984"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "    [OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    [FAIL] $Message" -ForegroundColor Red
}

# -----------------------------------------------------------------------
# Step 1: Validate prerequisites
# -----------------------------------------------------------------------
Write-Step "Validating prerequisites"

if (-not (Test-Path $CouchDbInstaller)) {
    Write-Fail "CouchDB installer not found: $CouchDbInstaller"
    exit 1
}
Write-Success "CouchDB installer found: $CouchDbInstaller"

if ($InstallPath -match ' ') {
    Write-Fail "InstallPath '$InstallPath' contains spaces. Erlang will fail to start. Use a path without spaces (e.g. C:\CouchDB)."
    exit 1
}
Write-Success "Install path has no spaces: $InstallPath"

# -----------------------------------------------------------------------
# Step 2: Install CouchDB as a Windows service
# -----------------------------------------------------------------------
Write-Step "Installing CouchDB (this may take a minute)"

$msiArgs = @(
    "/i", $CouchDbInstaller,
    "/quiet",
    "INSTALLSERVICE=1",
    "ADMINUSER=admin",
    "ADMINPASSWORD=$AdminPassword",
    "INSTALLDIR=$InstallPath",
    "/norestart",
    "/l*", "couchdb-install.log"
)

$msiProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru
if ($msiProcess.ExitCode -ne 0) {
    Write-Fail "MSI installer failed with exit code $($msiProcess.ExitCode). Check couchdb-install.log for details."
    exit 1
}
Write-Success "MSI installer completed"

# Wait for installation files to be present (up to 60 seconds)
Write-Step "Waiting for CouchDB installation to settle"
$localIniPath = Join-Path $InstallPath "etc\local.ini"
$timeout = 60
$elapsed = 0
while (-not (Test-Path $localIniPath) -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if (-not (Test-Path $localIniPath)) {
    Write-Fail "local.ini not found at $localIniPath after ${timeout}s. Installation may have failed."
    exit 1
}
Write-Success "Installation files confirmed at $InstallPath"

# -----------------------------------------------------------------------
# Step 3: Apply local.ini configuration
# -----------------------------------------------------------------------
Write-Step "Applying CouchDB configuration (local.ini)"

$sourceIni = Join-Path $ScriptDir "local.ini"
if (-not (Test-Path $sourceIni)) {
    Write-Fail "local.ini not found in script directory: $ScriptDir"
    exit 1
}
Copy-Item -Path $sourceIni -Destination $localIniPath -Force
Write-Success "local.ini copied to $localIniPath"

# -----------------------------------------------------------------------
# Step 4: Open Windows Firewall for CouchDB LAN access
# -----------------------------------------------------------------------
Write-Step "Opening Windows Firewall port 5984 (Domain/Private profiles only)"

# Remove existing rule if present to avoid duplicates
$existingRule = Get-NetFirewallRule -DisplayName "CouchDB LAN" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -DisplayName "CouchDB LAN"
    Write-Host "    Removed existing CouchDB LAN rule" -ForegroundColor Yellow
}

New-NetFirewallRule `
    -DisplayName "CouchDB LAN" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5984 `
    -Action Allow `
    -Profile Domain, Private | Out-Null

Write-Success "Firewall rule created (Domain/Private profiles, port 5984 inbound)"

# -----------------------------------------------------------------------
# Step 5: Restart CouchDB service
# -----------------------------------------------------------------------
Write-Step "Starting CouchDB service"

Restart-Service -Name Apache_CouchDB -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# If restart failed, try explicit start
$svc = Get-Service -Name Apache_CouchDB -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Write-Fail "Apache_CouchDB service not found. Installation may have failed."
    exit 1
}
if ($svc.Status -ne 'Running') {
    Start-Service -Name Apache_CouchDB
    Start-Sleep -Seconds 3
}

$svc.Refresh()
if ($svc.Status -ne 'Running') {
    Write-Fail "CouchDB service failed to start. Check Windows Event Log for Erlang errors."
    exit 1
}
Write-Success "CouchDB service is running"

# -----------------------------------------------------------------------
# Step 6: Wait for CouchDB HTTP to respond
# -----------------------------------------------------------------------
Write-Step "Waiting for CouchDB to accept HTTP connections"

$timeout = 30
$elapsed = 0
$ready = $false
while (-not $ready -and $elapsed -lt $timeout) {
    try {
        $up = Invoke-RestMethod -Uri "$BaseUrl/_up" -ErrorAction SilentlyContinue
        if ($up.status -eq "ok") {
            $ready = $true
        }
    } catch {
        # Not ready yet
    }
    if (-not $ready) {
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
}
if (-not $ready) {
    Write-Fail "CouchDB did not respond on $BaseUrl/_up after ${timeout}s."
    exit 1
}
Write-Success "CouchDB is accepting connections at $BaseUrl"

# -----------------------------------------------------------------------
# Step 7a: Create system databases (required for CouchDB 3.x)
# -----------------------------------------------------------------------
Write-Step "Creating system databases"

foreach ($sysDb in @("_users", "_replicator", "_global_changes")) {
    try {
        Invoke-RestMethod -Method Put -Uri "$AdminUrl/$sysDb" | Out-Null
        Write-Success "$sysDb created"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 412) {
            Write-Host "    $sysDb already exists (skipping)" -ForegroundColor Yellow
        } else {
            Write-Host "    $sysDb returned error (non-fatal): $_" -ForegroundColor Yellow
        }
    }
}

# -----------------------------------------------------------------------
# Step 7b: Create the clinicsoftware_v2 database
# -----------------------------------------------------------------------
Write-Step "Creating database: clinicsoftware_v2"

try {
    Invoke-RestMethod -Method Put -Uri "$AdminUrl/clinicsoftware_v2" | Out-Null
    Write-Success "Database clinicsoftware_v2 created"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 412) {
        Write-Host "    Database already exists (skipping)" -ForegroundColor Yellow
    } else {
        Write-Fail "Failed to create database: $_"
        exit 1
    }
}

# -----------------------------------------------------------------------
# Step 8: Create doctor user
# -----------------------------------------------------------------------
Write-Step "Creating user: doctor"

$doctorDoc = @{
    _id      = "org.couchdb.user:doctor"
    name     = "doctor"
    password = $DoctorPassword
    roles    = @("doctor")
    type     = "user"
} | ConvertTo-Json -Compress

try {
    Invoke-RestMethod -Method Put `
        -Uri "$AdminUrl/_users/org.couchdb.user:doctor" `
        -ContentType "application/json" `
        -Body $doctorDoc | Out-Null
    Write-Success "Doctor user created with role: doctor"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "    Doctor user already exists (skipping)" -ForegroundColor Yellow
    } else {
        Write-Fail "Failed to create doctor user: $_"
        exit 1
    }
}

# -----------------------------------------------------------------------
# Step 9: Create nurse user
# -----------------------------------------------------------------------
Write-Step "Creating user: nurse"

$nurseDoc = @{
    _id      = "org.couchdb.user:nurse"
    name     = "nurse"
    password = $NursePassword
    roles    = @("nurse")
    type     = "user"
} | ConvertTo-Json -Compress

try {
    Invoke-RestMethod -Method Put `
        -Uri "$AdminUrl/_users/org.couchdb.user:nurse" `
        -ContentType "application/json" `
        -Body $nurseDoc | Out-Null
    Write-Success "Nurse user created with role: nurse"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "    Nurse user already exists (skipping)" -ForegroundColor Yellow
    } else {
        Write-Fail "Failed to create nurse user: $_"
        exit 1
    }
}

# -----------------------------------------------------------------------
# Step 10: Set database security object
# -----------------------------------------------------------------------
Write-Step "Setting database security object"

$securityDoc = @{
    admins  = @{ names = @(); roles = @("doctor") }
    members = @{ names = @(); roles = @("doctor", "nurse") }
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Put `
    -Uri "$AdminUrl/clinicsoftware_v2/_security" `
    -ContentType "application/json" `
    -Body $securityDoc | Out-Null

Write-Success "Security object set (doctor=admin+member, nurse=member)"

# -----------------------------------------------------------------------
# Step 11: Deploy validate_doc_update design document
# -----------------------------------------------------------------------
Write-Step "Deploying role enforcement design document"

$designDocPath = Join-Path $ScriptDir "validate_doc_update.json"
if (-not (Test-Path $designDocPath)) {
    Write-Fail "validate_doc_update.json not found in script directory: $ScriptDir"
    exit 1
}

$designDocBody = Get-Content $designDocPath -Raw

try {
    Invoke-RestMethod -Method Put `
        -Uri "$AdminUrl/clinicsoftware_v2/_design/roles" `
        -ContentType "application/json" `
        -Body $designDocBody | Out-Null
    Write-Success "Design document deployed (_design/roles with validate_doc_update)"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "    Design document already exists (skipping)" -ForegroundColor Yellow
    } else {
        Write-Fail "Failed to deploy design document: $_"
        exit 1
    }
}

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  CouchDB setup complete" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Service:   Apache_CouchDB (auto-starts on boot)"
Write-Host "  Endpoint:  $BaseUrl"
Write-Host "  Database:  clinicsoftware_v2"
Write-Host "  Users:     doctor (role: doctor), nurse (role: nurse)"
Write-Host "  Firewall:  Port 5984 open (Domain/Private profiles)"
Write-Host ""
Write-Host "  Nurse is blocked from writing: visit, visitmed, drug"
Write-Host "  Nurse can write:               patient, recent, settings"
Write-Host ""
Write-Host "  Next step: run .\verify.ps1 to confirm all requirements pass."
Write-Host ""
