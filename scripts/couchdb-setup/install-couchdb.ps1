#Requires -RunAsAdministrator
<#
.SYNOPSIS
    One-click CouchDB installer for ClinicSoftware.
    Self-contained: downloads CouchDB, installs, configures HTTPS, creates users, verifies.
    Run this ONCE on the doctor's Windows machine.

.DESCRIPTION
    This script handles everything:
    1. Downloads CouchDB 3.5.1 MSI
    2. Installs as a Windows service (auto-starts on boot)
    3. Generates a self-signed SSL certificate for HTTPS (no external tools needed)
    4. Configures CouchDB with HTTPS on port 6984
    5. Opens firewall for LAN access (ports 5984 + 6984)
    6. Creates the database with role-based security
    7. Creates doctor + nurse user accounts
    8. Deploys document-level write restrictions
    9. Runs 7 verification checks

    No other files needed. Just run this script.

.EXAMPLE
    Right-click PowerShell > "Run as administrator"
    cd path\to\ClinicSoftware\scripts\couchdb-setup
    .\install-couchdb.ps1
#>

# -----------------------------------------------------------------------
# Logging (must run BEFORE setting ErrorActionPreference)
# -----------------------------------------------------------------------
$LogPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "couchdb-setup.log"
try { Stop-Transcript } catch {}
Start-Transcript -Path $LogPath -Force | Out-Null

$ErrorActionPreference = 'Stop'
Write-Host "  Log file: $LogPath" -ForegroundColor Gray

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


# Embedded: validate_doc_update design document
$ValidateDocUpdate = @'
{
  "_id": "_design/roles",
  "validate_doc_update": "function(newDoc, oldDoc, userCtx, secObj) { var isAdmin = userCtx.roles.indexOf('_admin') !== -1 || userCtx.roles.indexOf('doctor') !== -1; var isNurse = userCtx.roles.indexOf('nurse') !== -1; var restricted = ['visit', 'visitmed', 'drug']; if (isNurse && restricted.indexOf(newDoc.type) !== -1) { throw({ forbidden: 'Nurse role cannot write ' + newDoc.type + ' documents.' }); } }"
}
'@

# =====================================================================
#  PHASE 1: CONFIGURATION
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
$HttpsUrl = "https://localhost:6984"

# PowerShell 5.1 does NOT extract credentials from URLs, must use explicit Authorization header
$AdminAuth = @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:${AdminPw}")) }
$DoctorAuth = @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("doctor:${DoctorPw}")) }
$NurseAuth = @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("nurse:${NursePw}")) }

# Detect LAN IP early (needed for SSL cert generation)
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and ($_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual') -and $_.IPAddress -ne '127.0.0.1' } |
    Select-Object -First 1).IPAddress

if (-not $lanIp) {
    Write-Warn "Could not detect LAN IP. SSL cert will only cover localhost."
    Write-Warn "Find IP manually: ipconfig | findstr IPv4"
    $lanIp = "127.0.0.1"
}
Write-OK "LAN IP detected: $lanIp"


# =====================================================================
#  CHECK FOR EXISTING INSTALLATION
# =====================================================================
$existingSvc = Get-Service -Name "Apache CouchDB" -ErrorAction SilentlyContinue
$alreadyInstalled = $false

if ($null -ne $existingSvc) {
    Write-Banner "CouchDB Already Installed"
    Write-OK "Service 'Apache CouchDB' found (Status: $($existingSvc.Status))"
    Write-Host "  Skipping download and install. Will re-apply configuration." -ForegroundColor Yellow
    $alreadyInstalled = $true

    # Find local.ini in known locations
    $localIniPath = $null
    foreach ($searchPath in @($InstallPath, "C:\Program Files\Apache CouchDB")) {
        if (Test-Path $searchPath) {
            $found = Get-ChildItem -Path $searchPath -Filter "local.ini" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $localIniPath = $found.FullName; break }
        }
    }
    if ($null -eq $localIniPath) {
        Write-Fail "CouchDB service exists but local.ini not found. Manual inspection needed."
        exit 1
    }
    Write-OK "Found $localIniPath"
}

if (-not $alreadyInstalled) {
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
$localIniPath = $null
$timeout = 60; $elapsed = 0
while ($null -eq $localIniPath -and $elapsed -lt $timeout) {
    $found = Get-ChildItem -Path $InstallPath -Filter "local.ini" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $localIniPath = $found.FullName }
    else { Start-Sleep -Seconds 2; $elapsed += 2 }
}
if ($null -eq $localIniPath) {
    # Also check Program Files in case APPLICATIONFOLDER was ignored
    $altPath = "C:\Program Files\Apache CouchDB"
    if (Test-Path $altPath) {
        $found = Get-ChildItem -Path $altPath -Filter "local.ini" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $localIniPath = $found.FullName }
    }
}
if ($null -eq $localIniPath) {
    Write-Fail "local.ini not found under $InstallPath (or Program Files) after ${timeout}s"
    exit 1
}
Write-OK "Found $localIniPath"

} # end if (-not $alreadyInstalled)

# =====================================================================
#  PHASE 4: GENERATE SSL CERTIFICATE (pure PowerShell, no OpenSSL)
# =====================================================================
Write-Banner "Generating SSL Certificate"

$certDir = Split-Path $localIniPath
$certFile = Join-Path $certDir "cert.pem"
$keyFile = Join-Path $certDir "key.pem"

# CouchDB uses forward slashes even on Windows
$certFileForIni = ($certFile -replace '\\', '/')
$keyFileForIni = ($keyFile -replace '\\', '/')

if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Warn "SSL cert already exists at $certDir (regenerating)"
}

Write-Step "Generating self-signed certificate (valid 10 years)"
Write-Host "    SANs: localhost, 127.0.0.1, $lanIp" -ForegroundColor Gray

# Create cert with SANs using Windows built-in New-SelfSignedCertificate
$sanExtension = "2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1&IPAddress=$lanIp"
$cert = New-SelfSignedCertificate `
    -Subject "CN=ClinicSoftware CouchDB" `
    -TextExtension @($sanExtension) `
    -CertStoreLocation "cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(10) `
    -KeyExportPolicy Exportable `
    -KeyAlgorithm RSA `
    -KeyLength 2048

if (-not $cert) {
    Write-Fail "New-SelfSignedCertificate failed"
    exit 1
}
Write-OK "Certificate created (Thumbprint: $($cert.Thumbprint))"

# Export certificate to PEM (base64-encoded DER)
Write-Step "Exporting certificate to PEM"
$certBase64 = [Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPemContent = "-----BEGIN CERTIFICATE-----`r`n$certBase64`r`n-----END CERTIFICATE-----`r`n"
Set-Content -Path $certFile -Value $certPemContent -Encoding ASCII -NoNewline
Write-OK "cert.pem written"

# Export private key to PEM using CNG PKCS#8 export
Write-Step "Exporting private key to PEM"

# Add C# helper for PEM export (works on .NET Framework 4.6.2+ / PowerShell 5.1)
Add-Type -TypeDefinition @"
using System;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

public static class PemExporter {
    public static string ExportPrivateKeyPem(string thumbprint) {
        X509Store store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
        store.Open(OpenFlags.ReadOnly);
        X509Certificate2Collection certs = store.Certificates.Find(
            X509FindType.FindByThumbprint, thumbprint, false);
        store.Close();

        if (certs.Count == 0)
            throw new Exception("Certificate not found in store");

        RSA rsa = certs[0].GetRSAPrivateKey();
        RSACng rsaCng = rsa as RSACng;
        if (rsaCng == null)
            throw new Exception("Private key is not CNG-based. Cannot export.");

        byte[] pkcs8 = rsaCng.Key.Export(CngKeyBlobFormat.Pkcs8PrivateBlob);
        return "-----BEGIN PRIVATE KEY-----\r\n" +
            Convert.ToBase64String(pkcs8, Base64FormattingOptions.InsertLineBreaks) +
            "\r\n-----END PRIVATE KEY-----\r\n";
    }
}
"@ -ReferencedAssemblies @(
    [System.Security.Cryptography.X509Certificates.X509Certificate2].Assembly.Location,
    [System.Security.Cryptography.RSACng].Assembly.Location
) -ErrorAction Stop

try {
    $keyPemContent = [PemExporter]::ExportPrivateKeyPem($cert.Thumbprint)
    Set-Content -Path $keyFile -Value $keyPemContent -Encoding ASCII -NoNewline
    Write-OK "key.pem written"
} catch {
    Write-Fail "Private key export failed: $_"
    Write-Host "    Falling back to OpenSSL if available..." -ForegroundColor Yellow

    # Fallback: try OpenSSL via PFX export
    $opensslPath = (Get-Command openssl.exe -ErrorAction SilentlyContinue).Source
    if (-not $opensslPath) {
        # Check common Git for Windows locations
        foreach ($p in @("C:\Program Files\Git\usr\bin\openssl.exe", "C:\Program Files (x86)\Git\usr\bin\openssl.exe")) {
            if (Test-Path $p) { $opensslPath = $p; break }
        }
    }

    if ($opensslPath) {
        $pfxPath = Join-Path $env:TEMP "couchdb-temp.pfx"
        $pfxPwd = ConvertTo-SecureString -String "tempexport" -Force -AsPlainText
        Export-PfxCertificate -Cert "cert:\LocalMachine\My\$($cert.Thumbprint)" -FilePath $pfxPath -Password $pfxPwd | Out-Null
        & $opensslPath pkcs12 -in $pfxPath -nocerts -nodes -passin "pass:tempexport" -out $keyFile 2>$null
        Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
        if (Test-Path $keyFile) {
            Write-OK "key.pem written (via OpenSSL fallback)"
        } else {
            Write-Fail "Both PEM export methods failed. Cannot continue."
            exit 1
        }
    } else {
        Write-Fail "CNG export failed and OpenSSL not found. Install Git for Windows and re-run."
        exit 1
    }
}

if (-not (Test-Path $certFile) -or -not (Test-Path $keyFile)) {
    Write-Fail "SSL certificate files not created."
    exit 1
}

Write-OK "cert.pem: $certFile"
Write-OK "key.pem:  $keyFile"

# =====================================================================
#  PHASE 5: CONFIGURE
# =====================================================================
Write-Banner "Configuring CouchDB"

Write-Step "Applying local.ini (LAN binding, auth, CORS, SSL)"

$LocalIniContent = @"
; CouchDB configuration for ClinicSoftware LAN deployment
; Applied automatically by install-couchdb.ps1

[admins]
admin = $AdminPw

[chttpd]
bind_address = 0.0.0.0
port = 5984

[chttpd_auth]
require_valid_user_except_for_up = true

[httpd]
enable_cors = true

[ssl]
enable = true
port = 6984
cert_file = CERT_PATH_PLACEHOLDER
key_file = KEY_PATH_PLACEHOLDER

[cors]
origins = *
credentials = false
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer
"@

# Replace placeholders with actual paths (avoids heredoc variable expansion issues)
$LocalIniContent = $LocalIniContent -replace 'CERT_PATH_PLACEHOLDER', $certFileForIni
$LocalIniContent = $LocalIniContent -replace 'KEY_PATH_PLACEHOLDER', $keyFileForIni
Set-Content -Path $localIniPath -Value $LocalIniContent -Encoding UTF8
Write-OK "local.ini written to $localIniPath"

Write-Step "Opening Windows Firewall ports 5984 + 6984 (LAN only)"
foreach ($rule in @(
    @{ Name = "CouchDB HTTP"; Port = 5984 },
    @{ Name = "CouchDB HTTPS"; Port = 6984 }
)) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Remove-NetFirewallRule -DisplayName $rule.Name
        Write-Warn "Removed existing '$($rule.Name)' rule"
    }
    New-NetFirewallRule `
        -DisplayName $rule.Name `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $rule.Port `
        -Action Allow `
        -Profile Domain, Private | Out-Null
    Write-OK "Firewall rule '$($rule.Name)' created (port $($rule.Port), Domain/Private)"
}

# Also remove old "CouchDB LAN" rule if it exists from a previous install
$oldRule = Get-NetFirewallRule -DisplayName "CouchDB LAN" -ErrorAction SilentlyContinue
if ($oldRule) {
    Remove-NetFirewallRule -DisplayName "CouchDB LAN"
    Write-Warn "Removed old 'CouchDB LAN' firewall rule"
}

# =====================================================================
#  PHASE 6: START SERVICE
# =====================================================================
Write-Banner "Starting CouchDB Service"

# Force a full stop + start so the new local.ini is loaded
Write-Step "Stopping service"
Stop-Service -Name "Apache CouchDB" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Step "Starting service"
$svc = Get-Service -Name "Apache CouchDB" -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Write-Fail "Service 'Apache CouchDB' not found. Installation may have failed."
    exit 1
}
Start-Service -Name "Apache CouchDB"
Start-Sleep -Seconds 5
$svc.Refresh()
if ($svc.Status -ne 'Running') {
    Write-Fail "Service failed to start. Check Windows Event Log for Erlang errors."
    exit 1
}
Write-OK "Service running (auto-starts on boot)"

# Wait for HTTP
Write-Step "Waiting for CouchDB HTTP (port 5984)"
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
    Write-Fail "CouchDB not responding on HTTP after ${timeout}s"
    exit 1
}
Write-OK "HTTP ready at $BaseUrl"

# Wait for HTTPS
Write-Step "Waiting for CouchDB HTTPS (port 6984)"

# Allow self-signed cert for PowerShell verification
if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
    Add-Type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) { return true; }
    }
"@
}
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$timeout = 30; $elapsed = 0; $httpsReady = $false
while (-not $httpsReady -and $elapsed -lt $timeout) {
    try {
        $ErrorActionPreference = 'Stop'
        $up = Invoke-RestMethod -Uri "$HttpsUrl/_up"
        if ($up.status -eq "ok") { $httpsReady = $true }
        $ErrorActionPreference = 'Stop'
    } catch { }
    if (-not $httpsReady) { Start-Sleep -Seconds 2; $elapsed += 2 }
}
if (-not $httpsReady) {
    Write-Fail "CouchDB not responding on HTTPS after ${timeout}s"
    Write-Host "    Check that cert.pem and key.pem exist in: $certDir" -ForegroundColor Yellow
    Write-Host "    Check Windows Event Log for Erlang SSL errors" -ForegroundColor Yellow
    exit 1
}
Write-OK "HTTPS ready at $HttpsUrl"

# Finalize single-node setup
Write-Step "Finalizing single-node setup"
try {
    $setupBody = @{
        action       = "enable_single_node"
        username     = "admin"
        password     = $AdminPw
        bind_address = "0.0.0.0"
        port         = 5984
    } | ConvertTo-Json -Compress
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/_cluster_setup" -Headers $AdminAuth `
        -ContentType "application/json" -Body $setupBody | Out-Null
    Write-OK "Single-node setup complete"
} catch {
    if ($_.ErrorDetails.Message -match "already") {
        Write-Warn "Already configured as single node"
    } else {
        Write-Warn "Cluster setup returned: $($_.ErrorDetails.Message) (continuing anyway)"
    }
}

# Verify admin access
Write-Step "Verifying admin credentials"
try {
    $ErrorActionPreference = 'Stop'
    $session = Invoke-RestMethod -Uri "$BaseUrl/_session" -Headers $AdminAuth
    $ErrorActionPreference = 'Stop'
    $roles = ($session.userCtx.roles -join ", ")
    if ($session.userCtx.roles -contains "_admin") {
        Write-OK "Admin authenticated (roles: $roles)"
    } else {
        Write-Fail "Authenticated as '$($session.userCtx.name)' but missing _admin role (roles: $roles)"
        exit 1
    }
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "Admin authentication failed: $_"
    exit 1
}

# =====================================================================
#  PHASE 7: CREATE DATABASE AND USERS
# =====================================================================
Write-Banner "Setting Up Database"

# System databases
Write-Step "Creating system databases"
foreach ($sysDb in @("_users", "_replicator", "_global_changes")) {
    try {
        Invoke-RestMethod -Method Put -Uri "$BaseUrl/$sysDb" -Headers $AdminAuth | Out-Null
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
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/$DbName" -Headers $AdminAuth | Out-Null
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
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/_users/org.couchdb.user:doctor" -Headers $AdminAuth `
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
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/_users/org.couchdb.user:nurse" -Headers $AdminAuth `
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

Invoke-RestMethod -Method Put -Uri "$BaseUrl/$DbName/_security" -Headers $AdminAuth `
    -ContentType "application/json" -Body $securityDoc | Out-Null
Write-OK "Doctor=admin+member, Nurse=member only"

# Design document
Write-Step "Deploying write restrictions"
try {
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/$DbName/_design/roles" -Headers $AdminAuth `
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
#  PHASE 8: VERIFICATION (7 checks)
# =====================================================================
Write-Banner "Verifying Installation"

$PassCount = 0
$TotalCount = 7

# Check 1: Service running + auto-start
Write-Host ""
Write-Host "--- Check 1/7: Service running and auto-start ---" -ForegroundColor Cyan
$svc = Get-Service -Name "Apache CouchDB"
if ($svc.Status -eq 'Running') {
    $startType = (Get-WmiObject -Class Win32_Service -Filter "Name='Apache CouchDB'" -ErrorAction SilentlyContinue).StartMode
    if ($startType -eq "Auto" -or $svc.StartType -eq "Automatic") {
        Write-Pass "Running, StartType=Automatic"
    } else {
        Write-Fail "Running but StartType=$startType (expected Auto)"
    }
} else {
    Write-Fail "Service status: $($svc.Status)"
}

# Check 2: HTTP responds
Write-Host ""
Write-Host "--- Check 2/7: CouchDB HTTP responding ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    $up = Invoke-RestMethod -Uri "$BaseUrl/_up"
    $ErrorActionPreference = 'Stop'
    if ($up.status -eq "ok") { Write-Pass "HTTP /_up status=ok" }
    else { Write-Fail "/_up status=$($up.status)" }
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "HTTP /_up failed: $_"
}

# Check 3: HTTPS responds
Write-Host ""
Write-Host "--- Check 3/7: CouchDB HTTPS responding ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    $up = Invoke-RestMethod -Uri "$HttpsUrl/_up"
    $ErrorActionPreference = 'Stop'
    if ($up.status -eq "ok") { Write-Pass "HTTPS /_up status=ok (port 6984)" }
    else { Write-Fail "HTTPS /_up status=$($up.status)" }
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "HTTPS /_up failed: $_"
    Write-Host "    This means the SSL cert may not be configured correctly." -ForegroundColor Yellow
}

# Check 4: Unauthenticated rejected
Write-Host ""
Write-Host "--- Check 4/7: Auth enforced (401 on unauthenticated) ---" -ForegroundColor Cyan
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

# Check 5: Doctor writes visit
Write-Host ""
Write-Host "--- Check 5/7: Doctor CAN write visit ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/$DbName/visit:verify_test" -Headers $DoctorAuth `
        -ContentType "application/json" `
        -Body '{"_id":"visit:verify_test","type":"visit","patientId":"p_test"}' | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Pass "Doctor wrote visit document"
    try {
        $doc = Invoke-RestMethod -Uri "$BaseUrl/$DbName/visit:verify_test" -Headers $AdminAuth
        Invoke-RestMethod -Method Delete -Uri "$BaseUrl/$DbName/visit:verify_test?rev=$($doc._rev)" -Headers $AdminAuth | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'Stop'
    Write-Fail "Doctor write failed: $_"
}

# Check 6: Nurse blocked from visit
Write-Host ""
Write-Host "--- Check 6/7: Nurse CANNOT write visit ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/$DbName/visit:verify_test2" -Headers $NurseAuth `
        -ContentType "application/json" `
        -Body '{"_id":"visit:verify_test2","type":"visit","patientId":"p_test"}' | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Fail "Nurse write SUCCEEDED (should be forbidden)"
    try {
        $doc = Invoke-RestMethod -Uri "$BaseUrl/$DbName/visit:verify_test2" -Headers $AdminAuth
        Invoke-RestMethod -Method Delete -Uri "$BaseUrl/$DbName/visit:verify_test2?rev=$($doc._rev)" -Headers $AdminAuth | Out-Null
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

# Check 7: Nurse writes patient
Write-Host ""
Write-Host "--- Check 7/7: Nurse CAN write patient ---" -ForegroundColor Cyan
try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/$DbName/patient:verify_test" -Headers $NurseAuth `
        -ContentType "application/json" `
        -Body '{"_id":"patient:verify_test","type":"patient","firstName":"Test"}' | Out-Null
    $ErrorActionPreference = 'Stop'
    Write-Pass "Nurse wrote patient document"
    try {
        $doc = Invoke-RestMethod -Uri "$BaseUrl/$DbName/patient:verify_test" -Headers $AdminAuth
        Invoke-RestMethod -Method Delete -Uri "$BaseUrl/$DbName/patient:verify_test?rev=$($doc._rev)" -Headers $AdminAuth | Out-Null
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
Write-Host "  HTTP Endpoint:   http://localhost:5984" -ForegroundColor White
Write-Host "  HTTPS Endpoint:  https://localhost:6984" -ForegroundColor White
Write-Host "  Database:        $DbName" -ForegroundColor White
Write-Host ""
Write-Host "  Doctor writes: everything" -ForegroundColor White
Write-Host "  Nurse writes:  patient, recent, settings (blocked: visit, visitmed, drug)" -ForegroundColor White
Write-Host ""

if ($lanIp -ne "127.0.0.1") {
    Write-Host "  --------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  SETUP COMPLETE. Follow these steps to start using sync:" -ForegroundColor Cyan
    Write-Host "  --------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  STEP 1: Accept the SSL certificate (once per machine)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    On THIS machine (doctor), open Chrome and go to:" -ForegroundColor White
    Write-Host "      https://localhost:6984/" -ForegroundColor White
    Write-Host ""
    Write-Host "    On the NURSE's machine, open Chrome and go to:" -ForegroundColor White
    Write-Host "      https://${lanIp}:6984/" -ForegroundColor White
    Write-Host ""
    Write-Host "    Both: click 'Advanced' > 'Proceed to ...' to accept." -ForegroundColor White
    Write-Host "    You should see: {`"couchdb`":`"Welcome`",...}" -ForegroundColor Gray
    Write-Host "    This is a one-time step per browser." -ForegroundColor Gray
    Write-Host ""
    Write-Host "  STEP 2: Open the app and configure" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Open: https://4qan.github.io/ClinicSoftware/" -ForegroundColor White
    Write-Host ""
    Write-Host "    On first login, enter the server address:" -ForegroundColor White
    Write-Host "      Doctor machine:  https://localhost:6984" -ForegroundColor White
    Write-Host "      Nurse machine:   https://${lanIp}:6984" -ForegroundColor White
    Write-Host ""
    Write-Host "    Log in with your credentials. The sidebar should" -ForegroundColor White
    Write-Host "    show a green dot (synced) within a few seconds." -ForegroundColor White
    Write-Host ""
    Write-Host "  STEP 3 (recommended): Set a static IP on this machine" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Current IP: $lanIp" -ForegroundColor White
    Write-Host "    If this IP changes, the nurse's connection will break." -ForegroundColor White
    Write-Host "    Settings > Network > Wi-Fi > IP assignment > Manual" -ForegroundColor Gray
    Write-Host "  --------------------------------------------------------" -ForegroundColor Cyan
} else {
    Write-Host "  Could not detect LAN IP. Find it manually:" -ForegroundColor Yellow
    Write-Host "    ipconfig | findstr IPv4" -ForegroundColor Yellow
}

Write-Host ""

Stop-Transcript | Out-Null
Write-Host "  Full log saved to: $LogPath" -ForegroundColor Gray
Write-Host ""

if ($PassCount -ne $TotalCount) { exit 1 }
