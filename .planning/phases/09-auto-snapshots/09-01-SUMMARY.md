---
phase: 09-auto-snapshots
plan: 01
subsystem: database
tags: [dexie, indexeddb, snapshots, backup, intl-relative-time]

# Dependency graph
requires:
  - phase: 07-backup-export
    provides: exportDatabase() BackupFile serialization
provides:
  - Snapshot Dexie database (ClinicSoftwareSnapshots)
  - checkAndCreateSnapshot (24h timer, hard cap, silent error)
  - createSnapshot, rotateSnapshots (keep 3)
  - listSnapshots (newest first), getSnapshot by id
  - formatTimeAgo (Intl.RelativeTimeFormat)
  - resetSnapshotDatabase (test helper)
  - Snapshot type
affects: [09-02-snapshot-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [separate-dexie-db-for-isolation, timestamp-gated-execution, silent-error-handling]

key-files:
  created:
    - src/utils/snapshots.ts
    - src/__tests__/snapshots.test.ts
  modified: []

key-decisions:
  - "Separate Dexie instance 'ClinicSoftwareSnapshots' for snapshot isolation (survives main DB restore)"
  - "Silent error handling: checkAndCreateSnapshot wraps entire body in try/catch, never throws"
  - "formatTimeAgo uses Intl.RelativeTimeFormat with numeric:'auto' for natural language ('yesterday' not '1 day ago')"

patterns-established:
  - "Separate Dexie DB pattern: independent database for data that must survive main DB operations"
  - "resetSnapshotDatabase(): same delete/recreate pattern as resetDatabase() for test isolation"

requirements-completed: [BKUP-06, BKUP-07]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 9 Plan 01: Snapshot Data Layer Summary

**Separate Dexie snapshot database with 24h auto-creation, 3-keep/5-cap rotation, and Intl.RelativeTimeFormat time-ago display**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T06:51:03Z
- **Completed:** 2026-03-11T06:53:00Z
- **Tasks:** 2 (RED + GREEN, TDD)
- **Files modified:** 2

## Accomplishments
- Snapshot database fully isolated from main ClinicSoftware DB (survives restores)
- 24h timer check with hard cap at 5 prevents unbounded growth
- Rotation keeps exactly 3 snapshots, deletes oldest by createdAt
- 18 tests covering all snapshot behaviors including edge cases

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `63d483a` (test)
2. **GREEN: Implementation** - `8df2b4e` (feat)

_TDD plan: RED wrote 18 failing tests, GREEN implemented all functions to pass._

## Files Created/Modified
- `src/utils/snapshots.ts` - Snapshot DB class, create/rotate/list/get/formatTimeAgo functions (122 lines)
- `src/__tests__/snapshots.test.ts` - 18 unit tests covering creation, timer, rotation, listing, formatting (241 lines)

## Decisions Made
- Used `numeric: 'auto'` in Intl.RelativeTimeFormat for natural output ("yesterday" instead of "1 day ago")
- Hard cap check runs before timer check in checkAndCreateSnapshot (fail fast if stuck)
- rotateSnapshots catches individual delete errors silently, keeping extra snapshots temporarily

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All snapshot logic exported and tested, ready for Plan 02 (UI integration)
- Plan 02 will wire checkAndCreateSnapshot into App.tsx useEffect and add snapshot list to DataSettings
- formatTimeAgo ready for "Auto-backup: X ago" display line

## Self-Check: PASSED

- All files verified on disk
- All commits verified in git log (63d483a, 8df2b4e)
- 18/18 tests passing

---
*Phase: 09-auto-snapshots*
*Completed: 2026-03-11*
