---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Multi-User Sync
status: unknown
stopped_at: Completed 22-live-sync plan 01
last_updated: "2026-03-20T14:29:37.028Z"
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 18
  completed_plans: 17
---

# Project State: ClinicSoftware

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** Phase 22 — live-sync

## Current Position

Phase: 22 (live-sync) — EXECUTING
Plan: 1 of 3

## Accumulated Context

### Decisions

- v1.0 through v1.6 decisions logged in PROJECT.md Key Decisions table
- LAN CouchDB over cloud: unreliable internet; LAN sync works without internet
- PouchDB replaces Dexie.js: native CouchDB sync protocol, schemaless, IndexedDB under the hood
- Pre-created user accounts: no setup wizard, accounts created during development
- ClinicSoftwareSnapshots Dexie instance stays Dexie: must never sync to CouchDB (would be destroyed on restore)
- Backup restore redesign required: restore must target CouchDB server, not local PouchDB client
- [Phase 19-01]: PouchDB instance named ClinicSoftware_v2 to avoid IndexedDB collision with Dexie
- [Phase 19-01]: 409 conflicts on migration re-run treated as success for crash recovery
- [Phase 19]: putSetting/getSetting helpers in pouchdb.ts centralize upsert pattern across settings modules
- [Phase 19]: Drug seeding uses allDocs key check for multi-machine idempotency (no count-check shortcut)
- [Phase 19]: timestamps.ts deprecated helpers removed; timestamps.test.ts updated in Plan 03 to test only withTimestamps
- [Phase 19]: PouchDB memory adapter via import.meta.env.VITEST prevents LevelDB lock contention in parallel test workers
- [Phase 19]: SCHEMA_VERSION=2 constant in backup.ts distinguishes PouchDB backups from Dexie era (v1-7); restore handles both formats
- [Phase 20-couchdb-infrastructure]: [Phase 20-01]: require_valid_user_except_for_up keeps /_up open for Phase 22 connectivity checks
- [Phase 20-couchdb-infrastructure]: [Phase 20-01]: credentials=false with origins=* in CouchDB CORS -- PouchDB uses Basic auth headers not cookies
- [Phase 20-couchdb-infrastructure]: [Phase 20-01]: validate_doc_update blocks nurse on visit/visitmed/drug; allows patient/recent/settings -- matches PouchDB type discriminators
- [Phase 21-01]: useCouchAuth reads couchUrl from PouchDB settings on mount; if not set login returns not_configured
- [Phase 21-01]: Recovery code flow (PBKDF2) deleted entirely; RecoveryCodeSection removed from SettingsPage
- [Phase 21-01]: Session verified against CouchDB on mount; unreachable CouchDB clears session rather than trusting it
- [Phase 21-03]: PBKDF2 test file deleted alongside source files -- tests were for code that no longer exists
- [Phase 21-03]: install-couchdb.ps1 uses hardcoded defaults (admin123/doctor123/nurse123) -- zero-friction setup, passwords changeable via app after install
- [Phase 21-02]: Silent redirect to / for nurse on doctor-only routes (no toast, no 403 page)
- [Phase 21-02]: useAuthContext injected into visit pages for conditional prescription rendering
- [Phase 22-01]: syncHandleRef stored in useRef not useState to prevent re-render loop on every PouchDB event
- [Phase 22-01]: 401/403 errors hard-stop sync with user-facing message; other errors set disconnected and allow retry
- [Phase 22-01]: Workbox NetworkOnly on cross-origin requests excludes CouchDB long-poll from service worker

### Pending Todos

None.

### Blockers/Concerns

- Phase 22: Verify Workbox `networkOnly` exclusion syntax for current `vite-plugin-pwa` API before writing sync config
- Phase 23: Restore flow (stop sync, destroy local PouchDB, restore to CouchDB, restart sync) needs explicit end-to-end test
- (Resolved in 21-01) login.test.tsx pre-existing failures fixed: MemoryRouter replaces BrowserRouter in tests

## Session Continuity

Last session: 2026-03-20T14:25:36.436Z
Stopped at: Completed 22-live-sync plan 01
Resume file: None

---
*Last updated: 2026-03-19 -- v2.0 roadmap created*
