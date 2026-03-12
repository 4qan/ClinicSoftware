---
phase: 11-layout-scaling-preview
plan: 02
subsystem: ui
tags: [react, print, scaling, dispensary-slip, preview-frame, paper-size]

# Dependency graph
requires:
  - phase: 11-01
    provides: calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS, PrescriptionSlip with paperSize prop
provides:
  - DispensarySlip with paperSize prop scaling fonts/spacing proportionally from A5 baseline
  - Preview frame in PrintVisitPage with paper-proportional pixel dimensions
  - Both slips receive paperSize for both preview and print paths
  - Tests for SCALE-02 (DispensarySlip scaling) and SCALE-04 (preview frame dimensions)
affects: [12-any-future-print-phase, print-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Preview frame uses PREVIEW_PX_PER_MM=2.8 constant to convert paper mm to screen px"
    - "previewDimensions() helper function outside component for testability"
    - "Separate print-mode rendering path (no preview frame) vs screen preview path (with frame)"
    - "CSS custom properties (--urdu-line-height) set via React inline style cast as CSSProperties"

key-files:
  created:
    - src/__tests__/DispensarySlip.test.tsx
  modified:
    - src/components/DispensarySlip.tsx
    - src/pages/PrintVisitPage.tsx
    - src/__tests__/PrintVisitPage.test.tsx

key-decisions:
  - "PREVIEW_PX_PER_MM=2.8 gives ~414px wide A5 frame, fitting 1200px screens with breathing room"
  - "Preview frame only rendered when printMode===null (screen view); print path uses separate slip render without frame"
  - "DispensarySlip uses 10pt base (vs PrescriptionSlip 11pt) to preserve compact relative density"

patterns-established:
  - "DispensarySlip follows same scaling pattern as PrescriptionSlip: calcScale, basePt, headerPt, scaled padding"
  - "previewDimensions() is a standalone function to keep component body clean and support direct testing"

requirements-completed: [SCALE-02, SCALE-04]

# Metrics
duration: 15min
completed: 2026-03-12
---

# Phase 11 Plan 02: Layout Scaling and Preview Summary

**DispensarySlip scaled by paper width ratio from A5 baseline (10pt), with paper-proportional preview frame in PrintVisitPage using 2.8px/mm conversion**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-12T09:28:00Z
- **Completed:** 2026-03-12T09:33:36Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- DispensarySlip accepts `paperSize` prop and scales font sizes (10pt A5 base), maxWidth, padding, and --urdu-line-height CSS variable proportionally
- Preview frame in PrintVisitPage renders with pixel dimensions matching paper aspect ratio (A5: 414x588px, A4: 588x832px)
- Both slips receive correct paperSize in both preview and print rendering paths
- 7 new DispensarySlip tests (SCALE-02) + 3 new preview frame tests (SCALE-04) all pass

## Task Commits

1. **Task 1 RED: DispensarySlip failing tests** - `33b7a66` (test)
2. **Task 1 GREEN: DispensarySlip scaling implementation** - `384812f` (feat)
3. **Task 2: Preview frame + paperSize wiring** - `346e9b4` (feat)

## Files Created/Modified
- `src/__tests__/DispensarySlip.test.tsx` - 7 tests covering A5/A4/Letter scaling and Urdu line-height (SCALE-02)
- `src/components/DispensarySlip.tsx` - Added paperSize prop, calcScale-based sizing, URDU_LINE_HEIGHTS CSS var
- `src/pages/PrintVisitPage.tsx` - Added previewDimensions helper, preview frame wrapper, paperSize on both slips
- `src/__tests__/PrintVisitPage.test.tsx` - 3 new tests for preview frame dimensions at A5/A4 and tab switching (SCALE-04)

## Decisions Made
- PREVIEW_PX_PER_MM=2.8: gives A5 frame ~414px wide, fits comfortably on standard screens while remaining visually meaningful
- Separate print-mode rendering path: when printing, slips render without the preview frame div to avoid frame styling affecting print output
- DispensarySlip 10pt base preserved (vs PrescriptionSlip 11pt) to maintain intentional density difference

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- DatabaseClosedError in PrintVisitPage.test.tsx is a pre-existing test isolation issue (present before this plan). Confirmed by reverting changes and reproducing. Not caused by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Human print verification needed (Task 3 checkpoint): confirm scaling looks correct at all paper sizes, Urdu text not clipping
- If Urdu clips at any size, URDU_LINE_HEIGHTS values in `src/db/printSettings.ts` need tuning (A4/Letter currently at 2.6 as estimates)
- After human approval, phase 11 is complete

---
*Phase: 11-layout-scaling-preview*
*Completed: 2026-03-12*
