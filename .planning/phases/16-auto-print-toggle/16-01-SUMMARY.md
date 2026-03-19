---
phase: 16-auto-print-toggle
plan: "01"
subsystem: print-settings
tags: [print, settings, toggle, dexie, tdd]
dependency_graph:
  requires: []
  provides: [autoPrint-persistence, autoPrint-settings-UI, autoPrint-gate]
  affects: [src/db/printSettings.ts, src/components/PrintSettings.tsx, src/pages/PrintVisitPage.tsx]
tech_stack:
  added: []
  patterns: [dexie-settings-put, aria-role-switch, tdd-red-green]
key_files:
  created: [src/__tests__/PrintSettings.test.tsx (4 new tests)]
  modified:
    - src/db/printSettings.ts
    - src/components/PrintSettings.tsx
    - src/pages/PrintVisitPage.tsx
decisions:
  - autoPrint defaults to true when key absent from DB (existing installs keep current behavior)
  - Page style injected regardless of autoPrint flag so manual print button always works
  - focus:outline-none removed from toggle button to comply with project focus style rules
metrics:
  duration: ~5 minutes
  completed: "2026-03-19"
  tasks_completed: 2
  files_modified: 4
---

# Phase 16 Plan 01: Auto-Print Toggle Summary

**One-liner:** Auto-print on/off toggle persisted in Dexie with `saveAutoPrint()`, gating `window.print()` in PrintVisitPage behind `printSettings.autoPrint`.

## What Was Built

- `autoPrint: boolean` added to `PrintSettings` interface; defaults `true` when key absent (existing installs preserve auto-print behavior)
- `saveAutoPrint(value: boolean)` exported from `src/db/printSettings.ts`
- `getPrintSettings()` now fetches `autoPrint` from DB alongside paper size settings
- "Auto-Print on Save" pill toggle card added below Dispensary Slip card in `PrintSettings` component
- Toggle uses `role="switch"` + `aria-checked` for accessibility, auto-saves on click
- `PrintVisitPage` skips `setTimeout(() => window.print(), 200)` when `printSettings.autoPrint` is false; preview tab and page style still set so manual print button works

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add autoPrint to persistence layer and settings UI | cb482d8 | src/db/printSettings.ts, src/components/PrintSettings.tsx, src/__tests__/PrintSettings.test.tsx |
| 2 | Gate auto-print in PrintVisitPage | a093347 | src/pages/PrintVisitPage.tsx, src/components/PrintSettings.tsx |

## Test Results

- 17 PrintSettings tests pass (13 existing + 4 new auto-print toggle tests)
- 316 total tests pass; 4 pre-existing failures in login.test.tsx (BrowserRouter basename mismatch in jsdom, documented in STATE.md)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed focus:outline-none from toggle button**
- **Found during:** Task 2 (full test suite run)
- **Issue:** Initial toggle implementation included `focus:outline-none` which violates project focus style rules enforced by `focus-styles.test.tsx`
- **Fix:** Removed `focus:outline-none` from toggle button className; project handles focus globally via CSS in index.css
- **Files modified:** src/components/PrintSettings.tsx
- **Commit:** a093347

## Self-Check: PASSED

- src/db/printSettings.ts exists with `autoPrint` field and `saveAutoPrint` export
- src/components/PrintSettings.tsx contains "Auto-Print on Save" toggle
- src/pages/PrintVisitPage.tsx contains `printSettings?.autoPrint` guard
- Commits cb482d8 and a093347 verified in git log
