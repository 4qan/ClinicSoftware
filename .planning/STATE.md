---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Multi-User Sync
status: unknown
stopped_at: Completed 19-01-PLAN.md
last_updated: "2026-03-19T15:46:38.302Z"
progress:
  total_phases: 9
  completed_phases: 4
  total_plans: 10
  completed_plans: 8
---

# Project State: ClinicSoftware

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** Phase 19 — pouchdb-migration

## Current Position

Phase: 19 (pouchdb-migration) — EXECUTING
Plan: 2 of 3

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

### Pending Todos

None.

### Blockers/Concerns

- Phase 22: Verify Workbox `networkOnly` exclusion syntax for current `vite-plugin-pwa` API before writing sync config
- Phase 23: Restore flow (stop sync, destroy local PouchDB, restore to CouchDB, restart sync) needs explicit end-to-end test
- Carried: login.test.tsx 4 pre-existing failures from v1.3 (BrowserRouter basename mismatch in jsdom)

## Session Continuity

Last session: 2026-03-19T15:46:38.300Z
Stopped at: Completed 19-01-PLAN.md
Resume file: None

---
*Last updated: 2026-03-19 -- v2.0 roadmap created*
