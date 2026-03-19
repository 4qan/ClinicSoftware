---
phase: 15-slip-assignment
plan: 02
subsystem: ui
tags: [react, typescript, print, filtering, medication, badge]

# Dependency graph
requires: [15-01]
provides:
  - Print filtering by slipType (prescriptionMeds / dispensaryMeds derived arrays)
  - Empty slip handling: button disabled + preview message + auto-print skip
  - Rx badge in visit history for prescription-tagged medications
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "filter by slipType === 'prescription' for prescription slip; (slipType ?? 'dispensary') === 'dispensary' for dispensary slip"
    - "disabled={activeSlipMeds.length === 0} pattern for empty-aware print button"
    - "Conditional rendering: empty message vs slip component based on filtered array length"

key-files:
  created:
    - src/__tests__/slipPrintFiltering.test.tsx
  modified:
    - src/pages/PrintVisitPage.tsx
    - src/components/VisitCard.tsx
    - src/__tests__/PrintVisitPage.test.tsx
    - src/__tests__/PrintVisitPage.keyboard.test.tsx

key-decisions:
  - "prescriptionMeds and dispensaryMeds derived inline in PrintVisitPage; no separate utility file needed"
  - "Backward compat: slipType undefined treated as dispensary via null-coalescing in filter"
  - "Auto-print skip: check targetMeds.length before scheduling window.print() in useEffect"
  - "Rx badge shown only for prescription; dispensary (default) gets no badge per user decision from Plan 01"

requirements-completed: [SLIP-03, SLIP-04]

# Metrics
duration: ~5min
completed: 2026-03-19
---

# Phase 15 Plan 02: Slip Print Filtering + Rx Badge Summary

**Print page now filters medications by slipType, handles empty slips gracefully, and shows Rx badge in visit history for prescription-tagged medications**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-19T10:32:33Z
- **Completed:** 2026-03-19T10:37:34Z
- **Tasks completed:** 3 of 3
- **Files modified:** 5 (+ 1 created)

## Accomplishments

- `prescriptionMeds` and `dispensaryMeds` derived arrays filter the full `medications` state in `PrintVisitPage`
- Both the preview-frame and print-only instances of `PrescriptionSlip`/`DispensarySlip` receive filtered arrays
- Print button disabled (`disabled` attr + gray styling + `cursor-not-allowed`) when active slip has no medications
- Preview frame shows "No medications for this slip" centered message when filtered array is empty
- Auto-print `useEffect` checks `targetMeds.length` before scheduling `window.print()`; skips silently if empty
- Rx badge (`text-xs bg-blue-100 text-blue-700`) added to desktop table rows and mobile cards in `VisitCard`
- 8 new tests in `slipPrintFiltering.test.tsx`: 4 pure filter unit tests + 4 integration tests

## Task Commits

1. **Task 1: Filter medications on print page and handle empty slips** - `4d0d995` (feat + test, TDD)
2. **Task 2: Add Rx badge to visit history medication lists** - `c409909` (feat + test fix)
3. **Task 3: Verify complete slip assignment flow** - checkpoint:human-verify, approved by user

## Files Created/Modified

- `src/pages/PrintVisitPage.tsx` - Added prescriptionMeds/dispensaryMeds derived arrays; disabled print button; empty message in preview; auto-print skip
- `src/__tests__/slipPrintFiltering.test.tsx` - 8 tests: filter logic (4 pure), empty button (2), auto-print skip (1), empty message (1)
- `src/components/VisitCard.tsx` - Rx badge in desktop table row and mobile card when slipType='prescription'
- `src/__tests__/PrintVisitPage.test.tsx` - Updated beforeEach medication to slipType='prescription'; 3 dispensary tests use new local visit with slipType='dispensary'
- `src/__tests__/PrintVisitPage.keyboard.test.tsx` - Updated beforeEach medication to slipType='prescription'

## Decisions Made

- Derived arrays inline in PrintVisitPage (no separate util file) -- plan allowed either; inline is simpler
- Test fixes use explicit `slipType` on each test medication rather than relying on backward-compat default -- clearer intent
- Auto-print skip uses early return before `setTimeout` rather than guarding inside the callback -- simpler and testable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing PrintVisitPage tests to work with filtering**
- **Found during:** Task 2 (running full test suite)
- **Issue:** Existing `PrintVisitPage.test.tsx` and `PrintVisitPage.keyboard.test.tsx` create visit medications without `slipType`. Post-filtering, those meds are all dispensary, leaving the prescription slip empty and the print button disabled. Tests that clicked "Print Prescription" or expected `.prescription-slip` in DOM broke.
- **Fix:** Added `slipType: 'prescription'` to the shared `beforeEach` medication (so prescription preview is non-empty). For 3 dispensary-specific tests, created a local visit with `slipType: 'dispensary'` inline.
- **Files modified:** `src/__tests__/PrintVisitPage.test.tsx`, `src/__tests__/PrintVisitPage.keyboard.test.tsx`
- **Commit:** `c409909`

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact:** Tests now accurately reflect the correct post-filtering behavior.

## Issues Encountered

- Pre-existing `login.test.tsx` 4 failures (BrowserRouter basename jsdom mismatch, carried from v1.3) -- unchanged.
- Pre-existing `DatabaseClosedError` unhandled rejection from Dexie cleanup -- unchanged.

## Next Phase Readiness

- Phase 15 (Slip Assignment) fully complete. Phase 16 (Print Settings) can proceed.
- PrintVisitPage is the primary target for Phase 16 print setting work.
- Pre-existing login.test.tsx failures (BrowserRouter basename jsdom mismatch) remain out of scope.

---
*Phase: 15-slip-assignment*
*Completed: 2026-03-19*
