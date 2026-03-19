---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Multi-User Sync
status: unknown
stopped_at: Completed 20-01-PLAN.md
last_updated: "2026-03-19T16:46:22.759Z"
progress:
  total_phases: 9
  completed_phases: 5
  total_plans: 12
  completed_plans: 11
---

# Project State: ClinicSoftware

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** Phase 20 — couchdb-infrastructure

## Current Position

Phase: 20 (couchdb-infrastructure) — EXECUTING
Plan: 1 of 2

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

### Pending Todos

None.

### Blockers/Concerns

- Phase 22: Verify Workbox `networkOnly` exclusion syntax for current `vite-plugin-pwa` API before writing sync config
- Phase 23: Restore flow (stop sync, destroy local PouchDB, restore to CouchDB, restart sync) needs explicit end-to-end test
- Carried: login.test.tsx 4 pre-existing failures from v1.3 (BrowserRouter basename mismatch in jsdom)

## Session Continuity

Last session: 2026-03-19T16:46:22.757Z
Stopped at: Completed 20-01-PLAN.md
Resume file: None

---
*Last updated: 2026-03-19 -- v2.0 roadmap created*
