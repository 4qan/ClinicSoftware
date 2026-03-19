---
phase: 20-couchdb-infrastructure
verified: 2026-03-19T17:30:00Z
status: gaps_found
score: 3/4 truths verified
gaps:
  - truth: "A single PowerShell script installs CouchDB, configures it, opens the firewall, creates the database, creates users, sets security, and deploys the validation function"
    status: partial
    reason: "setup.ps1 does all 10 required steps. However, the database name in setup.ps1 is 'clinicsoftware_v2' (all-lowercase, required by CouchDB) while src/db/pouchdb.ts opens 'ClinicSoftware_v2' (mixed case). When Phase 22 sync activates, PouchDB will attempt to replicate to a different database name than what CouchDB has. The fix from plan 02 was applied to the scripts but the corresponding change was never made to src/db/pouchdb.ts."
    artifacts:
      - path: "scripts/couchdb-setup/setup.ps1"
        issue: "Creates 'clinicsoftware_v2' but PouchDB opens 'ClinicSoftware_v2'"
      - path: "src/db/pouchdb.ts"
        issue: "Opens 'ClinicSoftware_v2' (mixed case) -- CouchDB will reject this name"
    missing:
      - "Update src/db/pouchdb.ts line 53 and 55: change 'ClinicSoftware_v2' to 'clinicsoftware_v2'"
      - "Update any test files that reference 'ClinicSoftware_v2' as a PouchDB name"
human_verification:
  - test: "Run verify.ps1 on doctor's Windows machine"
    expected: "6/6 checks pass (INFRA-01 through INFRA-04)"
    why_human: "Plan 02 tested on macOS only. Actual Windows deployment not yet confirmed. Windows-specific behavior (service startup, MSI installer, firewall API) cannot be verified programmatically from macOS."
  - test: "From nurse's machine, open http://DOCTOR_LAN_IP:5984/_up in a browser"
    expected: "Returns {\"status\":\"ok\"} -- confirms cross-machine LAN access (INFRA-02)"
    why_human: "Requires two physical machines on the same LAN. Cannot verify from single dev machine."
---

# Phase 20: CouchDB Infrastructure Verification Report

**Phase Goal:** CouchDB running as a secured Windows service on the doctor's machine, accessible from nurse's machine over LAN
**Verified:** 2026-03-19T17:30:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A single PowerShell script installs CouchDB, configures it, opens the firewall, creates the database, creates users, sets security, and deploys the validation function | PARTIAL | setup.ps1 performs all 10 required steps with error handling. Bug: creates `clinicsoftware_v2` but PouchDB source opens `ClinicSoftware_v2` -- these are different database names from CouchDB's perspective. |
| 2 | The local.ini template binds CouchDB to 0.0.0.0:5984, enables CORS, and requires valid user authentication | VERIFIED | local.ini contains `bind_address = 0.0.0.0`, `port = 5984`, `require_valid_user_except_for_up = true`, `enable_cors = true`, `credentials = false`, `origins = *` |
| 3 | The validate_doc_update function blocks nurse-role writes on visit, visitmed, and drug document types while allowing doctor and _admin roles | VERIFIED | validate_doc_update.json: checks `_admin` and `doctor` roles, restricted array is `['visit', 'visitmed', 'drug']`, throws `forbidden: 'Nurse role cannot write ...'` on match |
| 4 | A verification script checks service status, unauthenticated rejection, and nurse write rejection | VERIFIED | verify.ps1 runs 6 checks: INFRA-01 (service+auto-start), INFRA-02 (/_up), INFRA-03 (401 unauth), INFRA-04a (doctor write), INFRA-04b (nurse blocked), INFRA-04c (nurse patient write). Cleanup included. |

**Score:** 3/4 truths verified (1 partial due to DB name mismatch)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/couchdb-setup/setup.ps1` | Complete CouchDB setup automation | PARTIAL | Exists, 374 lines, substantive. Contains `INSTALLSERVICE=1`, `New-NetFirewallRule`, `org.couchdb.user:doctor`, `org.couchdb.user:nurse`, `_design/roles`, `_security`. DB name `clinicsoftware_v2` mismatches PouchDB source `ClinicSoftware_v2`. |
| `scripts/couchdb-setup/local.ini` | CouchDB configuration template | VERIFIED | Exists, contains all required settings including `bind_address = 0.0.0.0` and `require_valid_user_except_for_up = true` |
| `scripts/couchdb-setup/validate_doc_update.json` | Design document with role enforcement | VERIFIED | Exists, contains `validate_doc_update` function, blocks `visit`, `visitmed`, `drug` for nurse role |
| `scripts/couchdb-setup/verify.ps1` | Post-setup verification commands | VERIFIED | Exists, 250 lines, covers all 4 INFRA requirements across 6 checks, includes test document cleanup |
| `scripts/couchdb-setup/README.md` | Setup guide for running on doctor's machine | VERIFIED | Exists, contains Prerequisites, Setup Steps, Password Notes, What Gets Configured, Troubleshooting |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `setup.ps1` | `local.ini` | `Copy-Item` to CouchDB etc directory | WIRED | Line 141: `Copy-Item -Path $sourceIni -Destination $localIniPath -Force` |
| `setup.ps1` | `validate_doc_update.json` | PUT to `_design/roles` endpoint | WIRED | Line 345: `"$AdminUrl/clinicsoftware_v2/_design/roles"` -- reads JSON from script dir and PUTs it |
| `validate_doc_update.json` | `src/db/pouchdb.ts` | Document type field values must match PouchDB type discriminators | BROKEN | Types `visit`, `visitmed`, `drug` match exactly. However, the database name `clinicsoftware_v2` in scripts does NOT match `ClinicSoftware_v2` in `src/db/pouchdb.ts`. The key link at the database-name level is broken. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 20-01, 20-02 | CouchDB runs as a Windows service on the doctor's machine, starts automatically on boot | SATISFIED | setup.ps1: `INSTALLSERVICE=1` in MSI args; verify.ps1 Check 1: `Get-Service Apache_CouchDB` + StartType=Automatic |
| INFRA-02 | 20-01, 20-02 | Nurse's browser connects to CouchDB over the clinic's local network | SATISFIED (scripts) / HUMAN NEEDED (real hardware) | local.ini: `bind_address = 0.0.0.0`; firewall rule: Domain/Private profiles; verify.ps1 Check 2 prints LAN IP. Actual cross-machine LAN test not yet performed on Windows. |
| INFRA-03 | 20-01, 20-02 | CouchDB is secured with admin credentials before LAN access is enabled | SATISFIED | local.ini: `require_valid_user_except_for_up = true`; verify.ps1 Check 3 confirms 401 on unauthenticated request |
| INFRA-04 | 20-01, 20-02 | Nurse is prevented from writing prescriptions or modifying medications at the database level | SATISFIED (logic) / PARTIAL (wiring) | validate_doc_update.json blocks `visit`, `visitmed`, `drug` for nurse role -- logic is correct. Wiring to PouchDB source is broken at the database-name level (see gap). |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/db/pouchdb.ts` | 53, 55 | DB name `ClinicSoftware_v2` does not match CouchDB scripts `clinicsoftware_v2` | Blocker | Phase 22 sync will fail: PouchDB will attempt to replicate to a non-existent CouchDB database name. CouchDB rejects uppercase characters in database names. |
| `scripts/couchdb-setup/README.md` | 69 | Claims "`clinicsoftware_v2` (matches the local PouchDB database name)" | Warning | Misleading comment -- the names do NOT currently match. Will confuse whoever runs Phase 22 setup. |

### Human Verification Required

#### 1. Windows Service Deployment

**Test:** On doctor's Windows machine, run `.\setup.ps1` then `.\verify.ps1`
**Expected:** 6/6 checks pass
**Why human:** Plan 02 testing was done on macOS (confirmed in 20-02-SUMMARY.md: "Verified on macOS instead (development testing). Windows deployment deferred"). MSI installer, Windows service registration, and `New-NetFirewallRule` are Windows-only. Behavior on actual clinic machine is unconfirmed.

#### 2. Cross-Machine LAN Connectivity

**Test:** From nurse's machine, open `http://DOCTOR_LAN_IP:5984/_up` in a browser after setup
**Expected:** Returns `{"status":"ok"}`
**Why human:** Requires two physical machines on the same LAN. Cannot verify from a single development machine.

### Gaps Summary

One gap blocks the phase goal from being fully achieved:

**Database name mismatch (BLOCKER):** Plan 02 correctly identified that CouchDB enforces lowercase database names and updated all scripts from `ClinicSoftware_v2` to `clinicsoftware_v2`. However, the corresponding change was never made to `src/db/pouchdb.ts` (lines 53 and 55), which still opens `ClinicSoftware_v2`. The README.md even claims the names match (line 69), but they do not. This will cause Phase 22 sync to fail silently or with a "database not found" error -- PouchDB will replicate to `ClinicSoftware_v2` on CouchDB, which does not exist.

The fix is a one-line change in `src/db/pouchdb.ts`. Since IndexedDB (used by PouchDB in the browser) is case-sensitive on some platforms and the existing production data may already be stored under `ClinicSoftware_v2`, the fix should also check whether a migration of the local database name is needed.

Additionally, real-hardware Windows testing (INFRA-01 and INFRA-02) remains deferred from Plan 02 and requires human verification on the actual clinic machine.

---

_Verified: 2026-03-19T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
