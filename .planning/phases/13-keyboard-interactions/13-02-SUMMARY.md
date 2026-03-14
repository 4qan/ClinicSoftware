---
phase: 13-keyboard-interactions
plan: 02
subsystem: ui
tags: [react, keyboard-navigation, focus-management, combobox, medication-entry, tdd]

requires:
  - phase: 13-keyboard-interactions
    provides: useAutocompleteKeyboard hook and ComboBox inputRef prop

provides:
  - MedicationEntry with full keyboard navigation on drug search dropdown (arrows, Enter, Escape, Tab)
  - Focus transitions: DB drug -> Quantity, custom drug -> Form, after add -> drug input
  - data-testid="drug-dropdown" for test targeting

affects: [14-print-and-finish]

tech-stack:
  added: []
  patterns:
    - pendingFocus state flag + useEffect for deferred focus after state update
    - stopPropagation on drug Enter when dropdown is open to prevent wrapper double-fire
    - data-testid on dropdown for test accessibility without aria roles

key-files:
  created: []
  modified:
    - src/components/MedicationEntry.tsx
    - src/__tests__/MedicationEntry.test.tsx

key-decisions:
  - "Drug input stopPropagation on Enter when dropdown open and has results -- prevents wrapper handleWrapperKeyDown from double-firing add-medication on the same Enter press"
  - "hover:bg-gray-50 (not hover:bg-blue-50) for non-highlighted drug items -- matches ComboBox pattern and avoids false positives in bg-blue-50 test assertions"
  - "data-testid='drug-dropdown' added to dropdown container -- enables test targeting without requiring aria roles on a custom dropdown"
  - "pendingFocusAfterDrug state flag (not requestAnimationFrame) for focus transition after drug select -- consistent with Phase 13 established pattern"

patterns-established:
  - "pendingFocus flag pattern: set state flag after action, useEffect fires focus on ref, clears flag"
  - "Keyboard handler composition: hook handles nav keys, component handleKeyDown wraps it and manages propagation"

requirements-completed: [AUTO-05, FMGT-01, FMGT-02, FORM-04]

duration: 3min
completed: 2026-03-14
---

# Phase 13 Plan 02: MedicationEntry Keyboard Navigation Summary

**Drug search in MedicationEntry wired to useAutocompleteKeyboard hook with full arrow/Enter/Escape/Tab nav and focus transitions: DB drug -> Quantity, custom drug -> Form, after add -> drug input**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-14T18:56:29Z
- **Completed:** 2026-03-14T18:58:55Z
- **Tasks:** 1 (TDD: test commit + impl commit)
- **Files modified:** 2

## Accomplishments

- Drug search dropdown navigable with ArrowDown/Up, Enter, Escape, Tab (same as ComboBox)
- After selecting a DB drug (has drugId), focus transitions to Quantity ComboBox input
- After custom drug entry (no drugId), focus transitions to Form ComboBox input
- After adding medication (Enter or Add button), focus returns to drug search input
- Enter-to-add (FORM-04) preserved -- wrapper keyDown fires only when drug dropdown is closed
- Drug dropdown visual output unchanged (Searching, No drugs found, formatDrugSearchResult)
- 10 new component interaction tests, all passing (15 total in file)

## Task Commits

1. **Task 1 (RED): Failing tests for keyboard nav and focus transitions** - `bb56c55` (test)
2. **Task 1 (GREEN): MedicationEntry keyboard nav implementation** - `a19a68d` (feat)

## Files Created/Modified

- `src/components/MedicationEntry.tsx` - Added useAutocompleteKeyboard, drugInputRef/quantityInputRef/formInputRef, pendingFocus state flags, highlight classes, stopPropagation logic
- `src/__tests__/MedicationEntry.test.tsx` - Added 10 keyboard/focus interaction tests; mock useDrugSearch; kept pre-existing formatter unit tests

## Decisions Made

- **stopPropagation on Enter when dropdown open:** The wrapper's `onKeyDown={handleWrapperKeyDown}` fires for Enter on every field. When the drug dropdown is open and handles Enter for selection, we call `e.stopPropagation()` to prevent the wrapper from also triggering add-medication on that same press.
- **hover:bg-gray-50 for non-highlighted items:** Matches ComboBox behavior. Using `hover:bg-blue-50` would cause `not.toContain('bg-blue-50')` test assertions to fail since the substring appears in the full Tailwind class string.
- **data-testid="drug-dropdown":** Easiest selector for the dropdown container in tests; the custom drug dropdown doesn't have a natural aria role.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

- Test assertion `not.toContain('bg-blue-50')` was failing because non-highlighted buttons had `hover:bg-blue-50` in their class string. Fixed by switching to `hover:bg-gray-50` on non-highlighted items (aligns with ComboBox pattern anyway).

## Next Phase Readiness

- Phase 13 is complete: focus-visible foundation (12-01), tab order (12-02), ComboBox keyboard nav (13-01), MedicationEntry keyboard nav (13-02)
- Ready for Phase 14 (print and finish)
- All keyboard interaction requirements fulfilled: AUTO-05, FMGT-01, FMGT-02, FORM-04

---
*Phase: 13-keyboard-interactions*
*Completed: 2026-03-14*
