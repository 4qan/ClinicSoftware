---
phase: 19-pouchdb-migration
plan: 03
subsystem: db
tags: [pouchdb, migration, dexie, app-boot, backup, testing]
dependency_graph:
  requires:
    - phase: 19-02
      provides: db-modules-pouchdb
  provides:
    - app-boot-migration
    - consumers-pouchdb
    - backup-pouchdb
    - test-suite-green
  affects: [src/App.tsx, src/auth/useAuth.ts, src/pages/PatientsPage.tsx, src/hooks/useRecentPatients.ts, src/pages/EditVisitPage.tsx, src/pages/NewVisitPage.tsx, src/components/DataSettings.tsx, src/utils/backup.ts, src/utils/snapshots.ts]
tech-stack:
  added: [pouchdb-adapter-memory (dev)]
  patterns: [memory-adapter-in-vitest, singleFork-pool, SCHEMA_VERSION-constant, delete-all-then-bulkDocs-restore, putSetting-getSetting-in-consumers]
key-files:
  created: []
  modified:
    - src/App.tsx
    - src/auth/useAuth.ts
    - src/pages/PatientsPage.tsx
    - src/hooks/useRecentPatients.ts
    - src/pages/EditVisitPage.tsx
    - src/pages/NewVisitPage.tsx
    - src/components/DataSettings.tsx
    - src/utils/backup.ts
    - src/utils/snapshots.ts
    - src/db/index.ts
    - src/db/pouchdb.ts
    - vitest.config.ts
    - src/__tests__/backup.test.ts
    - src/__tests__/snapshots.test.ts
    - src/__tests__/visits.test.ts
    - src/__tests__/timestamps.test.ts
    - src/__tests__/db.test.ts
    - src/__tests__/printSettings.db.test.ts
    - src/__tests__/PrintVisitPage.test.tsx
    - src/__tests__/DataSettings.test.tsx
key-decisions:
  - "PouchDB in-memory adapter (pouchdb-adapter-memory) used in VITEST env via import.meta.env.VITEST check to prevent LevelDB lock contention between parallel test workers"
  - "vitest.config.ts forks pool with singleFork provides additional serialization safety"
  - "resetDatabase re-exported from db/index.ts as alias for resetPouchDb to maintain test backward compatibility without rewriting all 20+ test files"
  - "SCHEMA_VERSION=2 constant distinguishes PouchDB backups from Dexie era (1-7); backward-compatible restore maps old table names to PouchDB type prefixes"
  - "DataSettings.tsx was not in the plan's files_modified list but also used db.settings.get/put - auto-fixed as Rule 2 (missing PouchDB migration for consumer)"
  - "backup.ts restore uses delete-all-then-bulkDocs (not destroy/recreate) to avoid module-singleton reinit complexity"
requirements-completed: [MIGR-01, MIGR-03]
duration: ~35min
completed: 2026-03-19
---

# Phase 19 Plan 03: App Boot + Consumer Migration Summary

**Migration complete: app boots with migration-first sequence, all consumers use PouchDB, backup/restore rewritten, test suite green (319 passing, 4 pre-existing login failures)**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-19T21:00:00Z
- **Completed:** 2026-03-19T21:09:25Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- App.tsx boot sequence: `runMigrationIfNeeded -> ensureIndexes -> seedDrugDatabase -> deduplicateExistingDrugs`
- All consumer files (useAuth, PatientsPage, useRecentPatients, EditVisitPage, NewVisitPage, DataSettings) removed Dexie `db` usage
- PatientsPage and useRecentPatients replaced `useLiveQuery` with `useState + useEffect + pouchDb.allDocs`
- backup.ts fully rewritten: export via `allDocs`, restore via delete-all + `bulkDocs`, `SCHEMA_VERSION = 2`
- snapshots.ts updated: `db.settings` replaced with `getSetting/putSetting`
- Test suite: 131 failing -> 319 passing (4 pre-existing login.test.tsx failures unchanged)
- Fixed LevelDB lock contention in tests via `pouchdb-adapter-memory` with `import.meta.env.VITEST` check

## Task Commits

1. **Task 1: App boot sequence and consumer files** - `a04e5e9` (feat)
2. **Task 2: Backup, snapshots, and test suite** - `2fa4d99` (feat)

## Files Created/Modified
- `src/App.tsx` - Added migration-first boot sequence
- `src/auth/useAuth.ts` - getSetting/putSetting replace db.settings
- `src/pages/PatientsPage.tsx` - useState+useEffect+pouchDb.allDocs replace useLiveQuery
- `src/hooks/useRecentPatients.ts` - useState+useEffect replace useLiveQuery
- `src/pages/EditVisitPage.tsx` - putSetting replaces db.settings.put
- `src/pages/NewVisitPage.tsx` - getSetting/putSetting replace db.settings.get/put
- `src/components/DataSettings.tsx` - getSetting/putSetting replace db.settings (auto-fix)
- `src/utils/backup.ts` - Full PouchDB rewrite; SCHEMA_VERSION=2; old format compat
- `src/utils/snapshots.ts` - getSetting/putSetting replace db.settings
- `src/db/index.ts` - Re-export resetPouchDb as resetDatabase for test compat
- `src/db/pouchdb.ts` - Memory adapter in VITEST env
- `vitest.config.ts` - singleFork pool + forks config

## Decisions Made
- Memory adapter via `import.meta.env.VITEST` check in pouchdb.ts: avoids needing mock setup in every test file; works transparently
- `resetDatabase` re-exported from index.ts: minimal change (one line) vs updating 15+ test file imports
- DataSettings.tsx fixed alongside backup.ts since both are consumer files using db.settings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Consumer] DataSettings.tsx still imported from Dexie db**
- **Found during:** Task 2 (verification grep for `import { db }`)
- **Issue:** DataSettings.tsx was not in the plan's `files_modified` list but used `db.settings.get/put` for lastBackupDate, lastAutoSnapshotDate, and auth hash checks around restore
- **Fix:** Replaced all db.settings calls with getSetting/putSetting; updated DataSettings.test.tsx mock to use `@/db/pouchdb` instead of `@/db/index`
- **Files modified:** src/components/DataSettings.tsx, src/__tests__/DataSettings.test.tsx
- **Verification:** TypeScript clean, tests pass
- **Committed in:** 2fa4d99 (Task 2 commit)

**2. [Rule 3 - Blocking] LevelDB lock contention in parallel test workers**
- **Found during:** Task 2 (running npm run test)
- **Issue:** Multiple Vitest worker processes try to open the same `ClinicSoftware_v2` LevelDB file simultaneously, causing OpenError lock failures (131 test failures)
- **Fix:** Installed `pouchdb-adapter-memory`, added `import.meta.env.VITEST` check in pouchdb.ts to use memory adapter; added singleFork pool config in vitest.config.ts as defense
- **Files modified:** src/db/pouchdb.ts, vitest.config.ts, package.json, package-lock.json
- **Verification:** Lock errors gone; 319/323 tests pass
- **Committed in:** 2fa4d99 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing consumer file, 1 blocking test infrastructure issue)
**Impact on plan:** Both auto-fixes necessary for plan completion. No scope creep.

## Issues Encountered
- Vitest 4 changed poolOptions API - `poolOptions.forks.singleFork` was deprecated; moved to `forks.singleFork` directly under `test`
- The primary fix for lock contention was the memory adapter, not singleFork - both are now in place for belt-and-suspenders reliability

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 19 migration complete: no runtime code touches Dexie except ClinicSoftwareSnapshots (intentional) and legacy.ts (migration-only)
- App boots with: migration check -> index creation -> drug seed -> dedup
- Test suite: 319/323 passing (4 pre-existing login.test.tsx failures from v1.3, unrelated to migration)
- Ready for Phase 22 (sync infrastructure) and Phase 23 (restore flow)

---
*Phase: 19-pouchdb-migration*
*Completed: 2026-03-19*
