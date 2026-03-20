---
phase: 22-live-sync
plan: 01
subsystem: sync
tags: [pouchdb, couchdb, react-context, workbox, service-worker, live-sync]

# Dependency graph
requires:
  - phase: 21-auth
    provides: useAuthContext with credentials and isAuthenticated
  - phase: 19-pouchdb-migration
    provides: pouchDb singleton, getSetting helper
provides:
  - useSyncManager hook (sync lifecycle, status state machine, start/stop/retry)
  - SyncContext and SyncProvider (sync state accessible app-wide)
  - useSyncStatus consumer hook
  - Workbox NetworkOnly exclusion for cross-origin CouchDB requests
affects: [22-live-sync plan-02, 22-live-sync plan-03, any component reading sync status]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Store PouchDB sync handle in useRef (not useState) to prevent re-render loops
    - SyncProvider below AuthProvider: reads auth state, auto-manages sync lifecycle
    - Workbox runtimeCaching NetworkOnly for cross-origin to prevent SW intercepting CouchDB long-poll

key-files:
  created:
    - src/sync/useSyncManager.ts
    - src/sync/SyncContext.tsx
    - src/sync/useSyncStatus.ts
    - src/__tests__/sync.test.tsx
  modified:
    - src/App.tsx
    - vite.config.ts

key-decisions:
  - "syncHandleRef stored in useRef, not useState, to prevent re-render loop on every sync event"
  - "SyncProvider positioned inside AuthProvider, outside AppContent, so sync runs for entire authenticated session"
  - "401/403 errors cancel sync handle and surface clear user message; other errors set disconnected but allow retry retry"
  - "Workbox runtimeCaching NetworkOnly on url.origin !== self.location.origin excludes all cross-origin requests including CouchDB"

patterns-established:
  - "Pattern: sync handle lifecycle in useRef with start/stop guard prevents Pitfall 3 (double sync)"
  - "Pattern: SyncProvider useEffect watches [isAuthenticated, credentials] and cleanup calls stop()"

requirements-completed: [SYNC-01, SYNC-02, SYNC-04]

# Metrics
duration: 15min
completed: 2026-03-20
---

# Phase 22 Plan 01: Live Sync Engine Summary

**PouchDB live bidirectional sync via useSyncManager hook and SyncContext, with 401/403 auth error handling and Workbox service worker exclusion for CouchDB requests**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-20T19:20:00Z
- **Completed:** 2026-03-20T19:35:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created useSyncManager hook with full status state machine (disconnected/syncing/synced) and auth error detection
- Created SyncContext/SyncProvider that auto-starts sync on login and stops on logout using useAuthContext
- Wired SyncProvider into App.tsx provider tree below AuthProvider
- Added Workbox runtimeCaching NetworkOnly rule to prevent service worker intercepting CouchDB long-poll connections
- 9 unit tests covering all sync lifecycle behaviors pass

## Task Commits

1. **Task 1: Create useSyncManager hook, SyncContext, useSyncStatus, and tests** - `110ef28` (feat)
2. **Task 2: Wire SyncProvider into App.tsx and add Workbox CouchDB exclusion** - `dd61967` (feat)

## Files Created/Modified

- `src/sync/useSyncManager.ts` - Sync lifecycle hook: handle ref, status state machine, start/stop/retry
- `src/sync/SyncContext.tsx` - React context + SyncProvider that auto-manages sync from auth state
- `src/sync/useSyncStatus.ts` - Thin consumer hook re-exporting useSyncContext()
- `src/__tests__/sync.test.tsx` - 9 unit tests: handle management, event mapping, auth error handling, provider lifecycle
- `src/App.tsx` - Added SyncProvider import and wrapper in provider tree
- `vite.config.ts` - Added runtimeCaching NetworkOnly rule for cross-origin requests

## Decisions Made

- Sync handle stored in `useRef` (not state) to prevent re-render loop on every PouchDB event (Pitfall 3 from RESEARCH.md)
- SyncProvider placed inside AuthProvider but outside AppContent so sync spans the entire authenticated session
- Auth errors (401/403) hard-stop sync via `handle.cancel()` and set clear user-facing message; generic errors only set disconnected state (PouchDB retry continues)
- Workbox exclusion uses `url.origin !== self.location.origin` (broad cross-origin pattern) per RESEARCH.md Pattern 3

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Test file initially used variables in vi.mock factory before initialization (hoisting issue). Fixed by moving mock state into a module-level `syncState` object that factories can reference.

## Next Phase Readiness

- Sync engine is complete and wired. Plan 02 can add the SyncIndicator to the sidebar by reading `useSyncStatus()`.
- Plan 03 can wire the changes feed into list hooks (useRecentPatients, usePatientSearch) using `pouchDb.changes({ since: 'now', live: true })`.
- No blockers.

---
*Phase: 22-live-sync*
*Completed: 2026-03-20*
