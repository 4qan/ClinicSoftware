# Phase 13: Keyboard Interactions - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

All autocomplete dropdowns are fully keyboard-operable, DrugComboBox is consolidated into a single component, every post-action focus transition works correctly, and Escape dismisses every dismissible element without losing focus. ESC-03 (modals/overlays) is skipped because no modals exist in the codebase.

</domain>

<decisions>
## Implementation Decisions

### Autocomplete keyboard behavior
- Escape closes dropdown but keeps focus on input (does NOT blur). Consistent across all autocompletes: ComboBox, drug search, SearchBar, NewVisitPage patient search
- Single Escape only closes dropdown. No double-Escape-to-blur pattern
- Tab with highlighted suggestion confirms the selection AND advances to next field (one keystroke)
- Enter with no highlight selects the first suggestion in the filtered list. If no results, Enter does nothing
- Arrow keys navigate suggestions (already works in ComboBox and SearchBar, needs adding to drug search and NewVisitPage patient search)
- NewVisitPage patient search dropdown gets same keyboard behavior as all other autocompletes (arrows, Enter, Tab, Escape)

### DrugComboBox consolidation
- Claude's discretion on approach (generic ComboBox<T> with render props/generics vs DrugComboBox wrapper vs shared hook)
- Critical constraint: NO visual changes to any existing dropdown. Current appearance, loading states ("Searching..."), empty states ("No drugs found. You can type a custom name."), and interaction feel must remain identical
- Only addition is keyboard navigation on top of existing experience
- Highlight style for arrow-navigated drug results: bg-blue-50 (matches existing ComboBox highlight)

### Focus transitions after actions
- After drug select from autocomplete: focus moves to Quantity field (skip read-only Form field for DB drugs). For custom drugs where Form is editable, focus goes to Form first
- After adding medication row (Add button or Enter): focus returns to drug search input for next medication
- After inline patient create: focus moves to clinical notes textarea
- Focus timing: useEffect with pendingFocus flag pattern (not requestAnimationFrame). Set flag on action, useEffect watches for state change and focuses target. React-idiomatic, reliable with React 19 + StrictMode

### Escape dismiss behavior
- Escape on inline patient registration form (NewVisitPage): dismisses form, returns focus to patient search input
- ESC-03 (modals/overlays): SKIPPED. No modals exist in codebase. Build Escape-to-close when a modal is actually added

### Enter to add medication (FORM-04)
- Enter adds medication row when all required fields are filled (already partially implemented in MedicationEntry handleKeyDown, needs verification with consolidation)

### Claude's Discretion
- ComboBox consolidation architecture (generic vs wrapper vs shared hook)
- Exact implementation of useEffect + pendingFocus pattern
- ARIA attributes for keyboard-navigable dropdowns (role, aria-activedescendant, etc.)
- Whether to extract shared keyboard logic into a custom hook

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ComboBox.tsx`: Already has arrow key nav, Enter-to-select, Escape (needs: remove blur on Escape, add Tab-to-confirm, Enter-selects-first-when-no-highlight)
- `SearchBar.tsx`: Has arrow nav + Enter-to-select + Escape (needs: same fixes as ComboBox, consistent behavior)
- `useDrugSearch.ts`: Hook for drug search queries, returns `{ results, isSearching }`
- `usePatientSearch.ts`: Hook for patient search queries
- `drugFormatters.ts`: `formatDrugSearchResult` and `formatDrugSelected` for display

### Established Patterns
- Click-outside-to-close via document mousedown listener (ComboBox, SearchBar, MedicationEntry all use this)
- `onMouseDown` with `preventDefault()` on dropdown items to prevent blur before selection
- Highlight index state (`highlightIndex` / `highlightedIndex`) with scroll-into-view effect
- MedicationEntry wraps all fields in a div with `onKeyDown` for Enter-to-add

### Integration Points
- `MedicationEntry.tsx` lines 101-138: Drug dropdown needs full replacement with consolidated keyboard-enabled component
- `NewVisitPage.tsx` lines 232-260: Patient search dropdown needs keyboard nav added (arrows, Enter, Escape)
- `NewVisitPage.tsx` lines 210-230: Inline PatientRegistrationForm needs Escape handler
- `ComboBox.tsx` line 62-63: Remove `inputRef.current?.blur()` from Escape handler
- `SearchBar.tsx` line 49-52: Remove blur + clear from Escape handler (keep focus, just close dropdown)

</code_context>

<specifics>
## Specific Ideas

- "Current experience (without tabbing etc) is perfect as-is" -- consolidation must be invisible to mouse users. Zero visual changes.
- Doctor is non-tech-savvy on older Windows hardware. Keyboard additions must enhance, not complicate the existing mouse workflow.
- Drug search → Quantity → Frequency → Duration → Add → Drug search loop should be completable entirely by keyboard with minimal keystrokes.

</specifics>

<deferred>
## Deferred Ideas

None. Discussion stayed within phase scope.

</deferred>

---

*Phase: 13-keyboard-interactions*
*Context gathered: 2026-03-14*
