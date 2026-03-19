---
phase: 20-couchdb-infrastructure
plan: 02
subsystem: infra
tags: [couchdb, verification, macos, localhost]

requires:
  - phase: 20-couchdb-infrastructure
    plan: 01
    provides: CouchDB setup scripts and configuration artifacts

provides:
  - Verified CouchDB infrastructure on macOS (development machine)
  - macOS setup script (setup-mac.sh) and verification script (verify-mac.sh)
  - Self-contained Windows installer (install-couchdb.ps1) for production deployment
  - Bug fixes: lowercase DB name, system database creation

affects:
  - 21-app-login (CouchDB users confirmed working, passwords known)
  - 22-live-sync (CouchDB endpoint verified, role restrictions enforced)

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - scripts/couchdb-setup/setup-mac.sh
    - scripts/couchdb-setup/verify-mac.sh
    - scripts/couchdb-setup/install-couchdb.ps1
  modified:
    - scripts/couchdb-setup/setup.ps1
    - scripts/couchdb-setup/verify.ps1
    - scripts/couchdb-setup/README.md

key-decisions:
  - "Database name changed from ClinicSoftware_v2 to clinicsoftware_v2: CouchDB requires all-lowercase database names"
  - "System databases (_users, _replicator, _global_changes) must be explicitly created on CouchDB 3.x"
  - "Self-contained installer for Windows: downloads MSI, prompts for passwords via SecureString, runs setup+verify in one script"
  - "macOS development uses brew CouchDB + config API (not file copy) since Homebrew manages local.ini location"

patterns-established: []

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04]

duration: 15min
completed: 2026-03-19
---

# Phase 20 Plan 02: CouchDB Verification Summary

**Verified CouchDB infrastructure on macOS dev machine, caught and fixed two bugs, created self-contained Windows installer**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-19T16:50:00Z
- **Completed:** 2026-03-19T17:05:00Z
- **Tasks:** 1 (human-action checkpoint, completed on macOS)

## Accomplishments

- All 6 INFRA verification checks passed on macOS via setup-mac.sh + verify-mac.sh
- Two bugs caught during real testing that would have failed on Windows too:
  1. `ClinicSoftware_v2` rejected by CouchDB (uppercase chars illegal), fixed to `clinicsoftware_v2`
  2. `_users` DB missing on fresh CouchDB 3.x install, added system DB creation step
- Created `install-couchdb.ps1`: single self-contained script for production Windows deployment (no other files needed)

## Task Commits

Commits pending (macOS scripts and bug fixes created during interactive verification).

## Files Created/Modified

- `scripts/couchdb-setup/setup-mac.sh` - macOS equivalent of setup.ps1 (brew-based)
- `scripts/couchdb-setup/verify-mac.sh` - macOS equivalent of verify.ps1
- `scripts/couchdb-setup/install-couchdb.ps1` - Self-contained Windows installer (downloads MSI, prompts passwords, setup+verify)
- `scripts/couchdb-setup/setup.ps1` - Fixed: lowercase DB name, system DB creation
- `scripts/couchdb-setup/verify.ps1` - Fixed: lowercase DB name
- `scripts/couchdb-setup/README.md` - Fixed: lowercase DB name

## Deviations from Plan

- Plan called for verification on doctor's Windows machine. Verified on macOS instead (development testing). Windows deployment deferred to when the actual clinic machine is available.
- Added macOS scripts and self-contained Windows installer (not in original plan).

## Issues Encountered

- CouchDB enforces lowercase-only database names (caught by 400 error during testing)
- CouchDB 3.x requires explicit system database creation (caught by 404 on _users)

## Self-Check: PASSED

All 6 verification checks confirmed passing on macOS. Bug fixes applied to all scripts.
