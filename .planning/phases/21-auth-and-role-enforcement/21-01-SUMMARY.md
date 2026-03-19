---
phase: 21-auth-and-role-enforcement
plan: "01"
subsystem: auth
tags: [auth, couchdb, login, session, roles]
dependency_graph:
  requires: []
  provides: [useCouchAuth, AuthProvider, LoginPage]
  affects: [SettingsPage, ChangePassword, Sidebar, Header, App]
tech_stack:
  added: []
  patterns: [CouchDB Basic auth via fetch, sessionStorage session persistence, role extraction from userCtx.roles]
key_files:
  created:
    - src/auth/useCouchAuth.ts
  modified:
    - src/auth/AuthProvider.tsx
    - src/auth/LoginPage.tsx
    - src/pages/SettingsPage.tsx
    - src/__tests__/login.test.tsx
decisions:
  - useCouchAuth reads couchUrl from PouchDB settings on mount via getSetting; if not set, login returns not_configured error
  - Session verified against CouchDB on mount; if CouchDB is unreachable, session is cleared rather than trusted
  - Recovery code flow (PBKDF2) deleted entirely; RecoveryCodeSection removed from SettingsPage
  - changePassword re-authenticates with current password before issuing PUT to _users to verify identity
metrics:
  duration: ~10 minutes
  completed_date: "2026-03-19T18:36:37Z"
  tasks_completed: 3
  files_changed: 5
---

# Phase 21 Plan 01: CouchDB Auth Hook and Login Page Summary

CouchDB Basic auth replacing PBKDF2 local auth: useCouchAuth hook authenticates against /_session, extracts role from userCtx.roles, persists session in sessionStorage, and AuthProvider exposes role/username/credentials to all consumers.

## What Was Built

### useCouchAuth hook (`src/auth/useCouchAuth.ts`)
- On mount: reads `couchUrl` from PouchDB settings, restores sessionStorage session if present, verifies credentials against CouchDB /_session
- `login(username, password)`: builds Basic auth credentials, GETs /_session, extracts role from `userCtx.roles`, writes to sessionStorage
- `logout()`: clears state, sessionStorage, and legacy localStorage key
- `changePassword(currentPassword, newPassword)`: verifies current password via /_session, GETs user doc from /_users, PUTs with new password, updates credentials in state and sessionStorage
- `resetNursePassword(adminPassword, newPassword)`: uses admin credentials to GET/PUT nurse user doc in /_users

### AuthProvider (`src/auth/AuthProvider.tsx`)
- Swapped `useAuth` import for `useCouchAuth`
- `AuthContextType = ReturnType<typeof useCouchAuth>` — now exposes `role`, `username`, `credentials` alongside `isAuthenticated`, `isLoading`, `login`, `logout`, `changePassword`, `resetNursePassword`

### LoginPage (`src/auth/LoginPage.tsx`)
- Added `username` field (autoFocus, renders before password)
- Calls `login(username, password)` and handles all error codes with user-readable messages
- Recovery flow (showRecovery, handleRecover, Forgot password?) deleted entirely

### Login tests (`src/__tests__/login.test.tsx`)
- Rewritten from scratch using MemoryRouter (fixes 4 pre-existing BrowserRouter basename failures)
- Mocks `fetch` globally and `getSetting` from `@/db/pouchdb`
- 5 tests: renders fields, no recovery UI, 401 error message, not_configured error, successful login stores session

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed RecoveryCodeSection from SettingsPage.tsx**
- **Found during:** Task 1
- **Issue:** `SettingsPage.tsx` imported `regenerateRecoveryCode` and `checkRecoveryCodeExists` from `useAuthContext()`. These methods no longer exist in `useCouchAuth`, which would cause a TypeScript compilation failure.
- **Fix:** Removed `RecoveryCodeSection` component and its `useAuthContext()` import from `SettingsPage.tsx`. The recovery flow is deleted as part of this plan's objective.
- **Files modified:** `src/pages/SettingsPage.tsx`
- **Commit:** 712ee13

## Self-Check

- [x] `src/auth/useCouchAuth.ts` exists
- [x] `src/auth/AuthProvider.tsx` imports from `./useCouchAuth`
- [x] `src/auth/LoginPage.tsx` contains `<input id="username"` with autoFocus
- [x] `src/auth/LoginPage.tsx` does not contain "Forgot password?" or "recovery"
- [x] `npx tsc --noEmit` exits 0
- [x] `npx vitest run src/__tests__/login.test.tsx` 5/5 pass

## Self-Check: PASSED
