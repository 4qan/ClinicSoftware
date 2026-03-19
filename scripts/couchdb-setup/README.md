# CouchDB Setup Guide

One-time setup for the doctor's Windows machine. Run once before activating Phase 22 (Live Sync).

## Prerequisites

- Windows 10 or Windows 11 (doctor's machine)
- CouchDB 3.5.1 MSI installer downloaded from https://couchdb.apache.org/#download
- PowerShell running as Administrator (right-click PowerShell, "Run as administrator")
- Both machines (doctor + nurse) on the same LAN or WiFi network

## Setup Steps

**Step 1: Download CouchDB MSI**

Go to https://couchdb.apache.org/#download and download the Windows 64-bit MSI for version 3.5.1.

**Step 2: Open PowerShell as Administrator**

Press Win+S, type "PowerShell", right-click, "Run as administrator".

**Step 3: Navigate to the setup scripts**

```powershell
cd path\to\ClinicSoftware\scripts\couchdb-setup
```

**Step 4: Run setup.ps1**

```powershell
.\setup.ps1 `
  -CouchDbInstaller "C:\path\to\apache-couchdb-3.5.1.msi" `
  -AdminPassword "ADMIN_PW" `
  -DoctorPassword "DOCTOR_PW" `
  -NursePassword "NURSE_PW"
```

Replace `ADMIN_PW`, `DOCTOR_PW`, and `NURSE_PW` with the actual passwords (see Password Notes below). The script will print progress for each step and exit on any failure.

**Step 5: Run verify.ps1**

```powershell
.\verify.ps1 `
  -AdminPassword "ADMIN_PW" `
  -DoctorPassword "DOCTOR_PW" `
  -NursePassword "NURSE_PW"
```

All 6 checks must pass. The verify script also prints the doctor's LAN IP address that the nurse's machine uses to connect.

**Step 6: Confirm LAN connectivity from nurse's machine**

The verify script prints a URL in the form `http://192.168.X.Y:5984/_up`. Open that URL in a browser on the nurse's machine. It should return `{"status":"ok"}`.

## Password Notes

- Choose strong passwords for all three accounts.
- Store the passwords in a physical note kept at the clinic. Do not store them in any digital file on the machine or in this repository.
- The doctor and nurse passwords will be used again in Phase 21 when configuring app login. Keep them accessible.
- The admin password is for CouchDB maintenance only and is not used by the app.

## What Gets Configured

- CouchDB 3.5.1 installed as a Windows service (auto-starts on every boot)
- CouchDB bound to `0.0.0.0:5984` (accessible from the entire LAN)
- Windows Firewall inbound rule for port 5984 (Domain and Private network profiles only, not Public)
- Authentication required for all data endpoints (`/_up` remains open for connectivity checks)
- CORS enabled for all origins with Basic auth headers (no cookies)
- Database: `ClinicSoftware_v2` (matches the local PouchDB database name)
- Users: `doctor` (full read/write access), `nurse` (read all, write patients and settings only)
- Nurse role blocked at the database level from writing: visits, visit medications, drugs

## Troubleshooting

**Service not starting after install**

Check Windows Event Log (Event Viewer > Windows Logs > Application) for Erlang errors. The most common cause is an installation path containing spaces. Uninstall CouchDB, re-run `setup.ps1` with `-InstallPath "C:\CouchDB"` (no spaces).

**Firewall blocking nurse access**

Verify the rule exists:
```powershell
Get-NetFirewallRule -DisplayName "CouchDB LAN" | Select-Object DisplayName, Enabled, Profile
```
If it is missing or disabled, re-run `setup.ps1`.

**401 error on /_up**

This means `require_valid_user = true` was used instead of `require_valid_user_except_for_up = true`. Re-run `setup.ps1` to overwrite `local.ini` with the correct value and restart the service.

**Nurse write of patient document rejected (INFRA-04c failing)**

Confirm the `validate_doc_update` design doc is deployed correctly:
```powershell
Invoke-RestMethod -Uri "http://admin:ADMIN_PW@localhost:5984/ClinicSoftware_v2/_design/roles"
```
The response should contain the `validate_doc_update` key. If not, re-run `setup.ps1`.

**Check 3 failing (unauthenticated not rejected)**

Confirm `require_valid_user_except_for_up = true` is in `C:\CouchDB\etc\local.ini` under the `[chttpd_auth]` section, then restart the service:
```powershell
Restart-Service -Name Apache_CouchDB
```
