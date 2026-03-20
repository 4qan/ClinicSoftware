#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Completely removes CouchDB and all ClinicSoftware data from this machine.
    Run this to start fresh before re-running install-couchdb.ps1.

.DESCRIPTION
    1. Stops the CouchDB service
    2. Uninstalls CouchDB via MSI
    3. Deletes the installation directory (C:\CouchDB)
    4. Removes Windows Firewall rules
    5. Removes leftover temp files

    WARNING: This deletes ALL CouchDB data including the clinicsoftware_v2 database.
    Export a backup from the app first if you need to keep patient data.

.EXAMPLE
    Right-click PowerShell > "Run as administrator"
    cd path\to\ClinicSoftware\scripts\couchdb-setup
    .\uninstall-couchdb.ps1
#>

$ErrorActionPreference = 'SilentlyContinue'

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-OK {
    param([string]$Message)
    Write-Host "    [OK] $Message" -ForegroundColor Green
}

function Write-Skip {
    param([string]$Message)
    Write-Host "    [--] $Message" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Red
Write-Host "  CouchDB Uninstaller" -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red
Write-Host ""
Write-Host "  This will COMPLETELY remove CouchDB and all clinic data."
Write-Host "  Make sure you have exported a backup if needed."
Write-Host ""

$confirm = Read-Host "  Type YES to proceed"
if ($confirm -ne "YES") {
    Write-Host "  Aborted." -ForegroundColor Yellow
    exit 0
}

# -----------------------------------------------------------------------
# Step 1: Stop the service
# -----------------------------------------------------------------------
Write-Step "Stopping CouchDB service"

$svc = Get-Service -Name "Apache CouchDB" -ErrorAction SilentlyContinue
if ($svc) {
    Stop-Service -Name "Apache CouchDB" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-OK "Service stopped"
} else {
    Write-Skip "Service 'Apache CouchDB' not found"
}

# -----------------------------------------------------------------------
# Step 2: Uninstall via MSI
# -----------------------------------------------------------------------
Write-Step "Uninstalling CouchDB"

# Find the MSI product code
$product = Get-WmiObject -Class Win32_Product -Filter "Name LIKE '%CouchDB%'" -ErrorAction SilentlyContinue
if ($product) {
    Write-Host "    Found: $($product.Name) ($($product.IdentifyingNumber))" -ForegroundColor Gray
    $uninstallProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList "/x", $product.IdentifyingNumber, "/quiet", "/norestart" -Wait -PassThru
    if ($uninstallProcess.ExitCode -eq 0) {
        Write-OK "MSI uninstall completed"
    } else {
        Write-Host "    [!] MSI uninstall returned exit code $($uninstallProcess.ExitCode)" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 3
} else {
    Write-Skip "No CouchDB MSI product found in registry"
}

# -----------------------------------------------------------------------
# Step 3: Delete installation directory
# -----------------------------------------------------------------------
Write-Step "Removing CouchDB files"

$paths = @(
    "C:\CouchDB",
    "C:\Program Files\Apache CouchDB",
    "C:\Program Files (x86)\Apache CouchDB"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $p)) {
            Write-OK "Deleted $p"
        } else {
            Write-Host "    [!] Could not fully delete $p (files may be locked)" -ForegroundColor Yellow
            Write-Host "        Delete manually after reboot: Remove-Item '$p' -Recurse -Force" -ForegroundColor Gray
        }
    } else {
        Write-Skip "$p does not exist"
    }
}

# -----------------------------------------------------------------------
# Step 4: Remove firewall rules
# -----------------------------------------------------------------------
Write-Step "Removing firewall rules"

foreach ($ruleName in @("CouchDB HTTP", "CouchDB HTTPS", "CouchDB LAN")) {
    $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($rule) {
        Remove-NetFirewallRule -DisplayName $ruleName
        Write-OK "Removed '$ruleName'"
    } else {
        Write-Skip "'$ruleName' rule not found"
    }
}

# -----------------------------------------------------------------------
# Step 5: Remove SSL certificate from Windows cert store
# -----------------------------------------------------------------------
Write-Step "Removing SSL certificate from cert store"

$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("My", "LocalMachine")
$store.Open("ReadWrite")
$certs = $store.Certificates | Where-Object { $_.Subject -eq "CN=ClinicSoftware CouchDB" }
foreach ($c in $certs) {
    $store.Remove($c)
    Write-OK "Removed cert: $($c.Thumbprint)"
}
if (-not $certs) {
    Write-Skip "No 'ClinicSoftware CouchDB' certs found in store"
}
$store.Close()

# -----------------------------------------------------------------------
# Step 6: Clean up temp files
# -----------------------------------------------------------------------
Write-Step "Cleaning up temp files"

$tempFiles = @(
    (Join-Path $env:TEMP "apache-couchdb-*.msi"),
    (Join-Path $env:TEMP "couchdb-install.log"),
    (Join-Path $env:TEMP "couchdb-openssl.cnf"),
    (Join-Path $env:TEMP "openssl-stderr.txt")
)

foreach ($pattern in $tempFiles) {
    $files = Get-Item $pattern -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        Remove-Item $f -Force -ErrorAction SilentlyContinue
        Write-OK "Deleted $($f.Name)"
    }
}

# -----------------------------------------------------------------------
# Step 6: Remove Erlang (optional, CouchDB installs its own bundled Erlang)
# -----------------------------------------------------------------------
Write-Step "Checking for standalone Erlang"

$erlang = Get-WmiObject -Class Win32_Product -Filter "Name LIKE '%Erlang%'" -ErrorAction SilentlyContinue
if ($erlang) {
    Write-Host "    Found: $($erlang.Name)" -ForegroundColor Yellow
    Write-Host "    Erlang is used by CouchDB but may also be used by other software." -ForegroundColor Yellow
    Write-Host "    Skipping automatic removal. Uninstall manually if not needed." -ForegroundColor Gray
} else {
    Write-Skip "No standalone Erlang found"
}

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Uninstall complete" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  CouchDB service, data, firewall rules, and temp files removed."
Write-Host ""
Write-Host "  To reinstall from scratch:" -ForegroundColor Cyan
Write-Host "    .\install-couchdb.ps1" -ForegroundColor White
Write-Host ""
