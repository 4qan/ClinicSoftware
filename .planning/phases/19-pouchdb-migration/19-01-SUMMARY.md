---
phase: 19-pouchdb-migration
plan: 01
subsystem: database
tags: [pouchdb, dexie, indexeddb, migration, pouchdb-find]

requires: []
provides:
  - PouchDB instance (ClinicSoftware_v2) with pouchdb-find plugin registered
  - TypeScript interfaces: PouchPatient, PouchVisit, PouchDrug, PouchVisitMedication, PouchSettings, PouchRecentPatient
  - 7 compound indexes for Mango queries
  - LegacyClinicDatabase (read-only Dexie class for migration reads)
  - runMigrationIfNeeded(): one-time Dexie-to-PouchDB migration
  - MIGRATION_FLAG: localStorage key 'clinic_migrated_v2'
  - resetPouchDb(): test utility for destroying and recreating the DB
affects: [19-02, 19-03, phase-20, phase-21, phase-22]

tech-stack:
  added:
    - pouchdb 9.0.0
    - pouchdb-find 9.0.0
    - "@types/pouchdb 6.4.2"
  patterns:
    - Type-prefixed _id (patient:, visit:, drug:, visitmed:, settings:, recent:) for collision-free single-namespace storage
    - localStorage gate for one-time migration with crash-recovery via 409 tolerance
    - TDD: RED test file before implementing module under test

key-files:
  created:
    - src/db/pouchdb.ts
    - src/db/legacy.ts
    - src/db/migration.ts
    - src/__tests__/migration.test.ts
  modified:
    - .gitignore (added ClinicSoftware_v2/ and ClinicSoftware/ runtime dirs)

key-decisions:
  - "PouchDB instance named ClinicSoftware_v2 to avoid IndexedDB collision with Dexie's existing ClinicSoftware database"
  - "409 conflicts on re-run are treated as success (crash recovery): bulkDocs filters non-conflict errors only"
  - "legacyDb.close() called in finally block to release IndexedDB connection even on migration failure"
  - "resetPouchDb() uses Object.assign to update the module-level let export for test isolation"

patterns-established:
  - "Pattern: type-prefixed _id for PouchDB doc namespacing across all 6 data types"
  - "Pattern: localStorage.getItem(FLAG) === 'done' gate before any async DB work"
  - "Pattern: bulkDocs result filtering -- only throw on non-conflict errors"

requirements-completed: [MIGR-01, MIGR-02, MIGR-03]

duration: 5min
completed: 2026-03-19
---

# Phase 19 Plan 01: PouchDB Foundation + One-Time Migration Summary

**PouchDB 9.0.0 instance with type-prefixed documents, 7 Mango indexes, and a crash-safe one-time Dexie migration gated by localStorage flag**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-19T15:40:58Z
- **Completed:** 2026-03-19T15:45:20Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- PouchDB instance (ClinicSoftware_v2) created with pouchdb-find plugin registered before instantiation
- All 6 Pouch interfaces exported with type-prefixed _id fields, 7 compound indexes defined
- LegacyClinicDatabase (read-only Dexie v7 copy) ready for migration reads
- runMigrationIfNeeded() migrates all 6 tables atomically; 409s on crash recovery treated as success
- 7 tests cover MIGR-01 (data integrity + queryability), MIGR-02 (deterministic seed IDs), MIGR-03 (runs once + flag)

## Task Commits

1. **Task 1: Create PouchDB foundation and legacy adapter** - `c4509b9` (feat) - committed in prior session
2. **Task 2: Implement one-time migration and test all requirements** - `358bfa1` (feat)

## Files Created/Modified

- `src/db/pouchdb.ts` - PouchDB instance, plugin registration, Pouch interfaces, ensureIndexes(), resetPouchDb()
- `src/db/legacy.ts` - LegacyClinicDatabase (Dexie read-only adapter, DB name 'ClinicSoftware')
- `src/db/migration.ts` - runMigrationIfNeeded(), MIGRATION_FLAG, 409-tolerant crash recovery
- `src/__tests__/migration.test.ts` - 7 tests for MIGR-01, MIGR-02, MIGR-03
- `.gitignore` - Added ClinicSoftware_v2/ and ClinicSoftware/ runtime PouchDB directories

## Decisions Made

- ClinicSoftware_v2 as PouchDB name: avoids IndexedDB collision with Dexie's existing ClinicSoftware store
- 409 conflicts filtered as success, not thrown: enables crash-recovery re-run without data loss
- `finally` block for legacyDb.close(): guarantees connection release even on migration failure
- PouchDB conflict test uses `status: 409` not `error: 'conflict'`: fake-indexeddb returns numeric status, not string error

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 409 conflict test assertion**
- **Found during:** Task 2 (migration tests)
- **Issue:** Test checked `result.error === 'conflict'` but fake-indexeddb returns `result.status === 409` (not a string error property)
- **Fix:** Changed assertion to `expect(result.status).toBe(409)` which matches the actual PouchDB conflict response shape
- **Files modified:** src/__tests__/migration.test.ts
- **Verification:** All 7 tests pass
- **Committed in:** 358bfa1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test assertion)
**Impact on plan:** No scope change. Test assertion corrected to match actual PouchDB API response.

## Issues Encountered

- pouchdb.ts and legacy.ts were already committed (c4509b9) from a prior partial session. Task 1 verified and accepted as-is.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Foundation layer complete: PouchDB instance, typed interfaces, indexes, migration all ready
- Plan 19-02 (update db/ query layer to use PouchDB) can start immediately
- Plan 19-03 (update seedDrugs.ts to idempotent PouchDB put) can start immediately
- Snapshot DB (ClinicSoftwareSnapshots) remains Dexie as per STATE.md decision

---
*Phase: 19-pouchdb-migration*
*Completed: 2026-03-19*
