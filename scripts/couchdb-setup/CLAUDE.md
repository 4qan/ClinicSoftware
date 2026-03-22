# CouchDB Setup - Debug Context

## The Problem

CouchDB 3.5.1 is installed on this Windows machine and HTTP works (port 5984), but HTTPS (port 6984) does not start. HTTPS is required because the app is served from GitHub Pages (HTTPS) and browsers block mixed content (HTTPS page calling HTTP API).

## What Should Work

The install script (`install-couchdb.ps1`) generates a self-signed SSL cert and configures CouchDB for HTTPS. After running, both HTTP (5984) and HTTPS (6984) should respond.

## Correct CouchDB 3.5.x SSL Config (from official docs)

```ini
[ssl]
enable = true
port = 6984
cert_file = C:/CouchDB/etc/cert.pem
key_file = C:/CouchDB/etc/key.pem
```

Critical details:
- `enable = true` is REQUIRED (without it, CouchDB ignores the entire [ssl] section)
- Keys use underscores: `cert_file` and `key_file` (NOT `certfile` / `keyfile`)
- `[daemons] httpsd` is deprecated 1.x/2.x syntax, do NOT use it
- Forward slashes for Windows paths (Erlang treats backslashes as escape chars)
- No spaces in paths (causes silent SSL failure, GitHub #3267)
- Erlang accepts both PKCS#1 and PKCS#8 PEM formats

## What to Debug

1. Check `C:\CouchDB\etc\local.ini` has the correct [ssl] section above
2. Check `C:\CouchDB\etc\cert.pem` and `key.pem` exist and are non-empty
3. Check PEM file format: cert should start with `-----BEGIN CERTIFICATE-----`, key with `-----BEGIN PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`
4. Check CouchDB's loaded config: `Invoke-RestMethod -Uri http://localhost:5984/_node/_local/_config/ssl -Headers $auth` (use admin Basic auth)
5. Check CouchDB logs: `C:\CouchDB\var\log\couchdb.log` (look for SSL/Erlang errors)
6. Check if port 6984 is even listening: `netstat -an | findstr 6984`
7. If config looks correct but HTTPS still fails, the PEM files from PowerShell's `New-SelfSignedCertificate` + CNG export might be in a format Erlang can't parse. Try regenerating with OpenSSL if available.

## Auth for API Calls

```powershell
$auth = @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123")) }
Invoke-RestMethod -Uri http://localhost:5984/_node/_local/_config/ssl -Headers $auth
```

## Key Files

- Install script: `.\install-couchdb.ps1` (run as Administrator)
- Uninstall script: `.\uninstall-couchdb.ps1` (run as Administrator)
- CouchDB config: `C:\CouchDB\etc\local.ini`
- SSL cert: `C:\CouchDB\etc\cert.pem`
- SSL key: `C:\CouchDB\etc\key.pem`
- CouchDB logs: `C:\CouchDB\var\log\couchdb.log`
- Service name: `"Apache CouchDB"` (with space)

## PowerShell Notes

- This machine likely runs PowerShell 5.1 (not 7)
- `curl` in PowerShell is an alias for `Invoke-WebRequest`, not real curl. Use `-k` won't work. Use `Invoke-RestMethod` instead.
- For HTTPS with self-signed certs: `[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }` before making the request
- `Start-Transcript` locks log files across sessions. Always `Stop-Transcript -ErrorAction SilentlyContinue` before starting a new one.

## Goal

Get `https://localhost:6984/_up` to return `{"status":"ok"}`. Once that works, the nurse's machine should also reach `https://<this-machine-ip>:6984/_up` (firewall rule for port 6984 should already exist).
