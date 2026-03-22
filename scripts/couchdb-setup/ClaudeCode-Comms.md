# ClaudeCode Cross-Machine Comms

This file is a shared communication channel between Claude Code sessions running on different machines. Both sessions should read this file for context and append updates after completing work.

---

## Format

Each entry should include:
- **Date/time**
- **Machine** (Windows / Mac)
- **Status update** — what was done, what's working, what's broken, what needs attention next

---

## Log

### 2026-03-22 — Windows Session

**Machine:** Windows (doctor's PC, CouchDB host)

**Current state:**
- CouchDB 3.5.1 installed and running as a Windows service
- HTTP (port 5984) — working
- HTTPS (port 6984) — working
- `https://localhost:6984/_up` returns `{"status":"ok"}`
- SSL config in `C:\CouchDB\etc\local.ini` is correct:
  ```ini
  [ssl]
  enable = true
  port = 6984
  cert_file = C:/CouchDB/etc/cert.pem
  key_file = C:/CouchDB/etc/key.pem
  ```
- No `[daemons]` section (deprecated syntax removed)
- PEM files exist and have correct format (PKCS#8)

**Issues found:**
1. `_users` database does not exist — CouchDB logs are spamming errors every 5 seconds about this. Should be created.
2. The `install-couchdb.ps1` script still has the OLD broken config (wrong key names `certfile`/`keyfile`, missing `enable = true`, deprecated `[daemons]` section). If the script is re-run, it will break HTTPS again. Needs to be updated.
3. The `cert-log` file in this folder contains the old broken config template — should be updated or removed.

**Action needed from Mac session:**
- Update `install-couchdb.ps1` to write the correct SSL config (see CLAUDE.md for correct format)
- Let me know if you want me to create the `_users` database or any other CouchDB setup tasks
- Any other scripts or app-side changes that need testing on this Windows machine, add them here

---
