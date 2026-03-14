---
phase: 12-focus-foundation-and-form-submission
plan: 01
subsystem: ui
tags: [css, tailwind, focus-visible, accessibility, keyboard-navigation]

# Dependency graph
requires: []
provides:
  - Global :focus-visible outline rule in src/index.css (blue-600, 2px, 2px offset)
  - :focus:not(:focus-visible) suppression rule (no ring on mouse click)
  - Zero legacy focus:ring-*/focus:outline-none classes in any component or page file
  - Class audit test that enforces no legacy focus classes going forward
affects: [phase-13-keyboard-interactions, phase-14-print-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global focus-visible via @layer base in index.css instead of per-component Tailwind utilities"
    - "CSS custom property var(--color-blue-600) for design-system-linked focus color"

key-files:
  created:
    - src/__tests__/focus-styles.test.tsx
  modified:
    - src/index.css
    - src/components/PatientInfoCard.tsx
    - src/components/PatientRegistrationForm.tsx
    - src/components/ClinicInfoSettings.tsx
    - src/components/SearchBar.tsx
    - src/components/ComboBox.tsx
    - src/components/PrintSettings.tsx
    - src/components/Header.tsx
    - src/components/RxNotesField.tsx
    - src/components/MedicationEntry.tsx
    - src/components/DrugManagement.tsx
    - src/pages/SettingsPage.tsx
    - src/pages/NewVisitPage.tsx
    - src/pages/EditVisitPage.tsx

key-decisions:
  - "Global CSS @layer base rule chosen over per-component classes for focus-visible (scalable, single point of change)"
  - "var(--color-blue-600) used for design-system-linked color, avoids hardcoded hex"
  - "Class audit test uses Node fs (static file analysis) not runtime DOM - jsdom cannot test :focus-visible pseudo-class"

patterns-established:
  - "Focus pattern: use :focus-visible CSS globally, never focus:ring-* Tailwind per-component"
  - "Test pattern: static file content audit for banned CSS class strings"

requirements-completed: [FOCUS-01, FOCUS-02]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 12 Plan 01: Global Focus-Visible Foundation Summary

**Global :focus-visible CSS rule in @layer base (blue-600, keyboard-only) with all 14 component/page files stripped of legacy focus:ring-* classes and a class audit test enforcing the migration going forward**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T13:03:48Z
- **Completed:** 2026-03-14T13:08:54Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Single global :focus-visible rule replaces ~30 per-component focus:ring-2/focus:ring-blue-500 class instances
- Focus ring now appears only on keyboard navigation (not mouse clicks) via :focus:not(:focus-visible) suppression
- Class audit test (5 tests) enforces the migration - will catch any future regressions

## Task Commits

1. **Test (RED): Class audit + CSS rule tests** - `93398b9` (test)
2. **Feat (GREEN): Global CSS rule + all legacy classes stripped** - `449b9a2` (feat)
3. **Fix: Node type reference + unused const in test** - `976aa72` (fix)

## Files Created/Modified

- `src/index.css` - Added @layer base with :focus-visible outline and :focus:not(:focus-visible) suppression
- `src/__tests__/focus-styles.test.tsx` - 5-test class audit verifying no legacy focus classes in components/pages
- 13 component/page files - Removed focus:outline-none, focus:ring-*, focus:border-* from all className strings

## Decisions Made

- Global CSS via @layer base (not per-component) - one rule covers all current and future focusable elements
- `var(--color-blue-600)` for the outline color - TailwindCSS v4 design token so the color auto-tracks theme changes
- Static file analysis for tests (not runtime DOM) - jsdom does not support :focus-visible pseudo-class at runtime

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript build errors in focus-styles test file**
- **Found during:** Task 2 (Build verification)
- **Issue:** Test file used Node built-ins (fs, path, __dirname) but tsconfig.app.json sets `types: ["vite/client"]` which excludes Node types; also had an unused constant flagged by noUnusedLocals
- **Fix:** Added `/// <reference types="node" />` at top of test file; removed unused LEGACY_PATTERNS array
- **Files modified:** src/__tests__/focus-styles.test.tsx
- **Verification:** npm run build passes with zero TypeScript errors
- **Committed in:** 976aa72

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test file)
**Impact on plan:** Required for build to pass. No scope creep.

## Issues Encountered

- PrintVisitPage.test.tsx has 4 pre-existing failures (DatabaseClosedError flakiness). Confirmed pre-existing by running on main before changes. No regressions introduced.

## Next Phase Readiness

- Focus foundation is complete. All focusable elements now get keyboard-only blue outline from the global rule.
- Phase 12 Plan 02 (tab order + Enter-to-submit) can proceed.
- No blockers.

---
*Phase: 12-focus-foundation-and-form-submission*
*Completed: 2026-03-14*
