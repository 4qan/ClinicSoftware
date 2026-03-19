---
phase: 17-visit-vitals
plan: 02
subsystem: ui
tags: [react, typescript, vitals, visit-history, visitcard]

# Dependency graph
requires:
  - phase: 17-01
    provides: Visit type with optional vital fields (temperature, systolic, diastolic, weight, spo2) in IndexedDB
provides:
  - Vitals badges row (Temp/BP/Wt/SpO2) in VisitCard collapsed header for every visit
  - Vitals line per entry in NewVisitPage inline visit history preview
  - Verified: PrintVisitPage has no vitals data on printed slips
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - formatVitalsLine helper: pure function returning canonical "Temp: X | BP: X/X | Wt: X | SpO2: X" string with '--' for undefined fields
    - Generic filter functions in tests to preserve input type through Array.filter

key-files:
  created: []
  modified:
    - src/components/VisitCard.tsx
    - src/pages/NewVisitPage.tsx
    - src/__tests__/slipPrintFiltering.test.tsx

key-decisions:
  - "Vitals row appears on every visit card including those with all '--' placeholders (per prior user decision)"
  - "formatVitalsLine is a standalone helper in VisitCard.tsx, not shared; NewVisitPage uses inline template literal for the same format"

patterns-established:
  - "Vitals display format: Temp: {val} | BP: {sys}/{dia} | Wt: {val} | SpO2: {val} with '--' for missing fields"

requirements-completed: [VIT-04, VIT-05, VIT-06]

# Metrics
duration: 10min
completed: 2026-03-19
---

# Phase 17 Plan 02: Visit Vitals Display Summary

**Vitals badges (Temp/BP/Wt/SpO2) surfaced in VisitCard collapsed headers and NewVisitPage inline visit history, with '--' placeholders for unfilled fields and zero impact on printed slips.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-19T12:35:00Z
- **Completed:** 2026-03-19T12:45:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- VisitCard: every collapsed header now shows a monospace vitals row (Temp/BP/Wt/SpO2) using '--' for undefined fields
- NewVisitPage: inline visit history entries show the same vitals format below note preview
- PrintVisitPage confirmed unaffected -- no vital fields referenced in print output

## Task Commits

1. **Task 1: Vitals badges in VisitCard collapsed header** - `82d7027` (feat)
2. **Task 2: Vitals line in NewVisitPage inline history + build fix** - `d79132b` (feat)

## Files Created/Modified
- `src/components/VisitCard.tsx` - Added `formatVitalsLine` helper and vitals `<p>` row in collapsed header
- `src/pages/NewVisitPage.tsx` - Extended visitHistory state type with vital fields; mapped and rendered vitals line per entry
- `src/__tests__/slipPrintFiltering.test.tsx` - Fixed pre-existing generic type error in filter helpers (blocking build)

## Decisions Made
- Vitals row appears on every visit (including all-'--'), consistent with Plan 01 user decision
- No shared utility file for vitals formatting; VisitCard uses a helper function, NewVisitPage uses an inline template literal -- both produce the same output format

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing type error in slipPrintFiltering.test.tsx**
- **Found during:** Task 2 (build verification)
- **Issue:** `filterPrescriptionMeds` and `filterDispensaryMeds` used `{ slipType?: string }[]` as parameter type, causing `Array.filter` to return that narrowed type, so accessing `.brandName` on results failed TypeScript's `tsc -b` build
- **Fix:** Made both functions generic (`T extends { slipType?: string }`) so the return type preserves the full input object type
- **Files modified:** src/__tests__/slipPrintFiltering.test.tsx
- **Verification:** `npm run build` passes cleanly
- **Committed in:** d79132b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Pre-existing build breakage required fix to satisfy plan's build-passes success criterion. No scope creep.

## Issues Encountered
None beyond the auto-fixed test type error above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 17 (Visit Vitals) is fully complete: schema (17-01) + display (17-02)
- Vitals data flows end-to-end: input on NewVisitPage, stored in IndexedDB, displayed in VisitCard and visit history preview
- No blockers for subsequent phases

---
*Phase: 17-visit-vitals*
*Completed: 2026-03-19*
