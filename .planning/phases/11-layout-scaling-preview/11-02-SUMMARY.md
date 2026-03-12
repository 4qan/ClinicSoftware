---
phase: 11-layout-scaling-preview
plan: "02"
subsystem: ui
tags: [react, print, scaling, dispensary-slip, preview-frame, paper-size, css]

# Dependency graph
requires:
  - phase: 11-01
    provides: calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS, PrescriptionSlip with paperSize prop, coerceSize
provides:
  - DispensarySlip with paperSize prop scaling fonts/spacing proportionally from A5 baseline (10pt)
  - Preview frame in PrintVisitPage with paper-proportional pixel dimensions (2.8px/mm)
  - PAGE_SIZE_KEYWORD map in printSettings.ts for CSS named page size keywords
  - Auto-print useRef guard preventing re-trigger after cancel
  - Print-only slips in hidden print:block divs eliminating preview flash
  - Tests for SCALE-02 (DispensarySlip scaling) and SCALE-04 (preview frame dimensions)
affects: [any-future-print-phase, PrintVisitPage callers, DispensarySlip callers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PAGE_SIZE_KEYWORD map translates PaperSize enum to CSS named keywords for @page size rule"
    - "Preview frame always mounted with no-print class; print-only content in hidden print:block divs"
    - "useRef boolean guard for one-shot auto-print: fires exactly once per page load"
    - "previewDimensions() helper function outside component for testability"
    - "CSS custom properties (--urdu-line-height) set via React inline style cast as CSSProperties"

key-files:
  created:
    - src/__tests__/DispensarySlip.test.tsx
  modified:
    - src/components/DispensarySlip.tsx
    - src/pages/PrintVisitPage.tsx
    - src/__tests__/PrintVisitPage.test.tsx
    - src/db/printSettings.ts

key-decisions:
  - "PAGE_SIZE_KEYWORD map uses CSS named keywords (e.g., 'letter portrait') not raw mm so Chrome print dialog respects paper size"
  - "Preview frame always mounted (no-print) with print-only slips in hidden print:block divs eliminates brief frameless flash"
  - "useRef(autoPrintFired) guard ensures ?auto=dispensary URL param does not re-trigger auto-print after cancel"
  - "PREVIEW_PX_PER_MM=2.8 gives ~414px wide A5 frame, fitting 1200px screens with breathing room"
  - "DispensarySlip uses 10pt base (vs PrescriptionSlip 11pt) to preserve compact relative density"

patterns-established:
  - "Print-only content pattern: hidden print:block wrapper div alongside always-mounted no-print preview frame"
  - "Auto-print guard: useRef boolean checked before firing window.print() to prevent re-trigger on URL param persistence"
  - "DispensarySlip follows same scaling pattern as PrescriptionSlip: calcScale, basePt, headerPt, scaled padding"

requirements-completed: [SCALE-02, SCALE-04]

# Metrics
duration: ~35min (including human verification + bug fixes)
completed: 2026-03-12
---

# Phase 11 Plan 02: Layout Scaling and Preview Summary

**DispensarySlip scaled by paper width ratio from A5 baseline (10pt), preview frame with paper-proportional dimensions, and three print bugs fixed after human verification (CSS page keywords, preview flash, auto-print re-trigger).**

## Performance

- **Duration:** ~35 min (including human print verification session)
- **Started:** 2026-03-12T09:28:00Z
- **Completed:** 2026-03-12
- **Tasks:** 3 (Tasks 1-2 automated TDD, Task 3 human-verify checkpoint + fixes)
- **Files modified:** 5

## Accomplishments

- DispensarySlip accepts `paperSize` prop: font sizes, maxWidth, padding, and Urdu line-height all scale from A5 baseline (10pt) via `calcScale()`
- Preview frame renders in PrintVisitPage with pixel dimensions proportional to selected paper size (2.8px/mm); A5 frame is visibly smaller than A4
- Three print bugs caught during human verification and fixed: CSS page size keywords, preview flash on print trigger, auto-print re-trigger after cancel

## Task Commits

1. **Task 1 RED: DispensarySlip failing tests** - `33b7a66` (test)
2. **Task 1 GREEN: Scale DispensarySlip with paper size prop** - `384812f` (feat)
3. **Task 2: Add preview frame and wire paperSize to slips** - `346e9b4` (feat)
4. **Task 3: Fix paper size keywords, preview flash, auto-print guard** - `0b00fd6` (fix)

## Files Created/Modified

- `src/__tests__/DispensarySlip.test.tsx` - 7 tests covering A5/A4/Letter scaling and Urdu line-height (SCALE-02)
- `src/components/DispensarySlip.tsx` - Added paperSize prop, calcScale-based sizing, URDU_LINE_HEIGHTS CSS var
- `src/pages/PrintVisitPage.tsx` - Preview frame (always mounted), PAGE_SIZE_KEYWORD usage, auto-print guard, print-only divs
- `src/__tests__/PrintVisitPage.test.tsx` - 3 new preview frame dimension tests + updated @page assertions for named keywords
- `src/db/printSettings.ts` - Added PAGE_SIZE_KEYWORD map export

## Decisions Made

- CSS named keywords (`letter portrait`, `A4 portrait`) in `@page` size rule: Chrome's print dialog ignores raw mm values but respects named keywords.
- Preview frame always mounted with `no-print` class; print-only slips in `hidden print:block` wrappers: eliminates brief frameless flash between printMode being set and the dialog opening.
- `useRef(autoPrintFired)` guard: auto-print fires at most once per page load. The `?auto=dispensary` param stays in the URL after cancel (URL cleanup out of scope), so the ref guard is the correct layer.

## Deviations from Plan

### Auto-fixed Issues (found during human verification, Rule 1 - Bug)

**1. [Rule 1 - Bug] CSS @page size rule used raw mm dimensions instead of named keywords**
- **Found during:** Task 3 (human print verification)
- **Issue:** `injectPageStyle()` generated `size: 216mm 279mm` for Letter; Chrome print dialog ignored it and defaulted to OS paper size
- **Fix:** Added `PAGE_SIZE_KEYWORD` export to `src/db/printSettings.ts`; updated `injectPageStyle()` to use named keywords
- **Files modified:** src/db/printSettings.ts, src/pages/PrintVisitPage.tsx
- **Verification:** @page assertions in tests updated and passing (20/20 PrintVisitPage tests pass)
- **Committed in:** `0b00fd6`

**2. [Rule 1 - Bug] Preview frame unmounted on printMode causing visual flash**
- **Found during:** Task 3 (human print verification)
- **Issue:** Setting `printMode` unmounted preview frame; a frameless slip rendered briefly before print dialog appeared
- **Fix:** Preview frame kept always mounted (has `no-print` class); print-only slips moved into `hidden print:block` wrapper divs
- **Files modified:** src/pages/PrintVisitPage.tsx
- **Verification:** Human confirmed no flash; all 20 PrintVisitPage tests pass
- **Committed in:** `0b00fd6`

**3. [Rule 1 - Bug] Auto-print re-triggered after user cancelled print dialog**
- **Found during:** Task 3 (human print verification)
- **Issue:** `?auto=dispensary` stays in URL after cancel; useEffect dependency re-ran and called `window.print()` again
- **Fix:** Added `useRef(autoPrintFired)` boolean guard checked before firing `window.print()`; ref set to true on first fire
- **Files modified:** src/pages/PrintVisitPage.tsx
- **Verification:** Human confirmed auto-print fires once; existing auto-print tests pass
- **Committed in:** `0b00fd6`

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug, found during human verification)
**Impact on plan:** All three fixes required for correct print behavior. No scope creep.

## Issues Encountered

- `DatabaseClosedError` in PrintVisitPage.test.tsx is a pre-existing test isolation issue present before this plan. Confirmed by stashing changes and reproducing. Not caused by this plan.
- `login.test.tsx` has 4 pre-existing failures unrelated to print changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full scaling story complete for both PrescriptionSlip and DispensarySlip
- URDU_LINE_HEIGHTS values (A4/Letter = 2.6) are empirical estimates; descender clipping may need tuning in production use
- No blockers for future phases using PrintVisitPage or the slip components

---
*Phase: 11-layout-scaling-preview*
*Completed: 2026-03-12*
