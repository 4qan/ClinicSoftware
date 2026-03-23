# Clinic Software: Sync Installation Guide

Complete setup guide for two-machine sync (doctor + nurse). The doctor's Windows machine runs CouchDB as the sync server. The nurse's machine (Windows or Mac) connects to it over the local network.

**Time required:** ~15 minutes total (10 min doctor, 5 min nurse)

---

## Network Requirements

- Both machines on the same WiFi or LAN
- Doctor's machine must have a **static IP** (configured before running the install script)

---

## Part 1: Doctor's Machine (Windows, CouchDB Server)

### Step 1: Set a Static IP

The doctor's machine needs a stable IP. This **must be done before** running the install script, because the SSL certificate is generated with this IP baked in.

1. Open **Settings** > **Network & Internet** > **Wi-Fi** (or Ethernet)
2. Click your connected network
3. Under **IP assignment**, click **Edit**
4. Select **Manual**, toggle **IPv4** on
5. Enter:
   - **IP address:** Pick an unused address on your network (e.g., `192.168.1.21`)
   - **Subnet mask:** `255.255.255.0`
   - **Gateway:** Your router's IP (usually `192.168.1.1`)
   - **Preferred DNS:** `8.8.8.8`
6. Save

**Verify:** Open PowerShell and run `ipconfig`. Your Wi-Fi/Ethernet IPv4 address should match what you entered.

> **VPN warning:** If you have a VPN installed (e.g., Windscribe, NordVPN), **disconnect it before running the install script**. The script auto-detects your LAN IP for the SSL certificate. A VPN adapter can cause it to pick the wrong IP.

### Step 2: Run the Install Script

1. Copy the `scripts/couchdb-setup/` folder to the doctor's machine
2. Right-click PowerShell, select **Run as Administrator**
3. Run:

```powershell
cd path\to\couchdb-setup
.\install-couchdb.ps1
```

The script downloads CouchDB 3.5.1, installs it, generates an SSL certificate, configures HTTPS, creates users and roles, and runs 7 verification checks. Takes about 2 minutes.

**Verify the certificate includes your IP** (printed during install). If you see the wrong IP, see Troubleshooting below.

**What gets created:**
- CouchDB service (auto-starts on boot)
- HTTPS on port 6984 (self-signed cert, valid 10 years, includes your LAN IP)
- HTTP on port 5984 (local access only)
- Firewall rules for ports 5984 and 6984
- SSL certificate installed as Trusted Root CA (so Chrome trusts it for fetch requests)
- Database: `clinicsoftware_v2`
- Users: `doctor` (full access), `nurse` (limited: cannot write visits, medications, or drugs)
- Admin: `admin` / `admin123`

### Step 3: Disable Chrome Private Network Access (PNA)

Chrome blocks web pages served over HTTPS (like the app on GitHub Pages) from making requests to private network addresses (like `localhost:6984`). This must be disabled.

**Option A: Chrome flag (if available)**

Go to `chrome://flags/#block-insecure-private-network-requests`, set to **Disabled**, click **Relaunch**.

> This flag was removed in Chrome 146+. If it doesn't exist, use Option B.

**Option B: Launch Chrome with command-line flag**

Close Chrome completely, then launch it from a command prompt:

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-features=PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests
```

You can create a desktop shortcut with this command for convenience. Chrome must always be launched this way for sync to work.

### Step 4: Accept the Certificate in Chrome

Open Chrome and go to:

```
https://localhost:6984/
```

You should see `{"couchdb":"Welcome",...}`. If Chrome shows a privacy warning, click **Advanced** > **Proceed to localhost**.

### Step 5: Log In to the App

1. Open Chrome and go to `https://4qan.github.io/ClinicSoftware/`
2. Click **Change server address**
3. Enter: `https://localhost:6984`
4. Click **Save and Continue**
5. Log in with username `doctor`, password `doctor123`
6. The sidebar should show a green dot ("Synced") within a few seconds

---

## Part 2: Nurse's Machine

The nurse's machine does NOT need CouchDB installed. It only needs Chrome configured to trust the doctor's certificate and allow private network requests.

Replace `DOCTOR_IP` below with the doctor's actual static IP (e.g., `192.168.1.21`).

### Option A: Nurse on Windows

#### Step 1: Get the Certificate

Copy `cert.pem` from the doctor's machine (`C:\CouchDB\etc\cert.pem`) to the nurse's machine. Use a USB drive, shared folder, or any file transfer method.

#### Step 2: Trust the Certificate

Open PowerShell as Administrator and run:

```powershell
Import-Certificate -FilePath "path\to\cert.pem" -CertStoreLocation "cert:\LocalMachine\Root"
```

#### Step 3: Disable Chrome PNA

**Option A: Chrome flag (if available)**

Go to `chrome://flags/#block-insecure-private-network-requests`, set to **Disabled**, click **Relaunch**.

**Option B: Launch Chrome with command-line flag (Chrome 146+)**

Close Chrome completely, then launch from command prompt:

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-features=PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests
```

#### Step 4: Accept the Certificate in Chrome

Open Chrome and go to:

```
https://DOCTOR_IP:6984/
```

You should see `{"couchdb":"Welcome",...}`. If you see a privacy warning, click **Advanced** > **Proceed**.

#### Step 5: Log In to the App

1. Open `https://4qan.github.io/ClinicSoftware/`
2. Click **Change server address**
3. Enter: `https://DOCTOR_IP:6984`
4. Click **Save and Continue**
5. Log in with username `nurse`, password `nurse123`
6. Green dot ("Synced") should appear in the sidebar

---

### Option B: Nurse on Mac

#### Step 1: Trust the Certificate

On Mac, accepting the cert in Chrome only works for page navigation, NOT for `fetch()` API calls. You must install the cert into the macOS Keychain.

Open Terminal and run (replace `DOCTOR_IP` with the actual IP):

```bash
openssl s_client -connect DOCTOR_IP:6984 -servername DOCTOR_IP </dev/null 2>/dev/null | openssl x509 > /tmp/couchdb-cert.pem
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/couchdb-cert.pem
```

Enter your Mac password when prompted. Both commands must be run, each on its own line.

#### Step 2: Disable Chrome PNA

**Option A: Chrome flag (if available)**

Go to `chrome://flags/#block-insecure-private-network-requests`, set to **Disabled**, click **Relaunch**.

**Option B: Launch Chrome with command-line flag (Chrome 146+)**

Quit Chrome completely (Cmd+Q), then open Terminal and run:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-features=PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests
```

#### Step 3: Accept the Certificate in Chrome

Open Chrome and go to:

```
https://DOCTOR_IP:6984/
```

You should see `{"couchdb":"Welcome",...}`. If Chrome shows a privacy warning, click **Advanced** > **Proceed**.

#### Step 4: Log In to the App

1. Open `https://4qan.github.io/ClinicSoftware/`
2. Click **Change server address**
3. Enter: `https://DOCTOR_IP:6984`
4. Click **Save and Continue**
5. Log in with username `nurse`, password `nurse123`
6. Green dot ("Synced") should appear in the sidebar

---

## Verification Checklist

After both machines are logged in:

- [ ] Doctor's sidebar shows green "Synced" dot
- [ ] Nurse's sidebar shows green "Synced" dot
- [ ] Create a patient on the nurse's machine. It appears on the doctor's machine within seconds (no refresh needed)
- [ ] Open Settings > Sync tab on both machines. "Last synced" shows a recent time

---

## Uninstall / Start Fresh

On the doctor's machine (PowerShell as Administrator):

```powershell
.\uninstall-couchdb.ps1
```

Then re-run `.\install-couchdb.ps1`.

On the nurse's machine, no uninstall is needed. Just clear the browser's site data for `4qan.github.io` if you want a fresh start.

---

## Troubleshooting

### "Could not connect to CouchDB" on login

Check these in order:

1. **CouchDB running?** (doctor's machine): Open `https://localhost:6984/_up` in Chrome. Should return `{"status":"ok"}`.
2. **Network reachable?** (nurse's machine): Open `https://DOCTOR_IP:6984/` in Chrome. If it doesn't load, the machines aren't on the same network or the firewall is blocking port 6984.
3. **Chrome PNA disabled?** Check `chrome://flags/#block-insecure-private-network-requests` is **Disabled**, or that Chrome was launched with the `--disable-features` flag.
4. **Cert trusted for fetch?** Open DevTools (F12) > Console and look at the error:
   - `net::ERR_CERT_AUTHORITY_INVALID`: Certificate not trusted. Re-do the "Trust the Certificate" step for your OS.
   - `net::ERR_CERT_COMMON_NAME_INVALID`: Certificate doesn't include this IP in its SAN. The cert must be regenerated on the doctor's machine (uninstall + reinstall CouchDB).
   - `net::ERR_FAILED` with no detail: Likely PNA blocking. See step 3.

### Certificate has wrong IP (ERR_CERT_COMMON_NAME_INVALID)

This happens when:
- The static IP was set **after** running the install script
- A VPN was active during install (script picked the VPN adapter's IP)

**Fix:** On the doctor's machine, disconnect any VPN, then:

```powershell
.\uninstall-couchdb.ps1
.\install-couchdb.ps1
```

The nurse must then re-accept the new certificate (repeat Part 2 steps).

### Service worker blocking requests (workbox "no-response" error)

If the console shows `workbox no-response` errors:

1. Open DevTools (F12) > **Application** > **Service Workers**
2. Click **Unregister**
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Try logging in again

### Green "Synced" indicator but data doesn't appear on the other machine

1. **Hard refresh** both browsers: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check CouchDB doc count** (doctor's machine, PowerShell):
   ```powershell
   $auth = @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123")) }
   [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
   Invoke-RestMethod -Uri "https://localhost:6984/clinicsoftware_v2" -Headers $auth
   ```
   `doc_count` should be greater than 0. If it's 0 or 1, data isn't reaching CouchDB.

### Nurse's machine can't reach the doctor's IP

1. Verify both machines are on the same WiFi/LAN
2. Check the firewall rule exists on the doctor's machine:
   ```powershell
   Get-NetFirewallRule -DisplayName "CouchDB HTTPS"
   ```
3. Verify the doctor's static IP hasn't changed: run `ipconfig` and confirm the IP matches

---

## Credentials Reference

| User   | Password    | Role   | Access                                     |
|--------|-------------|--------|--------------------------------------------|
| admin  | admin123    | admin  | Full CouchDB admin (not used in the app)   |
| doctor | doctor123   | doctor | Full read/write to all data                |
| nurse  | nurse123    | nurse  | Read all, write patients and settings only |

To change passwords, run on the doctor's machine:

```powershell
$auth = @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123")) }
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# Change doctor password (replace NEW_PASSWORD)
$body = '{"name":"doctor","password":"NEW_PASSWORD","roles":["doctor"],"type":"user"}'
# First get the current rev:
$doc = Invoke-RestMethod -Uri "https://localhost:6984/_users/org.couchdb.user:doctor" -Headers $auth
$rev = $doc._rev
Invoke-RestMethod -Method Put -Uri "https://localhost:6984/_users/org.couchdb.user:doctor?rev=$rev" -Headers $auth -ContentType "application/json" -Body $body
```
