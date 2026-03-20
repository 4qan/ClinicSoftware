---
phase: 22-live-sync
plan: "03"
subsystem: ui
tags: [pouchdb, react-hooks, changes-feed, live-sync, real-time]

# Dependency graph
requires:
  - phase: 22-01
    provides: PouchDB sync engine with live replication to CouchDB
provides:
  - Live-refreshing useRecentPatients hook via PouchDB changes feed
  - Live-refreshing usePatientSearch hook via PouchDB changes feed
  - Live-refreshing useDrugSearch hook via PouchDB changes feed

affects: [22-live-sync, any future hooks reading from pouchDb]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useCallback + changes feed subscription pattern for auto-refreshing hooks
    - ID prefix filtering (patient:/recent:/drug:) instead of PouchDB filter functions

key-files:
  created: []
  modified:
    - src/hooks/useRecentPatients.ts
    - src/hooks/usePatientSearch.ts
    - src/hooks/useDrugSearch.ts

key-decisions:
  - "Filter changes by doc ID prefix (change.id.startsWith) rather than PouchDB filter option -- filter functions unreliable with since:now + live:true across all adapters"
  - "Search hooks only open changes feed when query meets minimum length threshold -- avoids wasteful subscriptions on empty search"
  - "No changes feed in form components (NewVisitPage, EditVisitPage) per CONTEXT.md locked decision"

patterns-established:
  - "Pattern: useCallback wraps fetch/search logic; changes feed calls it -- clean separation of trigger vs. execution"
  - "Pattern: changes.cancel() returned from useEffect cleanup -- every subscription has a guaranteed teardown"

requirements-completed:
  - SYNC-01
  - SYNC-02
  - SYNC-04

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 22 Plan 03: Live-Sync UI Refresh Summary

**PouchDB changes feed wired into useRecentPatients, usePatientSearch, and useDrugSearch so UI auto-refreshes when sync delivers new documents from the other machine**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-20T14:25:36Z
- **Completed:** 2026-03-20T14:28:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Patient list auto-refreshes when sync delivers new patient or recent documents
- Patient search re-runs active query when sync delivers matching patient documents
- Drug search re-runs active query when sync delivers matching drug documents
- All changes feed subscriptions properly cleaned up on unmount via changes.cancel()
- Form components (NewVisitPage, EditVisitPage) remain untouched as required

## Task Commits

1. **Task 1: Add changes feed to useRecentPatients** - `48ac5d3` (feat)
2. **Task 2: Add changes feed to usePatientSearch and useDrugSearch** - `f8ee4aa` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/hooks/useRecentPatients.ts` - Added useCallback refresh + live changes feed subscribing on patient:/recent: doc changes
- `src/hooks/usePatientSearch.ts` - Extracted doSearch callback + live changes feed subscribing when query is active (>=2 chars)
- `src/hooks/useDrugSearch.ts` - Extracted doSearch callback + live changes feed subscribing when query is active (>=1 char)

## Decisions Made

- Used `change.id.startsWith()` prefix filtering instead of PouchDB `filter` option: filter functions are not reliably supported with `since: 'now'` + `live: true` across all PouchDB adapters. ID prefix is reliable because pouchdb.ts uses consistent `type:` prefixed IDs.
- Search hooks only open the changes subscription when the query meets the minimum threshold, avoiding pointless subscriptions on empty input.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

`login.test.tsx` has a pre-existing failure (unable to find `Password` label -- test is looking for a label that no longer exists after the CouchDB URL field was added to the login form in plan 21-01). This failure predates this plan and is out of scope. All 32 other test files pass (346 tests).

## Next Phase Readiness

- All three data-fetching hooks now react to sync events in real-time
- Phase 22 plan 03 is the last plan in the live-sync phase -- sync is now end-to-end functional
- Pre-existing login test failure should be addressed in a follow-up

---
*Phase: 22-live-sync*
*Completed: 2026-03-20*
