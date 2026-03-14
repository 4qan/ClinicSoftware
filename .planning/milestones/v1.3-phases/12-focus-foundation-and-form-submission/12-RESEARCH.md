# Phase 12: Focus Foundation and Form Submission - Research

**Researched:** 2026-03-14
**Domain:** CSS focus-visible, TailwindCSS v4, tab order, HTML form submission
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Focus indicator: blue ring, 2px outline with 2px offset, design-system-linked (not hardcoded blue-500)
- TailwindCSS v4 pattern: `outline-hidden focus-visible:outline-2` (confirmed from STATE.md)
- Global focus ring on ALL focusable elements, not just critical path
- Application method: Claude's discretion (global CSS base layer vs per-component)
- Tab order: sidebar nav links get `tabIndex={-1}`, header/breadcrumb links get `tabIndex={-1}`
- Collapsed CollapsibleSection content: skip by Tab (not currently managed -- needs fix)
- Disabled fieldsets: naturally excluded (native HTML, already works)
- Action buttons order: Save & Print first, then Save Visit, then Cancel
- Simple forms (LoginPage, PatientRegistrationForm, DrugManagement add form): Enter submits via `<form onSubmit>`
- LoginPage: already works, no changes needed
- NewVisitPage: NO `<form>` wrapper, Enter on focused buttons only
- Inline PatientRegistrationForm inside NewVisitPage: Enter submits inner form only (no conflict)
- All toast close buttons: `tabIndex={-1}`

### Claude's Discretion
- Global CSS base layer vs per-component focus classes (choose best for scalability)
- Exact outline color shade from Tailwind theme
- Which elements need explicit `tabIndex={-1}` vs naturally excluded
- Tab order within MedicationEntry fields

### Deferred Ideas (OUT OF SCOPE)
None. Discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOCUS-01 | All interactive elements on critical path have visible focus indicators (outline, not box-shadow) | Global CSS `@layer base` rule using `focus-visible:outline` covers all elements in one change |
| FOCUS-02 | Focus indicators use `focus-visible` so they only appear on keyboard navigation, not mouse clicks | `:focus-visible` is a native CSS pseudo-class; TailwindCSS v4 exposes it as `focus-visible:` variant |
| FOCUS-03 | Tab order follows natural form flow on all critical-path pages | tabIndex={-1} on sidebar links and header nav; DOM order drives natural tab sequence |
| FORM-01 | User can submit login form with Enter | Already implemented via `<form onSubmit>` -- needs focus-visible migration on inputs only |
| FORM-02 | User can submit patient creation form with Enter | Already implemented via `<form onSubmit>` in PatientRegistrationForm -- no form changes needed |
| FORM-03 | User can submit/save visit form with Enter | NewVisitPage has no `<form>` wrapper by design; not applicable at page level; inner PatientRegistrationForm already handles Enter |
</phase_requirements>

---

## Summary

This phase is a CSS and HTML plumbing task, not a logic task. The codebase already has the correct semantic structure for form submission (FORM-01/02/03 are largely already correct) and the right HTML element choices (disabled fieldsets, form onSubmit handlers). The only real work is replacing the existing `focus:ring-2 focus:ring-blue-500` pattern (which fires on mouse click) with `focus-visible:outline-2 focus-visible:outline-blue-*` (keyboard-only) across the whole codebase, then surgically suppressing Tab on sidebar and header navigation elements.

The biggest design decision is application method: global CSS base layer rule vs. touching every component. A global `@layer base` rule in `index.css` covers 80% of the work in one place (all native focusable elements), while a small number of per-component fixes handle the rest (ComboBox custom elements, toast close buttons).

**Primary recommendation:** One global CSS rule in `index.css` for all native focusable elements, then targeted per-component work for the known exceptions. Do not touch every input class individually -- that is churn with no structural benefit.

---

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| TailwindCSS v4 | 4.2.x (installed) | `focus-visible:` variant, `outline-hidden` utility | Already in stack; `focus-visible:` is a first-class v4 variant |
| `:focus-visible` CSS | Native (all modern browsers) | Distinguishes keyboard vs mouse focus | W3C standard, full browser support since Chrome 86/Firefox 85/Safari 15.4 |
| `tabIndex` prop (React) | N/A | Suppressing elements from tab order | Standard HTML attribute, no library needed |

### No New Dependencies
This phase requires zero new npm packages. All mechanisms are native browser HTML/CSS or already-installed Tailwind utilities.

---

## Architecture Patterns

### Recommended Approach: Layered Global + Targeted Per-Component

**Layer 1: Global CSS base rule (index.css)**

One rule in `@layer base` resets all native focusable elements to `outline-hidden` by default, then adds the visible ring on `:focus-visible`. This replaces the current scattered `focus:outline-none focus:ring-2` class soup.

```css
/* src/index.css */
@layer base {
  :focus-visible {
    outline: 2px solid theme(--color-blue-600);
    outline-offset: 2px;
  }

  /* suppress default outline on all elements -- focus-visible rule above re-adds it selectively */
  :focus:not(:focus-visible) {
    outline: none;
  }
}
```

**Why `outline` not `box-shadow`:** FOCUS-01 explicitly requires outline. Outlines respect `border-radius` in modern browsers (Chrome 94+, Firefox 96+, Safari 16+). The target user is on Windows with older hardware -- verify this is Chrome 94+ or fall back to `box-shadow` if needed. Per the project's "offline-first PWA on Windows" context, assume a reasonably modern Chromium browser.

**TailwindCSS v4 pattern (confirmed in STATE.md):**
```
outline-hidden focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2
```

**Layer 2: Remove conflicting per-component ring classes**

After the global rule is in place, the existing `focus:ring-2 focus:ring-blue-500` and `focus:outline-none` classes on inputs/buttons no longer make sense and should be stripped. They fire on mouse click (`:focus`, not `:focus-visible`) and create visual inconsistency.

Files to clean (from codebase scan):
- `LoginPage.tsx` -- inputs use `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- `PatientRegistrationForm.tsx` -- inputs use `focus:outline-none focus:ring-2 focus:ring-blue-500`
- `DrugManagement.tsx` -- inputs use `focus:outline-none focus:ring-2 focus:ring-blue-600`
- `MedicationEntry.tsx` -- inputs use `focus:outline-none focus:ring-2 focus:ring-blue-500`
- `PatientInfoCard.tsx`, `ClinicInfoSettings.tsx`, `RxNotesField.tsx`, `Header.tsx`, `NewVisitPage.tsx`, `EditVisitPage.tsx`, `SettingsPage.tsx` -- same pattern
- `ChangePassword.tsx` -- same pattern

**Layer 3: Tab order surgical fixes**

Elements to add `tabIndex={-1}`:
1. `Sidebar.tsx`: all nav `<Link>` elements and the logout `<button>` (sidebar is collapsed-by-default chrome, not critical path)
2. `Header.tsx`: the home `<Link>`, settings `<Link>`, and logout `<button>` in the header
3. `Breadcrumbs.tsx`: all `<Link>` elements
4. `Toast.tsx`: the close `<button>` on every toast (already identified in CONTEXT.md)

**Layer 4: CollapsibleSection tab management**

When `isOpen === false`, children render as `{isOpen && <div>...</div>}` -- meaning they are already removed from the DOM, so Tab naturally skips them. No additional tabIndex logic needed for the standard collapsed state.

Verify this is true for all CollapsibleSection usages in NewVisitPage: Patient section (collapsed when patient selected), Visit History (collapsed by default). Confirmed from code: the component uses `{isOpen && ...}` pattern -- collapsed content is unmounted.

**Layer 5: Action button reorder (NewVisitPage)**

Current DOM order in action bar: Cancel, Save Visit, Save & Print.
Required order: Save & Print, Save Visit, Cancel.
This is a JSX reorder in `NewVisitPage.tsx` (lines 354-381). No logic change, pure DOM reorder.

### Anti-Patterns to Avoid

- **Replacing `focus:ring` with `focus-visible:ring`:** `ring` is `box-shadow`. FOCUS-01 requires `outline`. Use `focus-visible:outline-*` instead.
- **Adding `tabIndex={0}` to non-interactive elements:** Never make divs/spans tabbable unless they have a genuine interactive role. All focusable targets in this codebase are `<button>`, `<a>`, `<input>`, or `<select>` -- they are naturally in tab order.
- **Using `outline: none` globally without `:focus-visible` restoration:** This breaks keyboard nav entirely. Always pair suppression with `:focus-visible` restoration.
- **Wrapping NewVisitPage in `<form>`:** Explicitly decided against. The textarea for clinical notes needs Enter for newlines. A page-level form wrapper would cause accidental submission.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Keyboard-only focus ring | Custom JS pointer-type tracking | `:focus-visible` CSS pseudo-class (native) |
| Hide content from Tab | Custom JS tabindex management on all children | `{isOpen && ...}` pattern unmounts children (already in place) |
| Form Enter submission | `onKeyDown` Enter handler on every input | `<form onSubmit>` (already in place on all target forms) |

---

## Common Pitfalls

### Pitfall 1: `focus:ring` vs `focus-visible:outline`
**What goes wrong:** Developer migrates `focus:ring-2` to `focus-visible:ring-2`. This changes the trigger condition (keyboard-only) but leaves the style as `box-shadow` not `outline`. FOCUS-01 fails.
**How to avoid:** Use `focus-visible:outline-2` not `focus-visible:ring-2`.

### Pitfall 2: Global outline rule overridden by per-component ring classes
**What goes wrong:** The global `@layer base` `:focus-visible` rule adds an outline. But a component still has `focus:ring-2` which fires on all focus events including mouse. The ring shows on click, defeating FOCUS-02.
**How to avoid:** Strip all `focus:ring-*`, `focus:outline-none`, `focus:border-*` utility classes from every input/button during the migration. The global rule is the single source of truth.

### Pitfall 3: Sidebar tabIndex={-1} breaks collapse toggle button
**What goes wrong:** The sidebar has a collapse toggle button (hamburger). Adding `tabIndex={-1}` to ALL sidebar elements would remove the toggle from tab order too. The toggle is in the sidebar header div, not in the nav link list.
**How to avoid:** Apply `tabIndex={-1}` only to `navItems` links and the logout button. Leave the collapse toggle button as-is (or assess whether it needs to be tabbable).

### Pitfall 4: Header search input removed from tab order
**What goes wrong:** Header links get `tabIndex={-1}` but the search input in the header is part of the critical path (patient search). Removing it from tab order would break tab navigation on the home page.
**How to avoid:** Only apply `tabIndex={-1}` to the `<Link>` and `<button>` elements in the header, not the search `<input>`.

### Pitfall 5: `outline-offset` on `<input>` can clip inside parent containers
**What goes wrong:** A 2px offset on a tightly-padded input inside a fieldset or card can clip the outline against the parent boundary.
**How to avoid:** The 2px offset is standard. If clipping occurs, add `overflow: visible` to the container or use 1px offset for dense contexts. Visually test on the actual pages after implementation.

---

## Code Examples

### Global focus rule (index.css)
```css
/* Add to src/index.css after existing @import and body rules */
@layer base {
  :focus-visible {
    outline: 2px solid theme(--color-blue-600);
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }
}
```

Note: In TailwindCSS v4, `theme(--color-blue-600)` references the CSS custom property from the design system. This makes the focus ring color automatically track theme changes. If `theme()` syntax doesn't resolve in `@layer base`, use `var(--color-blue-600)` directly (same token, different syntax).

### Per-component class removal pattern
```tsx
// BEFORE (fires on mouse click)
className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

// AFTER (global rule handles focus-visible; just remove focus-* classes)
className="w-full px-3 py-2 border rounded-lg"
```

### Sidebar nav links with tabIndex
```tsx
// Sidebar.tsx navItems.map(...)
<Link
  key={item.path}
  to={item.path}
  tabIndex={-1}   // Add this
  className={...}
>
```

### Toast close button
```tsx
// Toast.tsx
<button
  onClick={() => onClose(id)}
  aria-label="Close"
  tabIndex={-1}   // Add this
  className="text-white/80 hover:text-white font-bold text-lg leading-none shrink-0"
>
```

### Breadcrumb links
```tsx
// Breadcrumbs.tsx
<Link to={crumb.path} tabIndex={-1} className="text-gray-500 hover:text-blue-600 hover:underline">
  {crumb.label}
</Link>
```

### Action button reorder (NewVisitPage)
```tsx
// NewVisitPage.tsx -- action bar JSX, new order
<button onClick={handleSaveAndPrint} ...>Save & Print</button>  {/* first */}
<button onClick={handleSave} ...>Save Visit</button>             {/* second */}
<button onClick={() => navigate(-1)} ...>Cancel</button>         {/* last */}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `:focus` pseudo-class for focus rings | `:focus-visible` | Mouse clicks no longer show outline; keyboard nav does |
| `box-shadow` ring (Tailwind `ring-*`) | `outline` (CSS native) | Outline respects border-radius in modern browsers; doesn't affect layout |
| Per-component `focus:ring-2` scattered across JSX | Single `@layer base` global rule | One change covers all elements; easier to maintain |

---

## Open Questions

1. **TailwindCSS v4 `theme()` function in `@layer base`**
   - What we know: STATE.md confirms `outline-hidden focus-visible:outline-2` works as utility classes
   - What's unclear: Whether `theme(--color-blue-600)` resolves correctly inside a `@layer base` block in a non-utility CSS rule
   - Recommendation: Try `theme(--color-blue-600)` first; fall back to `var(--color-blue-600)` if it doesn't compile. Both reference the same design token.

2. **Sidebar collapse toggle button tab accessibility**
   - What we know: The toggle button lives in the sidebar header area, not in `navItems`
   - What's unclear: Whether the toggle should be tabbable (it's not on the critical path, but power users might use it)
   - Recommendation: Leave collapse toggle in tab order (do not add `tabIndex={-1}` to it). The decision is to suppress only nav links and logout.

3. **Header search input tab position**
   - What we know: The header contains home link, search input, settings link, logout button
   - What's unclear: The intended position of the search input in the global tab order
   - Recommendation: Leave search input tabbable but suppress the surrounding links/buttons. Patient search is on the critical path.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOCUS-01 | Focused element has visible outline class applied | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap |
| FOCUS-02 | Focus ring uses `focus-visible` not `focus` (class audit) | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap |
| FOCUS-03 | Tab-excluded elements have tabIndex={-1} | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap |
| FORM-01 | Submitting login form via Enter calls login handler | unit (component) | `npm test -- src/__tests__/login.test.tsx` | Exists (partial) |
| FORM-02 | Submitting PatientRegistrationForm via Enter calls onSubmit | unit (component) | `npm test -- src/__tests__/registration.test.tsx` | Exists (partial) |
| FORM-03 | Inner PatientRegistrationForm in NewVisitPage submits on Enter without triggering page-level action | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap |

Note on FOCUS-01/02: CSS class presence in the DOM is testable with `@testing-library`. However, `:focus-visible` pseudo-class behavior is **not reliably testable in jsdom** (jsdom does not implement `focus-visible` pointer tracking). Tests should verify:
- The element does NOT have `focus:ring-*` classes (class audit)
- The element DOES have `focus-visible:outline-*` classes OR that the global CSS rule is in place
- `tabIndex={-1}` is present on sidebar links, header links, and toast close button

True visual verification of "ring appears only on keyboard, not mouse" requires manual testing or a Playwright e2e test (outside scope of this phase's unit test requirement).

### Sampling Rate
- **Per task commit:** `npm test -- src/__tests__/focus.test.tsx src/__tests__/login.test.tsx src/__tests__/registration.test.tsx`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/focus.test.tsx` -- covers FOCUS-01, FOCUS-02, FOCUS-03, and FORM-03; needs to be created
- `login.test.tsx` and `registration.test.tsx` exist but may not cover Enter-key submission -- check and extend if needed

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read -- all files listed above read verbatim, no inference
- `src/index.css` -- no existing focus-visible rules; global base layer is open and appropriate
- `src/__tests__/setup.ts` + `vitest.config.ts` -- test infrastructure confirmed (jsdom + @testing-library/react)
- `.planning/STATE.md` -- TailwindCSS v4 pattern `outline-hidden focus-visible:outline-2` confirmed

### Secondary (MEDIUM confidence)
- MDN `:focus-visible` specification -- browser support confirmed (Chrome 86+, Firefox 85+, Safari 15.4+)
- TailwindCSS v4 docs -- `focus-visible:` is a built-in variant; `@layer base` is the standard extension point

### Tertiary (LOW confidence)
- `theme(--color-blue-600)` behavior inside `@layer base` CSS rule in TailwindCSS v4 -- not directly verified; flagged as open question above

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, everything is native browser + already-installed Tailwind
- Architecture: HIGH -- global CSS base layer approach is well-established; codebase structure confirmed by direct read
- Pitfalls: HIGH -- derived from actual codebase code patterns observed, not assumptions
- Test coverage: MEDIUM -- jsdom limitation for `:focus-visible` behavioral testing is real; class-presence tests are the practical substitute

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain; TailwindCSS v4 API unlikely to change)
