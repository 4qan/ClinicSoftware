#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Verifies CouchDB infrastructure requirements for ClinicSoftware.

.DESCRIPTION
    Runs 6 checks covering all 4 INFRA requirements:
      INFRA-01: Windows service running and set to auto-start
      INFRA-02: CouchDB accessible on LAN (/_up responds)
      INFRA-03: Unauthenticated request rejected
      INFRA-04a: Doctor CAN write a visit document
      INFRA-04b: Nurse CANNOT write a visit document
      INFRA-04c: Nurse CAN write a patient document

    Cleans up all test documents after running.

.PARAMETER AdminPassword
    CouchDB admin account password.

.PARAMETER DoctorPassword
    Doctor user account password.

.PARAMETER NursePassword
    Nurse user account password.

.EXAMPLE
    .\verify.ps1 -AdminPassword "ADMIN_PW" -DoctorPassword "DOCTOR_PW" -NursePassword "NURSE_PW"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$AdminPassword,

    [Parameter(Mandatory = $true)]
    [string]$DoctorPassword,

    [Parameter(Mandatory = $true)]
    [string]$NursePassword
)

$ErrorActionPreference = 'SilentlyContinue'

$BaseUrl    = "http://localhost:5984"
$AdminUrl   = "http://admin:${AdminPassword}@localhost:5984"
$DoctorUrl  = "http://doctor:${DoctorPassword}@localhost:5984"
$NurseUrl   = "http://nurse:${NursePassword}@localhost:5984"
$DbPath     = "ClinicSoftware_v2"

$PassCount  = 0
$TotalCount = 6

function Write-Check {
    param([int]$Num, [string]$Label)
    Write-Host ""
    Write-Host "--- Check $Num / $TotalCount : $Label ---" -ForegroundColor Cyan
}

function Write-Pass {
    param([string]$Detail = "")
    Write-Host "    [PASS]$(if ($Detail) { " $Detail" })" -ForegroundColor Green
    $script:PassCount++
}

function Write-Fail {
    param([string]$Detail = "")
    Write-Host "    [FAIL]$(if ($Detail) { " $Detail" })" -ForegroundColor Red
}

# -----------------------------------------------------------------------
# Check 1 (INFRA-01): Windows service running and auto-start
# -----------------------------------------------------------------------
Write-Check 1 "INFRA-01 - CouchDB service running and set to Automatic"

$svc = Get-Service -Name Apache_CouchDB -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Write-Fail "Service 'Apache_CouchDB' not found. Is CouchDB installed?"
} elseif ($svc.Status -ne 'Running') {
    Write-Fail "Service status is '$($svc.Status)' (expected Running)"
} else {
    # Get startup type via WMI (Get-Service does not expose StartType on older PS versions)
    $startType = (Get-WmiObject -Class Win32_Service -Filter "Name='Apache_CouchDB'" -ErrorAction SilentlyContinue).StartMode
    if ($startType -eq "Auto" -or $svc.StartType -eq "Automatic") {
        Write-Pass "Status=Running, StartType=Automatic"
    } else {
        Write-Fail "Service is Running but StartType is '$startType' (expected Auto/Automatic). Run: Set-Service -Name Apache_CouchDB -StartupType Automatic"
    }
}

# -----------------------------------------------------------------------
# Check 2 (INFRA-02): CouchDB accessible on LAN (/_up endpoint)
# -----------------------------------------------------------------------
Write-Check 2 "INFRA-02 - CouchDB accessible on LAN (/_up responds)"

try {
    $ErrorActionPreference = 'Stop'
    $up = Invoke-RestMethod -Uri "$BaseUrl/_up"
    $ErrorActionPreference = 'SilentlyContinue'
    if ($up.status -eq "ok") {
        Write-Pass "/_up returned status=ok"
    } else {
        Write-Fail "/_up returned unexpected status: $($up.status)"
    }
} catch {
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Fail "/_up request failed: $_"
}

# Print LAN IP so the nurse's machine can be tested manually
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.PrefixOrigin -eq 'Dhcp' } |
    Select-Object -First 1).IPAddress

if ($lanIp) {
    Write-Host "    Nurse should verify LAN access from her machine: http://$lanIp`:5984/_up" -ForegroundColor Yellow
} else {
    Write-Host "    Could not detect DHCP LAN IP. Verify manually from nurse's machine." -ForegroundColor Yellow
}

# -----------------------------------------------------------------------
# Check 3 (INFRA-03): Unauthenticated request rejected
# -----------------------------------------------------------------------
Write-Check 3 "INFRA-03 - Unauthenticated request rejected (401)"

try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Uri "$BaseUrl/$DbPath" | Out-Null
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Fail "Unauthenticated request succeeded (expected 401). Check require_valid_user_except_for_up in local.ini."
} catch {
    $ErrorActionPreference = 'SilentlyContinue'
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Pass "Unauthenticated request correctly rejected with HTTP $statusCode"
    } else {
        Write-Fail "Request failed with unexpected status $statusCode : $_"
    }
}

# -----------------------------------------------------------------------
# Check 4 (INFRA-04a): Doctor CAN write a visit document
# -----------------------------------------------------------------------
Write-Check 4 "INFRA-04a - Doctor CAN write a visit document"

$visitDocId  = "visit:verify_test"
$visitDocBody = '{"_id":"visit:verify_test","type":"visit","patientId":"p_test"}'

try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put `
        -Uri "$DoctorUrl/$DbPath/$visitDocId" `
        -ContentType "application/json" `
        -Body $visitDocBody | Out-Null
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Pass "Doctor successfully wrote visit document"

    # Clean up
    try {
        $doc = Invoke-RestMethod -Uri "$AdminUrl/$DbPath/$visitDocId"
        Invoke-RestMethod -Method Delete -Uri "$AdminUrl/$DbPath/${visitDocId}?rev=$($doc._rev)" | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Fail "Doctor write failed (expected success): $_"
}

# -----------------------------------------------------------------------
# Check 5 (INFRA-04b): Nurse CANNOT write a visit document
# -----------------------------------------------------------------------
Write-Check 5 "INFRA-04b - Nurse CANNOT write a visit document (forbidden)"

$visitDocId2  = "visit:verify_test2"
$visitDocBody2 = '{"_id":"visit:verify_test2","type":"visit","patientId":"p_test"}'

try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put `
        -Uri "$NurseUrl/$DbPath/$visitDocId2" `
        -ContentType "application/json" `
        -Body $visitDocBody2 | Out-Null
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Fail "Nurse write SUCCEEDED (expected forbidden). The validate_doc_update function may not be deployed correctly."

    # Clean up if it somehow got written
    try {
        $doc = Invoke-RestMethod -Uri "$AdminUrl/$DbPath/$visitDocId2"
        Invoke-RestMethod -Method Delete -Uri "$AdminUrl/$DbPath/${visitDocId2}?rev=$($doc._rev)" | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'SilentlyContinue'
    $body = $_.ErrorDetails.Message
    if ($body -match "forbidden" -or $body -match "Nurse role cannot write") {
        Write-Pass "Nurse write correctly rejected: forbidden"
    } else {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 403) {
            Write-Pass "Nurse write rejected with HTTP 403 (forbidden)"
        } else {
            Write-Fail "Unexpected error (status $statusCode). Expected 403 forbidden. Error: $_"
        }
    }
}

# -----------------------------------------------------------------------
# Check 6 (INFRA-04c): Nurse CAN write a patient document
# -----------------------------------------------------------------------
Write-Check 6 "INFRA-04c - Nurse CAN write a patient document"

$patientDocId   = "patient:verify_test"
$patientDocBody = '{"_id":"patient:verify_test","type":"patient","firstName":"Test"}'

try {
    $ErrorActionPreference = 'Stop'
    Invoke-RestMethod -Method Put `
        -Uri "$NurseUrl/$DbPath/$patientDocId" `
        -ContentType "application/json" `
        -Body $patientDocBody | Out-Null
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Pass "Nurse successfully wrote patient document"

    # Clean up using admin credentials
    try {
        $doc = Invoke-RestMethod -Uri "$AdminUrl/$DbPath/$patientDocId"
        Invoke-RestMethod -Method Delete -Uri "$AdminUrl/$DbPath/${patientDocId}?rev=$($doc._rev)" | Out-Null
    } catch {}
} catch {
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Fail "Nurse patient write failed (expected success): $_"
}

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Verification complete: $PassCount / $TotalCount checks passed" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

if ($PassCount -eq $TotalCount) {
    Write-Host ""
    Write-Host "  CouchDB infrastructure is ready for Phase 22 (Live Sync)." -ForegroundColor Green
    Write-Host ""
} else {
    $failed = $TotalCount - $PassCount
    Write-Host ""
    Write-Host "  $failed check(s) failed. Review errors above and re-run setup.ps1 if needed." -ForegroundColor Red
    Write-Host ""
    exit 1
}
