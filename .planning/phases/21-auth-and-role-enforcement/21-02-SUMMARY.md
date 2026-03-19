---
phase: 21-auth-and-role-enforcement
plan: "02"
subsystem: auth-ui
tags: [rbac, routing, ui, tests]
dependency_graph:
  requires: [21-01]
  provides: [role-based-ui-enforcement]
  affects: [App.tsx, Sidebar.tsx, Header.tsx, NewVisitPage.tsx, EditVisitPage.tsx]
tech_stack:
  added: []
  patterns: [ProtectedRoute component, role-filtered nav, conditional JSX rendering]
key_files:
  created:
    - src/components/ProtectedRoute.tsx
    - src/__tests__/rbac.test.tsx
  modified:
    - src/App.tsx
    - src/components/Sidebar.tsx
    - src/components/Header.tsx
    - src/pages/NewVisitPage.tsx
    - src/pages/EditVisitPage.tsx
    - src/__tests__/NewVisitPage.keyboard.test.tsx
decisions:
  - Silent redirect to / for nurse on doctor-only routes (no toast, no 403 page) -- per CONTEXT.md
  - Structural file assertions used for visit page prescription hiding (render-based for ProtectedRoute/Sidebar/Header)
  - useAuthContext injected into visit pages via top-level destructure to keep conditional renders clean
metrics:
  duration: ~25 minutes
  tasks_completed: 4
  files_changed: 8
  completed_date: "2026-03-19"
requirements: [AUTH-03, AUTH-04, AUTH-05, AUTH-06]
---

# Phase 21 Plan 02: RBAC UI Enforcement Summary

Role-based UI enforcement across all app surfaces: route guards, sidebar filtering, role labels in header and sidebar, prescription section hidden from nurse in visit forms, and full behavioral test coverage.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ProtectedRoute + doctor-only route gates | 0e8cfb1 | ProtectedRoute.tsx, App.tsx |
| 2 | Sidebar role filtering + role labels in Sidebar and Header | 604fed2 | Sidebar.tsx, Header.tsx |
| 3 | Hide prescription section from nurse in visit forms | 4e3d77d | NewVisitPage.tsx, EditVisitPage.tsx |
| 4 | RBAC behavioral tests | 5496dfb | rbac.test.tsx, NewVisitPage.keyboard.test.tsx |

## What Was Built

**ProtectedRoute component:** Reads `role` from `useAuthContext()`, renders children if role is in `allowedRoles`, otherwise returns `<Navigate to="/" replace />`. No toast, no 403 page.

**Route gating in App.tsx:** `/medications`, `/settings`, `/visit/:id/print` wrapped with `<ProtectedRoute allowedRoles={['doctor']}>`. All other routes remain open to both roles.

**Sidebar nav filtering:** `NURSE_ALLOWED_PATHS = ['/', '/patients']` constant. `visibleItems` derived from `navItems.filter()` when `role === 'nurse'`. Role label displayed above logout button in both expanded (Doctor/Nurse) and collapsed (Dr/Ns) states.

**Header role label + settings link:** Role label span added before settings link. Settings link wrapped in `{role !== 'nurse' && (...)}` guard.

**Visit form prescription hiding:** Both `NewVisitPage.tsx` and `EditVisitPage.tsx` import `useAuthContext`, destructure `role`, and wrap the entire prescription section and Save & Print button with `{role !== 'nurse' && (...)}`. Vitals section is unchanged for both roles.

**RBAC tests (19 tests):** Cover ProtectedRoute redirect behavior, Sidebar nav filtering for doctor and nurse, role label rendering in Sidebar (both collapsed and expanded) and Header, Settings link hiding for nurse, and structural assertions confirming prescription guards and useAuthContext usage in visit pages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NewVisitPage.keyboard.test.tsx broke after adding useAuthContext**

- **Found during:** Task 4 (full test suite run)
- **Issue:** Adding `useAuthContext()` to NewVisitPage broke the existing keyboard test (7 tests) because it rendered without an AuthProvider wrapper
- **Fix:** Added `vi.mock('@/auth/AuthProvider', ...)` and `vi.mock('@/db/pouchdb', ...)` to the keyboard test file
- **Files modified:** src/__tests__/NewVisitPage.keyboard.test.tsx
- **Commit:** 5496dfb (included with Task 4 commit)

## Verification Results

- `npx tsc --noEmit`: PASS (no errors)
- `npx vitest run src/__tests__/rbac.test.tsx`: 19/19 PASS
- `npx vitest run`: 333/333 PASS (no regressions)

## Self-Check: PASSED
