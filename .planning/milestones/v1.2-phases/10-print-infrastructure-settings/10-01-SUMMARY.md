---
phase: 10-print-infrastructure-settings
plan: 01
subsystem: ui, database
tags: [dexie, indexeddb, react, tailwind, vitest, print, settings]

# Dependency graph
requires: []
provides:
  - PaperSize type, PaperDimensions, PrintSettings interfaces in src/db/printSettings.ts
  - PAPER_SIZES constant with dimensions/labels for A6/A5/A4/Letter
  - PAPER_SIZE_ORDER ordered array
  - getPrintSettings() with A5 fallback defaults
  - savePrintSetting() for individual key persistence
  - calcMargin() proportional margin calculator (4mm A6, 8mm A5, 10mm A4/Letter)
  - PrintSettings component with auto-save dropdowns for prescription + dispensary slips
  - Print pill tab wired into SettingsPage as 5th tab
affects:
  - 10-02 (print engine will consume calcMargin, getPrintSettings, PAPER_SIZES)
  - 11-print-ui (any future print UI uses these shared types and DB functions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auto-save on change pattern: call DB function + setState in same onChange handler, no submit button"
    - "Parallel DB reads with Promise.all for getPrintSettings"
    - "PaperSize string union type with PAPER_SIZE_ORDER for consistent dropdown ordering"

key-files:
  created:
    - src/db/printSettings.ts
    - src/components/PrintSettings.tsx
    - src/__tests__/printSettings.db.test.ts
    - src/__tests__/PrintSettings.test.tsx
  modified:
    - src/pages/SettingsPage.tsx

key-decisions:
  - "calcMargin uses proportional area ratio vs A5 baseline (8mm), clamped to [4, 10]mm"
  - "Auto-save on dropdown change, no Save button, per plan spec"
  - "A5 is the default for both slips when no DB key exists"

patterns-established:
  - "Print DB functions follow same key-value pattern as src/db/settings.ts"
  - "Settings components mock @/db/printSettings at module level in tests to avoid real IndexedDB"

requirements-completed: [PRSET-01, PRSET-02, PRSET-03, PRSET-04, PRENG-02]

# Metrics
duration: 12min
completed: 2026-03-11
---

# Phase 10 Plan 01: Print Settings Infrastructure Summary

**Print settings data layer (types, constants, DB functions, margin calc) and Settings UI tab with two auto-save paper size dropdowns for prescription and dispensary slips.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-11T22:34:00Z
- **Completed:** 2026-03-11T22:38:00Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- Print settings data layer with PaperSize type, PAPER_SIZES constants, getPrintSettings(), savePrintSetting(), and calcMargin() - all tested
- PrintSettings component with two independent auto-save dropdowns (no Save button)
- Print tab added as 5th pill tab in SettingsPage, conditionally rendering PrintSettings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create print settings data layer with tests** - `4f574fa` (feat)
2. **Task 2: Create PrintSettings component and wire into SettingsPage** - `8932bfc` (feat)

**Plan metadata:** (docs commit follows)

_Note: Both tasks used TDD (RED test first, then GREEN implementation)_

## Files Created/Modified
- `src/db/printSettings.ts` - PaperSize type, PAPER_SIZES, PAPER_SIZE_ORDER, getPrintSettings(), savePrintSetting(), calcMargin()
- `src/components/PrintSettings.tsx` - Settings UI with two dropdown cards, auto-save on change
- `src/pages/SettingsPage.tsx` - Added 'print' to SettingsCategory, Print tab in TABS, conditional render
- `src/__tests__/printSettings.db.test.ts` - 13 tests for data layer (defaults, persistence, calcMargin, constants)
- `src/__tests__/PrintSettings.test.tsx` - 13 tests for UI (tab render, dropdowns, defaults, auto-save)

## Decisions Made
- calcMargin uses proportional area ratio vs A5 baseline (8mm), clamped to [4, 10]mm. This ensures A6 gets 4mm (minimum readable), A5 gets 8mm (baseline), A4/Letter get 10mm (maximum).
- Auto-save on change with no Save button, per plan spec - matches the UX requirement that settings apply immediately.
- A5 default for both slips when no DB key exists - reasonable middle-ground paper size.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing `login.test.tsx` failures (4 tests) confirmed unrelated to this plan by verifying they fail without our changes. Pre-existing `PrintVisitPage.test.tsx` DatabaseClosedError (post-test teardown) also confirmed pre-existing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data layer exports ready: `getPrintSettings`, `savePrintSetting`, `calcMargin`, `PaperSize`, `PAPER_SIZES`, `PAPER_SIZE_ORDER` all available for Phase 10 Plan 02 (print engine)
- calcMargin() tested for all four paper sizes, ready to drive @page CSS margin generation

---
*Phase: 10-print-infrastructure-settings*
*Completed: 2026-03-11*

## Self-Check: PASSED

- src/db/printSettings.ts: FOUND
- src/components/PrintSettings.tsx: FOUND
- src/__tests__/printSettings.db.test.ts: FOUND
- src/__tests__/PrintSettings.test.tsx: FOUND
- Commit 4f574fa: FOUND
- Commit 8932bfc: FOUND
