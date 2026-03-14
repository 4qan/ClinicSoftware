---
phase: 12
plan: 02
subsystem: keyboard-navigation
tags: [tab-order, accessibility, focus, form-submission]
dependency_graph:
  requires: []
  provides: [tab-order-fixes, button-order-newvisit]
  affects: [Sidebar, Header, Breadcrumbs, Toast, NewVisitPage]
tech_stack:
  added: []
  patterns: [tabIndex=-1 on nav chrome, DOM order for keyboard flow]
key_files:
  created:
    - src/__tests__/tab-order.test.tsx
  modified:
    - src/components/Sidebar.tsx
    - src/components/Header.tsx
    - src/components/Breadcrumbs.tsx
    - src/components/Toast.tsx
    - src/pages/NewVisitPage.tsx
decisions:
  - "tabIndex={-1} on nav chrome (sidebar links, header links, breadcrumbs, toast close) removes them from tab flow without hiding them visually"
  - "Sidebar logo link also gets tabIndex={-1} for consistency (not in navItems but still nav chrome)"
  - "NewVisitPage action button order changed to Save & Print > Save Visit > Cancel (primary action first)"
metrics:
  duration: "4 min"
  completed: "2026-03-14T13:07:53Z"
  tasks: 2
  files_changed: 6
---

# Phase 12 Plan 02: Tab Order Fixes and Form Submission Summary

Tab order fixed across 4 chrome components using tabIndex={-1}, NewVisitPage action buttons reordered with Save & Print first, and test coverage added for all behaviors.

## What Was Built

### Tab Order Fixes

Four components had non-critical navigation chrome removed from the tab sequence:

- **Sidebar.tsx:** `tabIndex={-1}` on all navItems Link elements, the logo Link, and the logout button. The collapse toggle button remains tabbable.
- **Header.tsx:** `tabIndex={-1}` on home Link, settings Link, and logout button. Search input remains tabbable (critical path).
- **Breadcrumbs.tsx:** `tabIndex={-1}` on all Link elements.
- **Toast.tsx:** `tabIndex={-1}` on the close button.

### Button Reorder (NewVisitPage)

Action buttons reordered in DOM from Cancel, Save Visit, Save & Print to Save & Print, Save Visit, Cancel. Only JSX order changed; all handlers, classes, and conditional rendering preserved.

### Test Coverage

`src/__tests__/tab-order.test.tsx` added with 11 tests covering:
- Sidebar nav links, logout button, and toggle button tabIndex assertions
- Header home link, settings link, logout button, and search input tabIndex assertions
- Breadcrumbs link tabIndex assertions
- Toast close button tabIndex assertion
- PatientRegistrationForm submits on Enter key press
- Documentation test confirming NewVisitPage has no form wrapper by design (FORM-03)

## Deviations from Plan

### Auto-fixed Issues

None.

### Observations

**Pre-existing test failures (not caused by this plan):**

1. `login.test.tsx` (4 tests): Failing due to `BrowserRouter basename="/ClinicSoftware"` mismatch in jsdom environment where URL defaults to `http://localhost/`. These were failing before this plan's changes and are not caused by them.

2. `focus-styles.test.tsx`: Intermittently fails in full suite run due to test isolation issues from plan 12-01. Passes when run standalone.

## Verification

- `npm test -- src/__tests__/tab-order.test.tsx`: 11/11 tests pass
- `npx vite build`: Succeeds
- `npm test` full suite: 262/266 tests pass; 4 failures are pre-existing login tests unrelated to this plan

## Self-Check

- [x] `src/__tests__/tab-order.test.tsx` created and committed
- [x] `src/components/Sidebar.tsx` modified with tabIndex={-1}
- [x] `src/components/Header.tsx` modified with tabIndex={-1}
- [x] `src/components/Breadcrumbs.tsx` modified with tabIndex={-1}
- [x] `src/components/Toast.tsx` modified with tabIndex={-1}
- [x] `src/pages/NewVisitPage.tsx` modified with button reorder
- [x] Commit 91590b1 exists
