# Phase 14: Print Flow - Research

**Researched:** 2026-03-15
**Domain:** Browser print API, focus management, tab order
**Confidence:** HIGH

## Summary

This is a surgical phase. All infrastructure already exists: `afterprint` event listener, `handleAfterPrint` callback, auto-print via `?auto` query param, and the Save & Print navigation. The work is five targeted changes across three files, none requiring new libraries or patterns.

The only architectural question (discretion area) is whether `autoFocus` and afterprint focus restore conflict. They don't: `autoFocus` fires once on mount, `afterprint` fires after the dialog closes. No coordination needed unless React re-mounts the component (StrictMode double-mount), which is already handled by the existing `autoPrintTimer` cleanup pattern.

**Primary recommendation:** Wire the five integration points listed in CONTEXT.md. Write one new test file for PRNT-01/02/03 keyboard behaviors in PrintVisitPage. Existing PrintVisitPage.test.tsx covers rendering but not focus/keyboard paths.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tab path to Print button:**
- On NewVisitPage: medication list remove buttons get `tabIndex={-1}` (mouse-only). Tab goes from last prescription field (RxNotes or MedicationEntry) directly to Save & Print
- On PrintVisitPage: Prescription/Dispensary toggle tabs get `tabIndex={-1}` (mouse-only). Tab lands on Print button immediately
- PrintVisitPage breadcrumbs: `tabIndex={-1}` (consistent with Phase 12 decision for all nav chrome)
- Print button gets `autoFocus` so it's focused on page load (covers manual navigation to PrintVisitPage without ?auto param)

**Auto-print on Save & Print:**
- Save & Print on NewVisitPage navigates with `?auto=prescription` to auto-open the browser print dialog
- Only prescription auto-prints. Dispensary requires manual action (switch tab, click/Enter print)
- The browser print dialog opens automatically (200ms delay, already implemented). Doctor confirms with Enter or cancels with Escape in the browser dialog. Print is NOT sent without confirmation.

**Focus restore after print dialog:**
- After the `afterprint` event fires, focus returns to the Print button
- Same behavior regardless of whether doctor printed (Enter) or cancelled (Escape) in the browser dialog
- Same behavior for auto-print (Save & Print flow) and manual print
- No auto-navigation after printing. Doctor stays on PrintVisitPage with Print button focused

### Claude's Discretion
- Implementation of focus restore (ref on Print button + focus() in afterprint handler vs other approach)
- Whether autoFocus and afterprint focus restore need coordination to avoid conflicts

### Deferred Ideas (OUT OF SCOPE)
None. Discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRNT-01 | User can Tab to the print button after completing a prescription | tabIndex={-1} on remove buttons (MedicationList) and toggle tabs (PrintVisitPage) removes tab stops between last field and Print button |
| PRNT-02 | User can trigger print with Enter on the print button | Print button is a standard `<button type="button">` — Enter fires onClick natively. No special handling needed. |
| PRNT-03 | Focus restores to a logical position after the print dialog closes | afterprint event already wired; add `printButtonRef.current?.focus()` inside handleAfterPrint |
</phase_requirements>

---

## Standard Stack

No new libraries. All patterns are already in use.

| Technique | Already Used | Phase 14 Usage |
|-----------|-------------|----------------|
| `tabIndex={-1}` | Phase 12 (sidebar, header, breadcrumbs, toast) | Remove buttons in MedicationList, toggle tabs in PrintVisitPage |
| `autoFocus` | LoginPage password field | Print button on PrintVisitPage |
| `afterprint` event | PrintVisitPage line 114-117 | Extend handleAfterPrint to call focus() |
| `useRef` for focus targets | MedicationEntry, NewVisitPage | Ref on Print button for afterprint focus restore |

## Architecture Patterns

### Integration Points (5 changes, 3 files)

**1. `NewVisitPage.tsx` line 201**
Change navigate call to include `?auto=prescription`:
```typescript
navigate(`/visit/${visitId}/print?auto=prescription`)
```

**2. `MedicationList.tsx` — both Remove buttons (desktop table + mobile card)**
Add `tabIndex={-1}` to each:
```tsx
<button
  type="button"
  tabIndex={-1}
  onClick={() => onRemove(index)}
  ...
>
  Remove
</button>
```
There are two Remove buttons (lines 54-60 and 83-89): desktop table and mobile card layout. Both need `tabIndex={-1}`.

**3. `PrintVisitPage.tsx` lines 173-195 — toggle buttons**
Add `tabIndex={-1}` to both Prescription and Dispensary toggle buttons.

**4. `PrintVisitPage.tsx` — Breadcrumbs**
Pass `tabIndex={-1}` to `<Breadcrumbs>` or confirm the component already accepts/applies it. Check Breadcrumbs.tsx for how Phase 12 handled this.

**5. `PrintVisitPage.tsx` — Print button + afterprint focus restore**
```tsx
const printButtonRef = useRef<HTMLButtonElement>(null)

const handleAfterPrint = useCallback(() => {
  setPrintMode(null)
  removePageStyle()
  printButtonRef.current?.focus()
}, [])

// In JSX:
<button
  ref={printButtonRef}
  type="button"
  autoFocus
  onClick={() => handlePrint(previewMode)}
  ...
>
```

### autoFocus + afterprint coordination

No conflict. `autoFocus` fires on initial mount. `afterprint` fires only after `window.print()` returns (dialog closed). They operate at different lifecycle moments. The `autoFocus` attribute on a button is valid HTML and React supports it without caveats.

**Edge case:** In React StrictMode, components mount twice in development. The existing `autoPrintTimer` cleanup already handles the double-mount auto-print issue. `autoFocus` on double-mount will just focus the button twice — no observable problem.

### Anti-Patterns to Avoid

- **Don't use `document.querySelector` to find the print button for focus** — use a ref. Direct DOM queries are fragile and break if the component structure changes.
- **Don't call `window.print()` synchronously** — always use the existing setTimeout(100-200ms) pattern. This allows React to commit the printMode state change before the browser freezes for the dialog.
- **Don't add `tabIndex={-1}` to the Breadcrumbs nav wrapper if the component already handles it** — check how Phase 12 implemented it to avoid duplication.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Focus restore after async browser event | Custom event bus or state flag | `useRef` + `focus()` in `afterprint` handler |
| Removing elements from tab flow | CSS pointer-events tricks | `tabIndex={-1}` |

## Common Pitfalls

### Pitfall 1: Breadcrumbs tabIndex implementation
**What goes wrong:** Phase 12 set `tabIndex={-1}` on nav chrome — but the mechanism (prop vs internal) needs checking before writing the plan.
**How to avoid:** Read `Breadcrumbs.tsx` at plan time to confirm whether it accepts a prop or applies `-1` internally.
**Warning signs:** If Breadcrumbs links appear in the tab sequence on PrintVisitPage after the change.

### Pitfall 2: afterprint not firing in jsdom
**What goes wrong:** `window.dispatchEvent(new Event('afterprint'))` works in jsdom. The existing test at line 131 already does this — use the same pattern for new PRNT-03 tests.
**How to avoid:** Follow the existing test pattern in PrintVisitPage.test.tsx.

### Pitfall 3: autoFocus blocked by browser policies
**What goes wrong:** `autoFocus` on a button works reliably when navigated via React Router (page was user-initiated). It does NOT work if the page loads without a prior user gesture (unlikely in this app, but worth noting).
**Impact:** Low risk. The flow always starts with doctor pressing Enter on Save & Print.

### Pitfall 4: MedicationList has two Remove buttons
**What goes wrong:** There are two separate `<button>Remove</button>` elements per medication row — one for desktop table (hidden on mobile) and one for mobile card (hidden on desktop). Both need `tabIndex={-1}`.
**Warning signs:** Tab still lands on Remove buttons in one viewport size.

## Code Examples

### Focus restore in afterprint (verified pattern)
```typescript
// Source: existing PrintVisitPage.tsx afterprint pattern, extended
const printButtonRef = useRef<HTMLButtonElement>(null)

const handleAfterPrint = useCallback(() => {
  setPrintMode(null)
  removePageStyle()
  printButtonRef.current?.focus()  // PRNT-03
}, [])

useEffect(() => {
  window.addEventListener('afterprint', handleAfterPrint)
  return () => window.removeEventListener('afterprint', handleAfterPrint)
}, [handleAfterPrint])
```

### Test pattern for PRNT-03 (model from existing tests)
```typescript
// Dispatch afterprint, assert Print button is focused
it('focus returns to Print button after afterprint event', async () => {
  renderPrintPage(testVisitId)
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
  })

  const printBtn = screen.getByRole('button', { name: 'Print Prescription' })
  // Simulate print dialog close
  window.dispatchEvent(new Event('afterprint'))

  await waitFor(() => {
    expect(document.activeElement).toBe(printBtn)
  })
})
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | vite.config.ts (vitest block) |
| Quick run command | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRNT-01 | Tab from last prescription field reaches Print button without stopping at remove buttons or toggle tabs | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ Wave 0 |
| PRNT-02 | Enter on focused Print button calls window.print | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ Wave 0 |
| PRNT-03 | After afterprint event, focus returns to Print button | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ Wave 0 |

**Note on PRNT-01:** Tab order tests in jsdom use `userEvent.tab()` from @testing-library/user-event. This library simulates tab navigation including `tabIndex` skipping. The existing `tab-order.test.tsx` uses this pattern — follow it.

**Note on PRNT-02:** `userEvent.keyboard('{Enter}')` while the button is focused will fire the click handler. Mock `window.print` with `vi.spyOn` as existing tests do.

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/PrintVisitPage.keyboard.test.tsx` — covers PRNT-01, PRNT-02, PRNT-03
- [ ] No framework or fixture gaps — existing `beforeEach`/`afterEach` setup in `PrintVisitPage.test.tsx` can be copied directly

## Sources

### Primary (HIGH confidence)
- Direct source code reading: `PrintVisitPage.tsx`, `NewVisitPage.tsx`, `MedicationList.tsx` — all integration points verified line by line
- Direct test file reading: `PrintVisitPage.test.tsx`, `NewVisitPage.keyboard.test.tsx` — existing patterns confirmed
- CONTEXT.md — all decisions locked before research

### Secondary (MEDIUM confidence)
- MDN `afterprint` event — standard browser event, fires after `window.print()` dialog closes (whether user printed or cancelled)
- HTML spec `autoFocus` attribute — fires on mount, valid on button elements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all patterns already in codebase
- Architecture: HIGH — all five integration points are precisely located with line numbers in CONTEXT.md
- Pitfalls: HIGH — derived from reading actual source code, not from general knowledge

**Research date:** 2026-03-15
**Valid until:** Until PrintVisitPage.tsx or MedicationList.tsx are structurally refactored
