# Phase 13: Keyboard Interactions - Research

**Researched:** 2026-03-14
**Domain:** React keyboard event handling, focus management, component consolidation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Autocomplete keyboard behavior**
- Escape closes dropdown but keeps focus on input (does NOT blur). Consistent across all autocompletes: ComboBox, drug search, SearchBar, NewVisitPage patient search
- Single Escape only closes dropdown. No double-Escape-to-blur pattern
- Tab with highlighted suggestion confirms the selection AND advances to next field (one keystroke)
- Enter with no highlight selects the first suggestion in the filtered list. If no results, Enter does nothing
- Arrow keys navigate suggestions (already works in ComboBox and SearchBar, needs adding to drug search and NewVisitPage patient search)
- NewVisitPage patient search dropdown gets same keyboard behavior as all other autocompletes (arrows, Enter, Tab, Escape)

**DrugComboBox consolidation**
- Claude's discretion on approach (generic ComboBox<T> with render props/generics vs DrugComboBox wrapper vs shared hook)
- Critical constraint: NO visual changes to any existing dropdown. Current appearance, loading states ("Searching..."), empty states ("No drugs found. You can type a custom name."), and interaction feel must remain identical
- Only addition is keyboard navigation on top of existing experience
- Highlight style for arrow-navigated drug results: bg-blue-50 (matches existing ComboBox highlight)

**Focus transitions after actions**
- After drug select from autocomplete: focus moves to Quantity field (skip read-only Form field for DB drugs). For custom drugs where Form is editable, focus goes to Form first
- After adding medication row (Add button or Enter): focus returns to drug search input for next medication
- After inline patient create: focus moves to clinical notes textarea
- Focus timing: useEffect with pendingFocus flag pattern (not requestAnimationFrame). Set flag on action, useEffect watches for state change and focuses target. React-idiomatic, reliable with React 19 + StrictMode

**Escape dismiss behavior**
- Escape on inline patient registration form (NewVisitPage): dismisses form, returns focus to patient search input
- ESC-03 (modals/overlays): SKIPPED. No modals exist in codebase. Build Escape-to-close when a modal is actually added

**Enter to add medication (FORM-04)**
- Enter adds medication row when all required fields are filled (already partially implemented in MedicationEntry handleKeyDown, needs verification with consolidation)

### Claude's Discretion
- ComboBox consolidation architecture (generic vs wrapper vs shared hook)
- Exact implementation of useEffect + pendingFocus pattern
- ARIA attributes for keyboard-navigable dropdowns (role, aria-activedescendant, etc.)
- Whether to extract shared keyboard logic into a custom hook

### Deferred Ideas (OUT OF SCOPE)

None. Discussion stayed within phase scope. ESC-03 skipped (no modals exist).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTO-01 | Up/Down arrow navigation in autocomplete suggestions | ComboBox already implements this. Drug search and NewVisitPage patient search need the same highlightIndex state + arrow key handlers added |
| AUTO-02 | Select highlighted suggestion with Enter | ComboBox implements this for highlighted items. Need: Enter selects first item when no highlight. Drug search and patient search need this added |
| AUTO-03 | Escape dismisses dropdown without blurring input | ComboBox line 62-63 and SearchBar lines 49-52 both blur on Escape today. Both need the blur call removed |
| AUTO-04 | Tab confirms highlighted suggestion and advances to next field | Tab key is not currently intercepted in any autocomplete. Requires onKeyDown handling for Tab when dropdown is open and a suggestion is highlighted |
| AUTO-05 | Drug search uses the same ComboBox component as other autocompletes | MedicationEntry.tsx lines 101-138 has a bespoke dropdown. Must be replaced with consolidated keyboard-enabled component |
| ESC-01 | Escape closes open autocomplete dropdowns | Covered by AUTO-03 fix - same code change |
| FMGT-01 | After drug select, focus moves to Quantity field | Need a `useRef` on the Quantity ComboBox input and a pendingFocus flag triggered from handleSelectDrug. For DB drug: skip read-only Form div, go directly to Quantity input. For custom drug: focus Form ComboBox input first |
| FMGT-02 | After adding medication row, focus returns to drug search input | Need a `useRef` on drug search input. Set pendingFocus flag in handleAdd, useEffect focuses drug input after medications state updates |
| FMGT-03 | After inline patient create, focus moves to clinical notes textarea | Need a `useRef` on the clinical notes textarea in NewVisitPage. Set pendingFocus flag in handleInlineRegister, useEffect focuses textarea after selectedPatient state updates |
| FORM-04 | Enter adds medication when required fields are filled | MedicationEntry already has handleKeyDown with Enter-to-add on the wrapper div. Must survive consolidation and be verified to still work correctly |
| ESC-02 | Escape dismisses inline patient creation form, returns focus to patient search | NewVisitPage lines 210-230: PatientRegistrationForm needs an Escape keydown handler on its wrapper. On dismiss (setShowInlineRegistration(false)), set a pendingFocus flag and useEffect focuses the patient search input |
| ESC-03 | Escape closes modals and overlays | SKIPPED - no modals exist in codebase |
</phase_requirements>

---

## Summary

Phase 13 is a targeted keyboard wiring phase. The component architecture is already well-understood from reading the source: ComboBox has arrow navigation but has two bugs (blur on Escape, no Tab-to-confirm, no Enter-selects-first). SearchBar has the same bugs. MedicationEntry has a completely bespoke drug dropdown with no keyboard navigation at all.

The core work has three independent tracks: (1) fix existing autocomplete bugs in ComboBox and SearchBar, (2) consolidate the drug dropdown in MedicationEntry into something that shares the same keyboard behavior, and (3) wire focus transitions after the three key user actions (drug select, add medication, inline patient create). All tracks are low-risk because the visual output must be byte-for-byte identical to today.

The chosen focus timing pattern (useEffect + pendingFocus flag) is the right call for React 19 + StrictMode. requestAnimationFrame runs before React has committed DOM updates in StrictMode double-invocations; a useEffect that watches a state flag fires after the commit, making it reliable.

**Primary recommendation:** Fix ComboBox and SearchBar keyboard bugs first (smallest diffs, highest confidence), then consolidate drug search using a shared hook approach, then wire the three focus transitions.

---

## Standard Stack

### Core (already in use, no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component model, useRef, useEffect, useCallback | Already in use |
| @testing-library/user-event | (in use) | Keyboard interaction testing | Already used in tab-order.test.tsx |
| @testing-library/react | (in use) | Component rendering in tests | Already used across test suite |
| vitest | (in use) | Test runner | Configured in vitest.config.ts |

No new packages needed. All keyboard behavior is native React event handling.

---

## Architecture Patterns

### Pattern 1: pendingFocus flag

**What:** A boolean state flag that signals "focus this ref after the next render."
**When to use:** Any post-action focus transition where the target element may not exist yet (e.g., it appears after state change) or where you need focus to happen after React has committed.

```typescript
// Source: Decided in CONTEXT.md, React 19 idiomatic pattern
const [focusQuantity, setFocusQuantity] = useState(false)
const quantityRef = useRef<HTMLInputElement>(null)

function handleSelectDrug(drug: Drug) {
  // ... set form state
  setShowDrugDropdown(false)
  setFocusQuantity(true)   // set flag
}

useEffect(() => {
  if (focusQuantity) {
    quantityRef.current?.focus()
    setFocusQuantity(false)
  }
}, [focusQuantity])
```

**Why not requestAnimationFrame:** In React 19 StrictMode, effects double-fire but rAF does not compensate for the React commit lifecycle. useEffect fires after commit, guaranteed.

### Pattern 2: Tab-to-confirm in autocomplete

**What:** Intercept Tab on keydown, select highlighted item, let browser advance focus naturally.
**Critical:** Do NOT call `e.preventDefault()` for Tab. The browser should handle focus advancement. Only call `e.stopPropagation()` if needed to prevent parent keydown handlers from firing.

```typescript
// In handleKeyDown inside ComboBox/any autocomplete input
if (e.key === 'Tab' && isOpen && highlightIndex >= 0 && highlightIndex < filtered.length) {
  // Do NOT preventDefault - let tab advance focus
  onChange(filtered[highlightIndex])
  close()
  // No return needed - browser handles Tab focus movement
}
```

**Why not preventDefault:** Preventing default on Tab breaks focus advancement entirely, defeating the purpose.

### Pattern 3: Enter-selects-first when no highlight

```typescript
} else if (e.key === 'Enter') {
  e.preventDefault()
  if (highlightIndex >= 0 && highlightIndex < filtered.length) {
    onChange(filtered[highlightIndex])
    close()
  } else if (filtered.length > 0) {
    // NEW: select first item when no highlight
    onChange(filtered[0])
    close()
  }
  // If no results: do nothing
}
```

### Pattern 4: Shared useAutocompleteKeyboard hook (for consolidation)

The drug search in MedicationEntry needs the same keyboard behavior as ComboBox. Rather than copy-pasting handleKeyDown, extract a hook:

```typescript
// src/hooks/useAutocompleteKeyboard.ts
function useAutocompleteKeyboard<T>({
  items,
  isOpen,
  onSelect,
  onClose,
  onOpen,
}: UseAutocompleteKeyboardOptions<T>) {
  const [highlightIndex, setHighlightIndex] = useState(-1)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
      // No blur
      return
    }
    if (e.key === 'ArrowDown') { ... }
    if (e.key === 'ArrowUp') { ... }
    if (e.key === 'Enter') { ... }
    if (e.key === 'Tab' && isOpen && highlightIndex >= 0) { ... }
  }

  return { highlightIndex, setHighlightIndex, handleKeyDown }
}
```

This hook can be used in both MedicationEntry's drug input and extracted to replace ComboBox's inline handleKeyDown. Keeps all keyboard logic in one place.

### Recommended File Changes

```
src/
├── hooks/
│   └── useAutocompleteKeyboard.ts   # NEW: shared keyboard logic
├── components/
│   ├── ComboBox.tsx                 # FIX: remove blur on Escape, add Tab-to-confirm, Enter-selects-first
│   ├── SearchBar.tsx                # FIX: remove blur+clear on Escape (keep query, just close dropdown)
│   └── MedicationEntry.tsx         # MODIFY: replace bespoke dropdown with keyboard-enabled version
└── pages/
    └── NewVisitPage.tsx             # MODIFY: add keyboard nav to patient search, Escape on inline form, focus transitions
```

### Anti-Patterns to Avoid

- **Calling `inputRef.current?.blur()` on Escape:** Explicitly removes focus from the input. Remove these calls entirely.
- **Using `requestAnimationFrame` for post-action focus:** Unreliable in React 19 StrictMode. Use useEffect + flag.
- **Calling `e.preventDefault()` on Tab key:** Prevents browser from advancing focus. Tab handling must let the default proceed.
- **Clearing the query on Escape in SearchBar:** CONTEXT.md decision is Escape only closes dropdown. The `setQuery('')` in SearchBar's Escape handler must be removed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll highlighted item into view | Custom scroll math | `element.scrollIntoView({ block: 'nearest' })` | Already used in ComboBox, handles all edge cases |
| Click-outside detection | Reinvent listener | Existing `document mousedown` pattern already in ComboBox, SearchBar, MedicationEntry | Copy the established pattern |
| Focus trapping inside dropdown | Build custom trap | Not needed - dropdowns do not trap focus | Trapping would break Tab-to-advance |

---

## Common Pitfalls

### Pitfall 1: Escape blurs the input
**What goes wrong:** User presses Escape to close dropdown, focus disappears from input entirely, cannot continue typing.
**Why it happens:** `inputRef.current?.blur()` is explicitly called in both ComboBox (line 62-63) and SearchBar (line 52).
**How to avoid:** Remove all blur calls from Escape handlers. `close()` (which sets `isOpen = false`) is sufficient.

### Pitfall 2: Tab preventDefault breaks tab navigation
**What goes wrong:** Tab key selects the suggestion but focus does not advance to next field.
**Why it happens:** `e.preventDefault()` suppresses the browser's default Tab behavior.
**How to avoid:** Never `preventDefault()` on Tab. Just call `onChange(selectedItem)` and `close()`, then let the event continue.

### Pitfall 3: pendingFocus flag not reset
**What goes wrong:** Every render after the first, the useEffect re-fires and calls focus() again and again (or causes a focus war).
**Why it happens:** Flag state is never set back to false after focus is performed.
**How to avoid:** Always reset the flag in the same useEffect: `setFocusQuantity(false)` after `ref.current?.focus()`.

### Pitfall 4: Focusing into a disabled fieldset
**What goes wrong:** After inline patient create, the clinical notes textarea is inside a `<fieldset disabled={isDisabled}>`. If `selectedPatient` state and `focusNotes` flag both update in the same React commit, the fieldset may still be disabled when the useEffect fires.
**Why it happens:** Both state updates need to propagate before the fieldset's `disabled` attribute is removed.
**How to avoid:** The pendingFocus flag approach handles this correctly because the useEffect fires after the commit that includes both state updates (selectedPatient and the pending flag trigger the same re-render). Verify with a test that the textarea is actually focusable after inline register.

### Pitfall 5: SearchBar clears query on Escape
**What goes wrong:** User presses Escape to dismiss dropdown, the query they typed disappears, they have to retype.
**Why it happens:** SearchBar line 49 calls `setQuery('')` in the Escape handler.
**How to avoid:** Remove `setQuery('')` from Escape handler. Keep `setShowDropdown(false)` and `setHighlightedIndex(-1)`, do not clear the query.

### Pitfall 6: Drug dropdown consolidation changes visual output
**What goes wrong:** Mouse users see different loading/empty states or different highlight styles.
**Why it happens:** New component uses different class names or different conditional rendering logic.
**How to avoid:** The drug dropdown's loading state ("Searching..."), empty state ("No drugs found. You can type a custom name."), and item renderer (formatDrugSearchResult) must be preserved exactly. Only the highlight class (bg-blue-50 on hover was already there) and keyboard state management are new.

---

## Code Examples

### Fix: Escape without blur (ComboBox)
```typescript
// Before (ComboBox.tsx line 60-64)
if (e.key === 'Escape') {
  close()
  inputRef.current?.blur()  // REMOVE THIS LINE
  return
}

// After
if (e.key === 'Escape') {
  close()
  return
}
```

### Fix: Escape without blur or clear (SearchBar)
```typescript
// Before (SearchBar.tsx line 48-52)
if (e.key === 'Escape') {
  setQuery('')               // REMOVE: don't clear query
  setShowDropdown(false)
  setHighlightedIndex(-1)
  inputRef.current?.blur()   // REMOVE: don't blur
}

// After
if (e.key === 'Escape') {
  setShowDropdown(false)
  setHighlightedIndex(-1)
}
```

### Fix: Enter selects first when no highlight (ComboBox)
```typescript
} else if (e.key === 'Enter') {
  e.preventDefault()
  if (highlightIndex >= 0 && highlightIndex < filtered.length) {
    onChange(filtered[highlightIndex])
    close()
  } else if (filtered.length > 0) {
    onChange(filtered[0])
    close()
  }
  // No results: do nothing
}
```

### Fix: Tab-to-confirm (ComboBox)
```typescript
// Add to handleKeyDown, before the isOpen check
if (e.key === 'Tab' && isOpen && highlightIndex >= 0 && highlightIndex < filtered.length) {
  // No preventDefault - let Tab advance focus naturally
  onChange(filtered[highlightIndex])
  close()
  return
}
```

### Focus transition: drug select -> Quantity field
```typescript
// In MedicationEntry
const quantityInputRef = useRef<HTMLInputElement>(null)
const formInputRef = useRef<HTMLInputElement>(null)
const [pendingFocusAfterDrugSelect, setPendingFocusAfterDrugSelect] = useState<'quantity' | 'form' | null>(null)

function handleSelectDrug(drug: Drug) {
  // ... existing state updates
  setShowDrugDropdown(false)
  // DB drug: form is read-only, skip to quantity
  // Custom drug: form is editable, focus form first
  setPendingFocusAfterDrugSelect(drug.id ? 'quantity' : 'form')
}

useEffect(() => {
  if (pendingFocusAfterDrugSelect === 'quantity') {
    quantityInputRef.current?.focus()
    setPendingFocusAfterDrugSelect(null)
  } else if (pendingFocusAfterDrugSelect === 'form') {
    formInputRef.current?.focus()
    setPendingFocusAfterDrugSelect(null)
  }
}, [pendingFocusAfterDrugSelect])
```

Note: the Quantity and Form ComboBox components need to expose their internal input ref. Options: (a) add a prop `inputRef?: React.RefObject<HTMLInputElement>` to ComboBox, or (b) use `useImperativeHandle` / `forwardRef`. A simple prop is cleaner.

### Focus transition: add medication -> drug search input
```typescript
// In MedicationEntry
const drugInputRef = useRef<HTMLInputElement>(null)
const [pendingFocusDrugInput, setPendingFocusDrugInput] = useState(false)

function handleAdd() {
  if (!isValid) return
  onAdd(form)
  setForm(emptyForm)
  setDrugQuery('')
  setPendingFocusDrugInput(true)
}

useEffect(() => {
  if (pendingFocusDrugInput) {
    drugInputRef.current?.focus()
    setPendingFocusDrugInput(false)
  }
}, [pendingFocusDrugInput])
```

### Focus transition: inline patient create -> clinical notes
```typescript
// In NewVisitPage
const clinicalNotesRef = useRef<HTMLTextAreaElement>(null)
const patientSearchRef = useRef<HTMLInputElement>(null)
const [pendingFocusAfterAction, setPendingFocusAfterAction] = useState<'clinicalNotes' | 'patientSearch' | null>(null)

async function handleInlineRegister(data: PatientInput) {
  const patient = await registerPatient(data)
  setSelectedPatient(patient)
  setShowInlineRegistration(false)
  setPatientQuery('')
  setPendingFocusAfterAction('clinicalNotes')
}

// For ESC-02: Escape on inline form
function handleDismissInlineForm() {
  setShowInlineRegistration(false)
  setPendingFocusAfterAction('patientSearch')
}

useEffect(() => {
  if (pendingFocusAfterAction === 'clinicalNotes') {
    clinicalNotesRef.current?.focus()
    setPendingFocusAfterAction(null)
  } else if (pendingFocusAfterAction === 'patientSearch') {
    patientSearchRef.current?.focus()
    setPendingFocusAfterAction(null)
  }
}, [pendingFocusAfterAction])
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react + @testing-library/user-event |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/__tests__/ComboBox.test.tsx src/__tests__/MedicationEntry.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | Arrow keys navigate autocomplete suggestions | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ Wave 0 |
| AUTO-02 | Enter selects highlighted item; Enter selects first when no highlight | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ Wave 0 |
| AUTO-03 | Escape closes dropdown without blurring input | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ Wave 0 |
| AUTO-04 | Tab confirms highlighted and advances focus | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ Wave 0 |
| AUTO-05 | Drug search uses consolidated component with same keyboard behavior | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ Wave 0 (existing file only has formatter tests) |
| ESC-01 | Escape closes autocomplete (covered by AUTO-03) | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ Wave 0 |
| FMGT-01 | After drug select, focus moves to Quantity (or Form for custom) | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ Wave 0 |
| FMGT-02 | After adding medication row, focus returns to drug search input | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ Wave 0 |
| FMGT-03 | After inline patient create, focus moves to clinical notes | component | `npx vitest run src/__tests__/NewVisitPage.test.tsx` | ❌ Wave 0 |
| FORM-04 | Enter adds medication when fields are filled | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ Wave 0 |
| ESC-02 | Escape dismisses inline patient form, returns focus to search | component | `npx vitest run src/__tests__/NewVisitPage.test.tsx` | ❌ Wave 0 |
| ESC-03 | SKIPPED | n/a | n/a | n/a |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/ComboBox.test.tsx src/__tests__/MedicationEntry.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

Existing test files for ComboBox and MedicationEntry exist but cover only visual/formatting behavior. New keyboard interaction tests need to be written in the same files (or new keyboard-specific test files). NewVisitPage has no test file at all.

- [ ] `src/__tests__/ComboBox.test.tsx` -- add keyboard navigation tests (arrow keys, Enter, Escape, Tab)
- [ ] `src/__tests__/MedicationEntry.test.tsx` -- add drug keyboard nav, FMGT-01, FMGT-02, FORM-04 tests
- [ ] `src/__tests__/NewVisitPage.keyboard.test.tsx` -- new file for FMGT-03, ESC-02 tests (NewVisitPage has heavy deps; may need significant mocking of db, routing, PatientRegistrationForm)

**Note on NewVisitPage testing:** NewVisitPage imports from `@/db/patients`, `@/db/visits`, `@/db/index`, and uses react-router-dom. Tests will require vi.mock for db modules and MemoryRouter. The login.test.tsx pre-existing failures (BrowserRouter basename mismatch in jsdom) do not affect MemoryRouter-based tests.

---

## Sources

### Primary (HIGH confidence)
- Direct source code inspection: ComboBox.tsx, SearchBar.tsx, MedicationEntry.tsx, NewVisitPage.tsx, vitest.config.ts
- Direct test file inspection: ComboBox.test.tsx, MedicationEntry.test.tsx, tab-order.test.tsx
- CONTEXT.md decisions (locked by user)

### Secondary (MEDIUM confidence)
- React 19 StrictMode behavior with useEffect vs requestAnimationFrame: well-documented React behavior, consistent with CONTEXT.md decision rationale

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - patterns derived directly from reading the actual source code and locked CONTEXT.md decisions
- Pitfalls: HIGH - identified directly from reading the bugs in ComboBox.tsx lines 62-63 and SearchBar.tsx lines 49-52

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable, no fast-moving dependencies involved)
