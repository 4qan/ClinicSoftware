---
phase: 20-couchdb-infrastructure
plan: 01
subsystem: infra
tags: [couchdb, powershell, windows-service, cors, validate_doc_update, pouchdb]

requires:
  - phase: 19-pouchdb-migration
    provides: PouchDB database named ClinicSoftware_v2 with document type discriminators (patient, visit, visitmed, drug, settings, recent)

provides:
  - PowerShell setup script (setup.ps1) that automates full CouchDB installation on doctor's Windows machine
  - CouchDB local.ini configuration bound to 0.0.0.0:5984 with require_valid_user_except_for_up and CORS
  - Design document (validate_doc_update.json) enforcing nurse write restrictions on visit/visitmed/drug
  - Verification script (verify.ps1) covering all 4 INFRA requirements with PASS/FAIL output
  - README.md setup guide with prerequisites, steps, password notes, and troubleshooting

affects:
  - 20-02 (Phase 20 plan 2, if any)
  - 21-app-login (needs doctor/nurse credentials to match CouchDB accounts)
  - 22-live-sync (requires CouchDB endpoint running with this configuration before PouchDB sync activates)

tech-stack:
  added: []
  patterns:
    - "CouchDB validate_doc_update for server-side role enforcement that cannot be bypassed from the app layer"
    - "require_valid_user_except_for_up leaves /_up open for Phase 22 connectivity checks without exposing data endpoints"
    - "credentials=false with origins=* for PouchDB Basic-auth sync (avoids CORS spec violation)"

key-files:
  created:
    - scripts/couchdb-setup/setup.ps1
    - scripts/couchdb-setup/local.ini
    - scripts/couchdb-setup/validate_doc_update.json
    - scripts/couchdb-setup/verify.ps1
    - scripts/couchdb-setup/README.md
  modified: []

key-decisions:
  - "require_valid_user_except_for_up instead of require_valid_user: keeps /_up accessible for Phase 22 connectivity checks"
  - "credentials=false with origins=* in CORS: PouchDB sync uses HTTP Basic auth headers not cookies; wildcard+credentials violates the CORS spec"
  - "validate_doc_update blocks nurse writes on visit/visitmed/drug matching PouchDB type discriminators exactly from src/db/pouchdb.ts"
  - "Doctor role added to _admin check in validate_doc_update so database-level doctor admin does not get blocked (server admins have _admin, database admins do not)"
  - "Passwords never hardcoded in scripts: all three passwords come from mandatory PowerShell parameters only"

patterns-established:
  - "Pattern: All CouchDB config in local.ini, never default.ini (would be overwritten on upgrade)"
  - "Pattern: Firewall rule uses Domain,Private profiles only (not Public), limits exposure if machine leaves clinic LAN"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04]

duration: 3min
completed: 2026-03-19
---

# Phase 20 Plan 01: CouchDB Infrastructure Setup Summary

**PowerShell-automated CouchDB 3.5.1 setup on Windows with role-based write enforcement via validate_doc_update, securing ClinicSoftware_v2 database for Phase 22 LAN sync**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T16:41:50Z
- **Completed:** 2026-03-19T16:44:53Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments

- Five-file `scripts/couchdb-setup/` directory covers the complete CouchDB lifecycle: install, configure, verify
- setup.ps1 automates all 10 steps from MSI install through design doc deployment with error handling and idempotent retries on 409/412 conflicts
- validate_doc_update.json nurse restrictions reference exact document type strings from `src/db/pouchdb.ts` (visit, visitmed, drug) -- no mismatch risk with Phase 22 sync

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CouchDB configuration and setup script** - `dce29ee` (feat)
2. **Task 2: Create verification script and setup guide** - `e18c1e0` (feat)

## Files Created/Modified

- `scripts/couchdb-setup/setup.ps1` - Full CouchDB setup automation (install, config, firewall, DB, users, security, design doc)
- `scripts/couchdb-setup/local.ini` - CouchDB config template (LAN bind, auth, CORS)
- `scripts/couchdb-setup/validate_doc_update.json` - Design document blocking nurse writes on visit/visitmed/drug
- `scripts/couchdb-setup/verify.ps1` - 6-check verification script covering all INFRA requirements
- `scripts/couchdb-setup/README.md` - Setup guide with prerequisites, steps, password notes, troubleshooting

## Decisions Made

- `require_valid_user_except_for_up` rather than `require_valid_user`: the plain version blocks `/_up`, which Phase 22 uses for connectivity detection before attempting sync.
- `credentials = false` with `origins = *` in CORS: PouchDB replication uses HTTP Basic auth headers, not cookies. Wildcard origin with `credentials = true` violates the CORS spec and causes CouchDB to reject the config.
- validate_doc_update checks `_admin` role OR `doctor` role before enforcing nurse restrictions. Server admins (`_admin`) bypass design doc validation anyway, but database-level doctor admin (set via the security object) does not get `_admin` in `userCtx.roles` -- it only works if `doctor` is explicitly allowed.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The scripts in `scripts/couchdb-setup/` must be run manually on the doctor's Windows machine before Phase 22 (Live Sync) can be activated. See `scripts/couchdb-setup/README.md` for step-by-step instructions.

## Next Phase Readiness

- CouchDB setup artifacts complete. When run on the doctor's machine, all 6 verify.ps1 checks should pass.
- Phase 21 (app login) needs the doctor and nurse passwords set here -- they must match the CouchDB user accounts so PouchDB sync can authenticate.
- Phase 22 (live sync) can proceed once verify.ps1 confirms all INFRA requirements pass on the doctor's machine.

---
*Phase: 20-couchdb-infrastructure*
*Completed: 2026-03-19*

## Self-Check: PASSED

All 5 created files confirmed on disk. Both task commits (dce29ee, e18c1e0) confirmed in git log.
