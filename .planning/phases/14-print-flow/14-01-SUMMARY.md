---
phase: 14-print-flow
plan: "01"
subsystem: keyboard-navigation
tags: [print, keyboard, focus, tdd]
dependency_graph:
  requires: []
  provides: [PRNT-01, PRNT-02, PRNT-03]
  affects: [PrintVisitPage, NewVisitPage, MedicationList]
tech_stack:
  added: []
  patterns: [autoFocus, useRef focus restore, tabIndex=-1 for tab exclusion, afterprint event handler]
key_files:
  created:
    - src/__tests__/PrintVisitPage.keyboard.test.tsx
  modified:
    - src/pages/PrintVisitPage.tsx
    - src/pages/NewVisitPage.tsx
    - src/components/MedicationList.tsx
decisions:
  - "tabIndex={-1} on toggle tabs and Remove buttons removes them from tab order without hiding them visually"
  - "printButtonRef + autoFocus on Print button gives keyboard users immediate access on page load"
  - "afterprint event handler calls printButtonRef.current?.focus() to restore focus after dialog closes"
  - "?auto=prescription query param triggers existing auto-print logic on PrintVisitPage"
metrics:
  duration_seconds: 146
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_modified: 4
---

# Phase 14 Plan 01: Print Flow Keyboard Navigation Summary

**One-liner:** Keyboard-driven print flow with autoFocus, tab exclusions, auto-print param, and afterprint focus restore using printButtonRef and tabIndex=-1.

## What Was Built

Completed the v1.3 keyboard milestone print flow. A doctor can now finish a prescription, Tab directly to Save & Print (skipping Remove buttons), press Enter to trigger print, and have focus automatically returned to the Print button after the dialog closes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (TDD Red) | Write keyboard tests for PRNT-01, PRNT-02, PRNT-03 | ceaa7e1 | src/__tests__/PrintVisitPage.keyboard.test.tsx |
| 2 (TDD Green) | Wire tab path, autoFocus, auto-print param, and focus restore | 902d0b6 | PrintVisitPage.tsx, NewVisitPage.tsx, MedicationList.tsx |

## Verification

- All 5 new keyboard tests pass (PRNT-01, PRNT-02, PRNT-03)
- All 20 existing PrintVisitPage tests pass
- Full suite: 299 tests passing, 4 pre-existing login.test.tsx failures (BrowserRouter basename mismatch in jsdom - not introduced by this plan)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- src/__tests__/PrintVisitPage.keyboard.test.tsx: FOUND
- src/pages/PrintVisitPage.tsx (modified): FOUND
- src/pages/NewVisitPage.tsx (modified): FOUND
- src/components/MedicationList.tsx (modified): FOUND

Commits exist:
- ceaa7e1: FOUND
- 902d0b6: FOUND
