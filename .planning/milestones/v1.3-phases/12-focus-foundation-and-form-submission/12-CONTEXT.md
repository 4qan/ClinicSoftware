# Phase 12: Focus Foundation and Form Submission - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Visible focus indicators on keyboard navigation, logical tab order through the critical path, and Enter-to-submit on simple forms. This phase lays the foundation for Phase 13 (keyboard interactions) and Phase 14 (print flow).

</domain>

<decisions>
## Implementation Decisions

### Focus indicator style
- Blue focus ring, tied to Tailwind theme (design-system-linked, not hardcoded blue-500)
- 2px outline with 2px offset from element edge
- `focus-visible` only (not on mouse click)
- TailwindCSS v4 pattern: `outline-hidden focus-visible:outline-2` (confirmed from STATE.md)
- Global focus ring on ALL focusable elements (not just critical path)
- Application method: Claude's discretion (global CSS base layer vs per-component)

### Tab order
- Critical-path-only tab order: sidebar nav links get `tabIndex={-1}` (still clickable, not tabbable)
- Collapsed CollapsibleSection content (e.g., Patient section after selection) skipped by Tab
- Disabled fieldsets removed from tab order (native HTML behavior, already works)
- Action buttons tab order: Save & Print first, then Save Visit, then Cancel
- Header/breadcrumb links: removed from tab order (`tabIndex={-1}`)

### Enter-to-submit
- Simple forms (LoginPage, PatientRegistrationForm, DrugManagement add form): Enter submits via `<form onSubmit>`
- LoginPage: already works, no changes needed
- NewVisitPage: NO `<form>` wrapper. Enter on focused buttons only. No form-wide Enter-to-submit (doctor uses textarea for clinical notes, Enter must create newlines)
- Inline PatientRegistrationForm inside NewVisitPage: Enter submits the inline form only (scoped to inner `<form>`, no conflict with outer page since outer has no `<form>`)

### Toast keyboard isolation
- All toast close buttons get `tabIndex={-1}` (never steal keyboard focus)
- Success toasts: auto-dismiss (already implemented)
- Error toasts: persist until manually closed with mouse click (no auto-dismiss)

### Claude's Discretion
- Global CSS base layer vs per-component focus classes (choose best for scalability)
- Exact outline color shade from Tailwind theme
- Which elements need explicit tabIndex={-1} vs which are naturally excluded
- Tab order within MedicationEntry fields (drug search, form, strength, quantity, frequency, duration)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ComboBox`: Already has `handleKeyDown` for arrow/escape navigation, needs focus-visible styling
- `PatientRegistrationForm`: Already has `<form onSubmit>` pattern, Enter-to-submit ready
- `LoginPage`: Already has `<form onSubmit>` and `autoFocus` on password field
- `Toast`: Simple component, just needs `tabIndex={-1}` on close button

### Established Patterns
- Current focus styling: `focus:ring-2 focus:ring-blue-500` (always-on, needs migration to focus-visible)
- Some inputs use `focus:outline-none focus:ring-2`, others use `focus:ring-2 focus:border-blue-500` (inconsistent)
- Disabled sections use `<fieldset disabled>` with `opacity-50 pointer-events-none` (native tab exclusion works)
- CollapsibleSection controls visibility but doesn't manage tabIndex on children

### Integration Points
- `src/index.css` or `app.css`: Where global focus styles would go
- `AppLayout.tsx` / `Sidebar.tsx`: Where sidebar tabIndex={-1} would be applied
- `Header.tsx` / `Breadcrumbs.tsx`: Where nav tabIndex={-1} would be applied
- `NewVisitPage.tsx`: Action buttons need reordering (Save & Print before Save Visit)
- `Toast.tsx`: Single `tabIndex={-1}` addition on close button

</code_context>

<specifics>
## Specific Ideas

- Focus ring must be design-system-linked: if the Tailwind theme palette changes tomorrow, focus ring color changes automatically. No hardcoded color values.
- Doctor is non-tech-savvy, on older Windows hardware. Ctrl+Enter or complex modifier keys are not viable. Enter should do the obvious thing in context.
- The composite NewVisitPage form (search + notes + meds + actions) deliberately avoids `<form>` to prevent accidental submission while typing clinical notes.

</specifics>

<deferred>
## Deferred Ideas

None. Discussion stayed within phase scope.

</deferred>

---

*Phase: 12-focus-foundation-and-form-submission*
*Context gathered: 2026-03-14*
