# CouchDB Setup Guide

One-time setup for the doctor's Windows machine. Installs CouchDB with HTTPS, creates user accounts, and configures role-based access.

## Prerequisites

- Windows 10 or Windows 11 (doctor's machine)
- **Git for Windows** installed (provides OpenSSL for SSL cert generation). Download: https://git-scm.com/download/win
- PowerShell running as Administrator
- Both machines (doctor + nurse) on the same LAN or WiFi network

## Quick Start

### Step 1: Run the installer

Right-click PowerShell > "Run as administrator":

```powershell
cd path\to\ClinicSoftware\scripts\couchdb-setup
.\install-couchdb.ps1
```

The script handles everything: downloads CouchDB, installs it, generates an SSL certificate, configures HTTPS, creates users, and runs verification. Takes about 2 minutes.

### Step 2: Accept the SSL certificate (once per machine)

The script prints the exact URLs. Generally:

**On the doctor's machine**, open Chrome and go to:
```
https://localhost:6984/
```

**On the nurse's machine**, open Chrome and go to:
```
https://<DOCTOR_IP>:6984/
```

On both: click **Advanced** > **Proceed to ...** to accept the self-signed certificate. You should see `{"couchdb":"Welcome",...}`. This is a one-time step per browser.

### Step 3: Open the app and connect

On both machines, open:
```
https://4qan.github.io/ClinicSoftware/
```

On first login, enter the server address:
- **Doctor machine:** `https://localhost:6984`
- **Nurse machine:** `https://<DOCTOR_IP>:6984`

Log in. The sidebar should show a green dot (synced) within seconds.

### Step 4 (recommended): Set a static IP

The doctor's machine needs a stable IP so the nurse's connection doesn't break when the router reassigns IPs.

Windows: Settings > Network > Wi-Fi > IP assignment > Manual. Use the IP shown by the install script.

## Starting Fresh

To completely remove CouchDB and start over:

```powershell
.\uninstall-couchdb.ps1
```

Then re-run `.\install-couchdb.ps1`.

## What Gets Configured

- CouchDB 3.5.1 installed as a Windows service (auto-starts on every boot)
- HTTP on port 5984, **HTTPS on port 6984** (self-signed cert, valid 10 years)
- Windows Firewall rules for both ports (Domain and Private network profiles only)
- Authentication required for all data endpoints (`/_up` remains open for connectivity checks)
- CORS enabled for all origins with Basic auth headers
- Database: `clinicsoftware_v2`
- Users: `doctor` (full read/write), `nurse` (read all, write patients and settings only)
- Nurse blocked at database level from writing: visits, visit medications, drugs

## Troubleshooting

**"OpenSSL not found"**

Install Git for Windows from https://git-scm.com/download/win (includes OpenSSL). Re-run the script after installing.

**Service not starting after install**

Check Windows Event Log (Event Viewer > Windows Logs > Application) for Erlang errors. Most common cause: install path with spaces. Run `.\uninstall-couchdb.ps1`, then re-run install (default path `C:\CouchDB` has no spaces).

**HTTPS check fails (Check 3/7)**

The SSL cert or key file may be missing or corrupted. Check that `cert.pem` and `key.pem` exist in `C:\CouchDB\etc\`. If not, delete both files and re-run the install script (it will regenerate them).

**Browser says "Your connection is not private"**

Expected for self-signed certificates. Click Advanced > Proceed. This is safe on your own LAN. You only need to do this once per browser.

**Nurse can't connect from her machine**

1. Verify the doctor's firewall allows port 6984: `Get-NetFirewallRule -DisplayName "CouchDB HTTPS"`
2. Verify the URL uses the doctor's LAN IP (not `localhost`)
3. Make sure both machines are on the same WiFi/LAN network
4. Make sure the nurse accepted the SSL cert by visiting `https://<DOCTOR_IP>:6984/` directly

**Login fails with "Failed to fetch" or network error**

This was the mixed content issue. Make sure:
1. The CouchDB URL uses `https://` (not `http://`)
2. The port is `6984` (not `5984`)
3. The SSL cert was accepted in the browser (Step 2 above)
