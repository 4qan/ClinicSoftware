---
phase: 19-pouchdb-migration
plan: 02
subsystem: db
tags: [pouchdb, migration, dexie, db-layer]
dependency_graph:
  requires: [19-01]
  provides: [db-modules-pouchdb]
  affects: [src/db/index.ts, src/db/patients.ts, src/db/visits.ts, src/db/timestamps.ts, src/db/drugs.ts, src/db/settings.ts, src/db/printSettings.ts, src/db/seedDrugs.ts, src/db/pouchdb.ts]
tech_stack:
  added: []
  patterns: [type-prefixed _id, allDocs prefix scan, pouchDb.find with limit, _rev optimistic lock, _deleted bulk delete, idempotent allDocs key check]
key_files:
  created: []
  modified:
    - src/db/index.ts
    - src/db/patients.ts
    - src/db/visits.ts
    - src/db/timestamps.ts
    - src/db/drugs.ts
    - src/db/settings.ts
    - src/db/printSettings.ts
    - src/db/seedDrugs.ts
    - src/db/pouchdb.ts
decisions:
  - putSetting/getSetting helpers added to pouchdb.ts to avoid upsert pattern duplication across settings.ts, printSettings.ts, seedDrugs.ts
  - timestamps.ts deprecated createPatient/updatePatient removed (only used in Dexie-era tests, not production)
  - stripPouchFields helper duplicated in patients.ts, visits.ts, drugs.ts (each file self-contained; shared helper would require another module)
  - Drug seeding uses allDocs({ keys }) check instead of count check to support multi-machine idempotency (MIGR-02)
  - generatePatientId uses retry loop (max 3) to handle PouchDB 409 conflicts from concurrent calls
metrics:
  duration: ~25 minutes
  completed: 2026-03-19
  tasks_completed: 2
  files_modified: 9
---

# Phase 19 Plan 02: DB Module Rewrite (Dexie to PouchDB) Summary

All 7 DB module files (plus pouchdb.ts) rewritten to use PouchDB with type-prefixed _id keys and pouchdb-find selectors, while preserving identical public API signatures.

## What Was Built

**index.ts**: Stripped to interface-only exports. `ClinicDatabase` class, `db` instance, and `resetDatabase()` removed entirely. All 6 interfaces (Patient, AppSettings, RecentPatient, Drug, Visit, VisitMedication) preserved.

**timestamps.ts**: Reduced to pure `withTimestamps` utility. Deprecated `createPatient`/`updatePatient` functions removed (they duplicated patients.ts logic, were only used in Dexie-era tests).

**patients.ts**: Full PouchDB rewrite. `generatePatientId` uses optimistic-lock retry (max 3) against `settings:patientCounter`. Search uses `pouchDb.find` with `$gte`/`$lte + '\uffff'` prefix scan per the research patterns. Recent patients use `allDocs` prefix scan sorted in JS.

**visits.ts**: Full PouchDB rewrite. `createVisit` and `updateVisit` use `bulkDocs` for medication batch inserts. Delete operations use `{ _deleted: true }` pattern via `bulkDocs`. All `find` calls include `limit: 1000`.

**drugs.ts**: Full PouchDB rewrite. Search uses parallel `find` calls on `brandNameLower` and `saltNameLower` with `isActive: true` in selector. `getAllDrugsUnfiltered` uses `allDocs` prefix scan.

**settings.ts / printSettings.ts**: Rewritten to use `getSetting`/`putSetting` helpers from pouchdb.ts. All pure calculation functions (calcMargin, calcScale, PAPER_SIZES, etc.) unchanged.

**seedDrugs.ts**: Idempotent seeding via `allDocs({ keys: [...] })` check -- inserts only records whose `_id` is not already present. No count-check shortcut. `deduplicateExistingDrugs` uses `allDocs` prefix scan + `bulkDocs` delete + `putSetting` flag.

**pouchdb.ts**: Added `putSetting(key, value)` and `getSetting(key)` shared helpers to centralize the upsert pattern.

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed as written.

### Notes

- The `timestamps.test.ts` file tests `createPatient`/`updatePatient` from timestamps.ts and also imports `resetDatabase`/`db` from index.ts. These tests will fail after this plan because the tested functions no longer exist. This is expected: Plan 03 will address test updates as part of the consumer migration.

## Self-Check

Files exist:
- src/db/index.ts: FOUND
- src/db/patients.ts: FOUND
- src/db/visits.ts: FOUND
- src/db/timestamps.ts: FOUND
- src/db/drugs.ts: FOUND
- src/db/settings.ts: FOUND
- src/db/printSettings.ts: FOUND
- src/db/seedDrugs.ts: FOUND
- src/db/pouchdb.ts: FOUND

Commits:
- 4e16e3f: feat(19-02): rewrite index.ts, patients.ts, visits.ts, timestamps.ts to PouchDB
- 56f8a83: feat(19-02): rewrite drugs.ts, settings.ts, printSettings.ts, seedDrugs.ts to PouchDB

TypeScript: `npx tsc --noEmit` exits 0 (no src/ errors)

## Self-Check: PASSED
