---
phase: 22-live-sync
plan: 02
subsystem: sync-ui
tags: [sync, sidebar, settings, indicator, tdd]
dependency_graph:
  requires: ["22-01"]
  provides: ["sync-status-ui", "settings-sync-tab"]
  affects: ["src/components/Sidebar.tsx", "src/pages/SettingsPage.tsx"]
tech_stack:
  added: []
  patterns: ["useSyncContext hook consumer", "TDD red-green", "status config map"]
key_files:
  created:
    - src/components/SyncIndicator.tsx
    - src/__tests__/SyncIndicator.test.tsx
  modified:
    - src/components/Sidebar.tsx
    - src/pages/SettingsPage.tsx
    - src/__tests__/rbac.test.tsx
    - src/__tests__/tab-order.test.tsx
    - src/__tests__/PrintSettings.test.tsx
decisions:
  - "Settings Sync tab uses 'Disconnected' (full word) vs Sidebar uses 'Offline' (space-constrained) -- matches UI-SPEC copywriting contract"
  - "SYNC_STATUS_CONFIG defined as module-level const outside component for stable reference"
  - "formatRelativeTime as local pure function -- no external dependency needed"
metrics:
  duration_seconds: 292
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 2
  files_modified: 5
requirements_satisfied: [SYNC-03]
---

# Phase 22 Plan 02: Sync Status UI (SyncIndicator + Settings Sync Tab) Summary

**One-liner:** Sidebar sync dot (green/blue-pulse/gray) and Settings Sync tab with relative time, error detail, and retry button wired to useSyncContext.

## What Was Built

### Task 1: SyncIndicator component + Sidebar integration (TDD)

Created `src/components/SyncIndicator.tsx` -- a read-only status indicator that reads from `useSyncContext()` and renders a colored dot with optional label based on the collapsed prop.

- Collapsed: centered dot only (w-2 h-2, rounded-full)
- Expanded: dot + text-sm label ("Synced" | "Syncing" | "Offline")
- Dot colors: bg-green-500 / bg-blue-500 animate-pulse / bg-gray-400
- Accessibility: `aria-label="Sync status: {label}"` on wrapper div

Inserted into `src/components/Sidebar.tsx` between role label block and logout button.

5 tests created and passing (RED then GREEN cycle).

### Task 2: Settings Sync tab

Extended `src/pages/SettingsPage.tsx`:

- Added `| 'sync'` to `SettingsCategory` type
- Added `{ key: 'sync', label: 'Sync' }` tab
- Calls `useSyncContext()` for status, lastSynced, errorMessage, retry
- Sync panel: status dot (w-3 h-3) + label, last-synced relative time, error text (120 char limit), retry button
- Retry button and error text only visible when disconnected
- "Never synced" shown when disconnected with no prior sync

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 3 test files broken by SyncContext injection into Sidebar and SettingsPage**
- **Found during:** Task 2 verification (full suite run)
- **Issue:** rbac.test.tsx, tab-order.test.tsx, and PrintSettings.test.tsx render Sidebar or SettingsPage but had no mock for useSyncContext, causing "useSyncContext must be used within SyncProvider" errors
- **Fix:** Added `vi.mock('@/sync/SyncContext', ...)` returning a stub context to each affected test file
- **Files modified:** src/__tests__/rbac.test.tsx, src/__tests__/tab-order.test.tsx, src/__tests__/PrintSettings.test.tsx
- **Commit:** 41bc6f1

## Pre-existing Failures (Out of Scope)

- `src/__tests__/login.test.tsx` -- 1 test failing ("shows error when CouchDB not configured") pre-dates this plan
- `src/__tests__/PrintVisitPage.test.tsx` -- unhandled rejection "database is closed" from PouchDB LevelDB, all 20 tests pass, error fires after test completion

## Verification Results

- `npx vitest run src/__tests__/SyncIndicator.test.tsx` -- 5/5 pass
- `npx tsc --noEmit` -- clean
- `npx vitest run` -- 346/347 pass (1 pre-existing login test failure, 1 pre-existing unhandled rejection)

## Self-Check

| Item | Status |
|------|--------|
| src/components/SyncIndicator.tsx | FOUND |
| src/__tests__/SyncIndicator.test.tsx | FOUND |
| src/components/Sidebar.tsx contains SyncIndicator | FOUND |
| src/pages/SettingsPage.tsx contains sync tab | FOUND |
| Commit c222cfe (Task 1) | FOUND |
| Commit 41bc6f1 (Task 2) | FOUND |
