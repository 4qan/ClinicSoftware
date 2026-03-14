---
phase: 13-keyboard-interactions
plan: "03"
subsystem: patient-search-keyboard
tags: [keyboard, accessibility, focus-management, patient-search]
dependency_graph:
  requires: [13-01]
  provides: [patient-search-keyboard-nav, inline-form-escape, post-create-focus]
  affects: [NewVisitPage]
tech_stack:
  added: []
  patterns: [useAutocompleteKeyboard, pendingFocusTarget, document-level-escape-listener]
key_files:
  created:
    - src/__tests__/NewVisitPage.keyboard.test.tsx
  modified:
    - src/pages/NewVisitPage.tsx
decisions:
  - "document-level keydown listener for inline form Escape: focus leaves the triggering button when it unmounts, so a React onKeyDown handler on the wrapper div never fires; document listener captures Escape regardless of where focus lands"
  - "patientDropdownDismissed state pattern: dropdown visibility is derived from query length (no explicit open state), so a boolean dismiss flag is needed; reset to false on any query change so typing re-opens the dropdown"
  - "ESC-03 acknowledged as skipped: no modals exist in the codebase; requirement listed in plan frontmatter for traceability only"
metrics:
  duration: "8 min"
  completed_date: "2026-03-14"
  tasks_completed: 1
  files_changed: 2
---

# Phase 13 Plan 03: NewVisitPage Keyboard Navigation Summary

**One-liner:** Patient search dropdown with full keyboard nav (arrows/Enter/Tab/Escape) using useAutocompleteKeyboard, inline form Escape via document listener, and pendingFocusTarget pattern for post-create focus transition.

## What Was Built

NewVisitPage now supports complete keyboard-driven patient search and inline patient creation:

- Arrow keys navigate the patient search dropdown, Enter selects (or selects first if none highlighted), Tab selects and advances focus, Escape closes without clearing query or blurring the input.
- Pressing Escape when the inline patient registration form is visible dismisses it and returns focus to the patient search input.
- After successfully creating a patient inline, focus moves automatically to the clinical notes textarea.

## Tasks

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Patient search keyboard nav, inline form Escape, post-create focus | Done | ba9adbe |

## Decisions Made

**Document-level Escape listener for inline form**
When the "Create as new patient" button is clicked, React unmounts it and mounts the inline form. Focus moves to `body` (unmounted element loses focus). A `onKeyDown` handler on the inline form wrapper div would never fire because the active element is outside it. A `document.addEventListener('keydown')` in a `useEffect` (active only when `showInlineRegistration` is true) captures the Escape key regardless of focus position.

**patientDropdownDismissed state**
The patient dropdown visibility is derived from `patientQuery.trim().length >= 2` -- there is no explicit `isOpen` state. To support Escape closing the dropdown without clearing the query, a `patientDropdownDismissed` boolean is added. It is set to `true` by the hook's `onClose` callback and reset to `false` via a `useEffect` on `patientQuery` changes, so typing after Escape re-opens the dropdown.

**ESC-03 skipped**
No modals exist in the codebase. The requirement is acknowledged in this plan's frontmatter for traceability; no code was added.

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check

- [x] `src/__tests__/NewVisitPage.keyboard.test.tsx` exists
- [x] `src/pages/NewVisitPage.tsx` modified
- [x] Commits fecf8a9 (test RED), ba9adbe (feat GREEN) exist
- [x] All 7 tests pass
