---
phase: 10-print-infrastructure-settings
plan: 02
subsystem: ui, print
tags: [react, tailwind, vitest, print, css, dexie]

# Dependency graph
requires:
  - phase: 10-01
    provides: getPrintSettings, PAPER_SIZES, calcMargin, PaperSize type from src/db/printSettings.ts
provides:
  - Dynamic @page CSS injection in PrintVisitPage before window.print()
  - Conditional slip rendering (prescription XOR dispensary in DOM during print)
  - Paper size badge near print button showing active slip's configured size
  - Removed hardcoded @page from index.css
  - 10 new tests covering PRENG-01 (@page injection) and PRENG-03 (conditional rendering)
affects:
  - 11-print-ui (print UI can rely on dynamic page sizing and DOM isolation being in place)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inject <style media='print'> synchronously before window.print(), remove on afterprint"
    - "Conditional rendering (showPrescription && <Slip>) not CSS hiding for print DOM isolation"
    - "Use fireEvent.click (not userEvent) when jsdom @page CSS causes getComputedStyle crash"
    - "Global afterEach cleanup of injected style elements to prevent test leakage"
    - "getAllByText when text appears in both breadcrumb and button to avoid TestingLibrary ambiguity"

key-files:
  created: []
  modified:
    - src/pages/PrintVisitPage.tsx
    - src/index.css
    - src/__tests__/PrintVisitPage.test.tsx

key-decisions:
  - "style.media='print' on injected <style> element to scope it to print media"
  - "fireEvent.click replaces userEvent.click for interactions after DispensarySlip mounts, because jsdom crashes on @page CSS rules during user-event pointer-events check via getComputedStyle"
  - "Global afterEach removes print-page-style element to prevent CSS leakage between tests"

patterns-established:
  - "Print engine pattern: injectPageStyle() synchronously before setTimeout(window.print), removePageStyle() in handleAfterPrint"
  - "Conditional rendering for print isolation: showPrescription/showDispensary derived from printMode/previewMode"

requirements-completed: [PRENG-01, PRENG-02, PRENG-03]

# Metrics
duration: 25min
completed: 2026-03-11
---

# Phase 10 Plan 02: Print Engine Rewire Summary

**Dynamic @page CSS injection keyed to user's paper size setting, with DOM-isolated conditional slip rendering and a paper size badge in the toolbar.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-11T22:39:00Z
- **Completed:** 2026-03-11T23:04:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- PrintVisitPage loads printSettings alongside patient/clinic data on mount
- `injectPageStyle()` injects `<style id='print-page-style' media='print'>` with `@page { size: WIDTHmm HEIGHTmm portrait; margin: Xmm; }` synchronously before window.print()
- `removePageStyle()` cleans up on afterprint event
- Replaced div class-toggle (hidden/print-hidden) with conditional rendering -- only active slip exists in DOM during print
- Paper size badge shows active slip's configured label (e.g., "Paper: A5 (148 x 210 mm)")
- Hardcoded `@page { size: A5 portrait; margin: 8mm; }` removed from index.css
- 17 total tests passing (7 existing + 10 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dynamic print engine, conditional rendering, size badge, clean index.css** - `c248bcf` (feat)
2. **Task 2: Extend PrintVisitPage tests for PRENG-01 and PRENG-03** - `3764695` (test)

## Files Created/Modified
- `src/pages/PrintVisitPage.tsx` - Added injectPageStyle/removePageStyle, printSettings state, conditional rendering, size badge
- `src/index.css` - Removed hardcoded @page, added legacy comment on .print-hidden
- `src/__tests__/PrintVisitPage.test.tsx` - 10 new tests: PRENG-01 (@page injection), PRENG-03 (conditional rendering), size badge

## Decisions Made
- `style.media = 'print'` scopes the injected style to print media, avoids jsdom processing it for screen CSS computation
- Use `fireEvent.click` (not `userEvent.click`) when interacting with tab buttons after DispensarySlip mounts. jsdom crashes in `user-event`'s pointer-events check (`getComputedStyle`) when any `@page` rule exists in `document.head`, even with `media='print'`. This is a jsdom limitation, not a code defect.
- Global `afterEach` removes `print-page-style` to prevent CSS state leakage between tests that would cause cascading failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing "Dispensary print" test broke due to conditional rendering**
- **Found during:** Task 1 (PrintVisitPage rewire)
- **Issue:** The existing test `calls window.print when Dispensary tab selected and print clicked` used `user.click` with `getByRole`. When conditional rendering mounted DispensarySlip for the first time (previously it was always in DOM but hidden), jsdom's `getComputedStyle` crashed on `@page` CSS rules during `user-event`'s pointer-events check.
- **Fix:** Changed test to use `fireEvent.click` which skips the CSS pointer-events traversal. Added global `afterEach` to remove injected styles.
- **Files modified:** src/__tests__/PrintVisitPage.test.tsx
- **Verification:** All 7 original tests pass
- **Committed in:** c248bcf (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug introduced by conditional rendering change)
**Impact on plan:** Essential fix to keep existing tests green. The jsdom limitation is documented as a pattern for future tests.

## Issues Encountered
- `getByText('Print Prescription')` matches both breadcrumb text and print button text -- used `getAllByText` with index to disambiguate
- Pre-existing login.test.tsx failures (4 tests) confirmed unrelated to this plan

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Print engine complete: browser print dialog will use user's configured paper size
- DOM isolation: only the active slip exists during print (no phantom hidden slips)
- Phase 11 (print UI) can rely on dynamic @page injection and conditional rendering being in place
- Nastaliq line-height scaling across paper sizes still flagged as needing empirical testing in Phase 11

---
*Phase: 10-print-infrastructure-settings*
*Completed: 2026-03-11*

## Self-Check: PASSED

- src/pages/PrintVisitPage.tsx: FOUND
- src/index.css: FOUND
- src/__tests__/PrintVisitPage.test.tsx: FOUND
- .planning/phases/10-print-infrastructure-settings/10-02-SUMMARY.md: FOUND
- Commit c248bcf: FOUND
- Commit 3764695: FOUND
