---
phase: 13-keyboard-interactions
plan: 01
subsystem: ui
tags: [react, typescript, hooks, keyboard-navigation, accessibility, testing, vitest]

requires:
  - phase: 12-focus-foundation-and-form-submission
    provides: Focus management foundation and focus-visible styles

provides:
  - useAutocompleteKeyboard hook with full keyboard handling (arrows, Enter, Escape, Tab)
  - ComboBox with Enter-selects-first, Tab-to-confirm, Escape-no-blur, optional inputRef prop
  - SearchBar with Escape-keeps-query, Enter-selects-first, Tab-to-confirm behaviors
  - 21 keyboard behavior tests covering all autocomplete interactions

affects: [14-drug-combobox, 15-patient-search, any future autocomplete components]

tech-stack:
  added: []
  patterns:
    - "useAutocompleteKeyboard<T> generic hook: items/isOpen/onSelect/onClose/onOpen interface"
    - "Ref-based item comparison (JSON.stringify) to avoid new-array-reference effect trigger"
    - "Enter-selects-first: Enter with highlightIndex=-1 selects items[0]"
    - "Escape owns only close -- no blur, no clear; caller keeps focus/query management"
    - "Tab-to-confirm: call onSelect but no preventDefault so browser advances focus"

key-files:
  created:
    - src/hooks/useAutocompleteKeyboard.ts
    - src/__tests__/SearchBar.keyboard.test.tsx
  modified:
    - src/components/ComboBox.tsx
    - src/components/SearchBar.tsx
    - src/__tests__/ComboBox.test.tsx
    - src/__tests__/setup.ts

key-decisions:
  - "useAutocompleteKeyboard uses ref-based JSON.stringify comparison for items change detection, not [items] as useEffect dep (new array refs would reset highlight on every render)"
  - "Escape in the hook only calls onClose -- no blur, no query clear. Callers that want to clear state can do so in their onClose handler"
  - "ComboBox gains optional inputRef prop (React.RefObject<HTMLInputElement | null>) -- caller passes ref, falls back to internal ref if not provided"
  - "scrollIntoView mocked globally in test setup (jsdom limitation, not a real behavior change)"

patterns-established:
  - "Keyboard hook pattern: useAutocompleteKeyboard<T>({ items, isOpen, onSelect, onClose, onOpen? }) -> { highlightIndex, setHighlightIndex, handleKeyDown }"
  - "All future autocomplete components (DrugComboBox, inline patient search) must use this hook"

requirements-completed: [AUTO-01, AUTO-02, AUTO-03, AUTO-04, ESC-01]

duration: 4min
completed: 2026-03-14
---

# Phase 13 Plan 01: Autocomplete Keyboard Foundation Summary

**Shared useAutocompleteKeyboard<T> hook with Enter-selects-first, Tab-to-confirm, and Escape-no-blur, integrated into ComboBox and SearchBar**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T18:49:58Z
- **Completed:** 2026-03-14T18:54:26Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `useAutocompleteKeyboard<T>` generic hook -- single implementation of all keyboard navigation for all autocomplete components
- Fixed ComboBox: Escape no longer blurs, Enter-selects-first when no item highlighted, Tab-to-confirm without preventing default, gains optional `inputRef` prop
- Fixed SearchBar: Escape no longer clears query or blurs, Enter-selects-first, Tab-to-confirm
- 9 new ComboBox keyboard tests + 6 new SearchBar keyboard tests, all passing (21 total in scope)

## Task Commits

1. **Task 1: Create useAutocompleteKeyboard hook and refactor ComboBox** - `d812607` (feat)
2. **Task 2: Fix SearchBar keyboard behavior using shared hook** - `854b570` (feat)

## Files Created/Modified

- `src/hooks/useAutocompleteKeyboard.ts` - Generic hook, exports `useAutocompleteKeyboard<T>`
- `src/components/ComboBox.tsx` - Refactored to use hook, adds optional `inputRef` prop
- `src/components/SearchBar.tsx` - Refactored to use hook, removes inline handleKeyDown
- `src/__tests__/ComboBox.test.tsx` - 9 new keyboard behavior tests appended
- `src/__tests__/SearchBar.keyboard.test.tsx` - 6 new SearchBar keyboard tests (new file)
- `src/__tests__/setup.ts` - Added `scrollIntoView` mock (jsdom limitation)

## Decisions Made

- **Ref-based items comparison:** `useEffect(() => { ... })` (no deps) with JSON.stringify comparison instead of `useEffect(..., [items])` -- the latter would fire on every render since `filtered` is a new array reference each time ComboBox renders
- **Escape semantics:** Hook calls only `onClose()`, nothing else. No blur, no state clear. SearchBar's `onClose` just hides dropdown; ComboBox's `close` just sets `isOpen(false)`. Callers that want to clear additional state handle it in their own `onClose`
- **Tab behavior:** No `preventDefault` call for Tab -- browser advances focus naturally. Selection is confirmed as a side effect

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added scrollIntoView mock to test setup**
- **Found during:** Task 1 (ComboBox keyboard tests)
- **Issue:** jsdom does not implement `scrollIntoView`; existing ComboBox scroll-to-highlighted logic would throw in tests
- **Fix:** Added `window.HTMLElement.prototype.scrollIntoView = function () {}` to `setup.ts`
- **Files modified:** `src/__tests__/setup.ts`
- **Committed in:** d812607 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing test infrastructure)
**Impact on plan:** Necessary for test correctness. No scope creep.

## Issues Encountered

- `useEffect(() => { setHighlightIndex(-1) }, [items])` would fire on every render due to `filtered` being a new array reference each render -- solved with ref-based JSON.stringify comparison in an effect with no deps array
- `input.focus()` does not trigger React's synthetic `onFocus` in jsdom -- tests updated to use `userEvent.click()` instead
- `KeyboardEvent.preventDefault` is read-only in jsdom -- Tab spy test reworked to use `e.defaultPrevented` via deferred Promise check

## Next Phase Readiness

- `useAutocompleteKeyboard` hook is ready for DrugComboBox and inline patient search (Phase 13 Plans 02+)
- Both ComboBox and SearchBar pass all tests with zero visual changes
- Pre-existing concern: DrugComboBox API design decision still needed before Plan 02 build

---
*Phase: 13-keyboard-interactions*
*Completed: 2026-03-14*
