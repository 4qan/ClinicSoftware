---
phase: 11-layout-scaling-preview
plan: 01
subsystem: ui
tags: [react, typescript, print, scaling, urdu, css-custom-properties]

# Dependency graph
requires:
  - phase: 10-print-infrastructure-settings
    provides: printSettings.ts with PaperSize, PAPER_SIZES, calcMargin, getPrintSettings

provides:
  - A6-free PaperSize type ('A5' | 'A4' | 'Letter')
  - calcScale(paperSize): width ratio from A5 baseline
  - URDU_LINE_HEIGHTS: per-size Nastaliq line-height values
  - A6->A5 coercion in getPrintSettings() for legacy DB values
  - PrescriptionSlip scaled proportionally by paperSize prop
  - --urdu-line-height CSS custom property wired from component to .urdu-cell

affects:
  - 11-02 (preview scaling, will use calcScale and URDU_LINE_HEIGHTS)
  - Any future slip components (pattern: pass paperSize prop, use calcScale)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scaling pattern: calcScale(paperSize) = PAPER_SIZES[size].width / A5_WIDTH for proportional font sizing"
    - "CSS custom property bridge: component sets --urdu-line-height on root element, CSS reads var(--urdu-line-height, 2.2)"
    - "Legacy coercion: coerceSize() validates DB values against VALID_SIZES, defaults to 'A5'"

key-files:
  created:
    - src/__tests__/PrescriptionSlip.test.tsx
  modified:
    - src/db/printSettings.ts
    - src/components/PrescriptionSlip.tsx
    - src/index.css
    - src/__tests__/printSettings.db.test.ts
    - src/__tests__/PrintVisitPage.test.tsx
    - src/__tests__/PrintSettings.test.tsx
    - src/pages/PrintVisitPage.tsx

key-decisions:
  - "A5 is the scaling baseline (width=148mm): all font sizes are multiples of 11pt * (paperWidth/148)"
  - "URDU_LINE_HEIGHTS A4/Letter set to 2.6 as starting estimates - need empirical print testing"
  - "coerceSize() validates against explicit VALID_SIZES array, not dynamic PAPER_SIZE_ORDER, for safety"
  - "jsdom normalizes '11.0pt' to '11pt' - test written to match normalized value"

patterns-established:
  - "Slip scaling pattern: const scale = calcScale(paperSize); basePt = +(11 * scale).toFixed(1)"
  - "CSS custom property bridge: set ['--urdu-line-height' as string] on root div style object, use var() in CSS"

requirements-completed: [SCALE-01, SCALE-03]

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 11 Plan 01: Remove A6 and Scale PrescriptionSlip Summary

**A6 paper size removed, calcScale()/URDU_LINE_HEIGHTS added to printSettings.ts, and PrescriptionSlip now scales fonts proportionally from A5 baseline via paperSize prop with dynamic Urdu line-height via CSS custom property.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T09:20:15Z
- **Completed:** 2026-03-12T09:27:09Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- A6 completely removed from PaperSize type, PAPER_SIZES constant, and PAPER_SIZE_ORDER; legacy DB values coerced to A5
- calcScale() and URDU_LINE_HEIGHTS exported from printSettings.ts with full test coverage
- PrescriptionSlip renders at correct font scale per paper size with dynamic Urdu line-height

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove A6 and add scaling infrastructure** - `eba5abe` (feat)
2. **Task 2: Scale PrescriptionSlip with paper size prop** - `02013c4` (feat)

_Note: TDD tasks. Each went through RED then GREEN._

## Files Created/Modified

- `src/db/printSettings.ts` - Removed A6, added coerceSize(), calcScale(), URDU_LINE_HEIGHTS
- `src/components/PrescriptionSlip.tsx` - Added paperSize prop, scaling via calcScale(), --urdu-line-height custom property
- `src/index.css` - .urdu-cell line-height now reads var(--urdu-line-height, 2.2)
- `src/pages/PrintVisitPage.tsx` - Pass paperSize prop to PrescriptionSlip
- `src/__tests__/PrescriptionSlip.test.tsx` - New: 8 tests for SCALE-01 and SCALE-03
- `src/__tests__/printSettings.db.test.ts` - Removed A6 tests, added calcScale/URDU_LINE_HEIGHTS/fallback tests (22 total)
- `src/__tests__/PrintVisitPage.test.tsx` - Replaced A6 badge test with A6-fallback-to-A5 test
- `src/__tests__/PrintSettings.test.tsx` - Updated mock to remove A6, updated option count and dispensary test

## Decisions Made

- A5 width (148mm) is the scaling baseline for calcScale(). All font sizing derives from this ratio.
- URDU_LINE_HEIGHTS for A4 and Letter are set to 2.6 as starting estimates. The Nastaliq font scales non-linearly and these values require empirical print testing in a future plan.
- coerceSize() uses an explicit VALID_SIZES array rather than PAPER_SIZE_ORDER to ensure safety even if ordering changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated PrintSettings.test.tsx mock and tests to match A6 removal**
- **Found during:** Task 1 (Remove A6 and add scaling infrastructure)
- **Issue:** PrintSettings.test.tsx had a vi.mock for @/db/printSettings that still included A6 in PAPER_SIZE_ORDER and PAPER_SIZES, and tests checked for 4 dropdown options and A6 option visibility
- **Fix:** Updated mock to remove A6 entry, changed "4 options" test to "3 options", replaced "shows A6 option" test with "does not show A6 option", updated dispensary change test to use 'Letter' instead of 'A6'
- **Files modified:** src/__tests__/PrintSettings.test.tsx
- **Verification:** All 52 tests pass in the 3 test files
- **Committed in:** eba5abe (Task 1 commit)

**2. [Rule 1 - Bug] jsdom normalizes '11.0pt' to '11pt' in A5 test**
- **Found during:** Task 2 (Scale PrescriptionSlip) - GREEN phase
- **Issue:** Test expected `root.style.fontSize` to be `'11.0pt'` but jsdom normalizes it to `'11pt'` (drops trailing zero)
- **Fix:** Updated test expectation to `'11pt'` with comment explaining jsdom normalization
- **Files modified:** src/__tests__/PrescriptionSlip.test.tsx
- **Verification:** All 8 PrescriptionSlip tests pass
- **Committed in:** 02013c4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for correct test behavior. No scope creep.

## Issues Encountered

- Pre-existing `DatabaseClosedError` unhandled rejection in PrintVisitPage tests (from Dexie teardown in jsdom). Confirmed pre-existing by stash test. Not caused by our changes, not fixed (out of scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scaling infrastructure (calcScale, URDU_LINE_HEIGHTS) ready for Plan 02 (preview layout)
- PrescriptionSlip accepts paperSize prop and scales correctly
- URDU_LINE_HEIGHTS A4/Letter values (2.6) are estimates and need empirical verification via actual print testing

---
*Phase: 11-layout-scaling-preview*
*Completed: 2026-03-12*
