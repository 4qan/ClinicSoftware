---
phase: 21-auth-and-role-enforcement
plan: "03"
subsystem: auth
tags: [couchdb, password-management, react, typescript]

requires:
  - phase: 21-01
    provides: useCouchAuth with changePassword and resetNursePassword methods

provides:
  - Doctor can change own password via CouchDB _users API (no recovery codes)
  - Doctor can reset nurse password using admin credentials from SettingsPage
  - Zero-friction install script with hardcoded default passwords
  - Old PBKDF2 auth code fully removed

affects: [phase-22-sync, phase-23-backup]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - src/auth/ResetNursePassword.tsx
  modified:
    - src/pages/SettingsPage.tsx
    - scripts/couchdb-setup/install-couchdb.ps1
  deleted:
    - src/auth/useAuth.ts
    - src/auth/hash.ts
    - src/__tests__/auth.test.ts

key-decisions:
  - "PBKDF2 auth test file deleted alongside source files -- tests were for code that no longer exists"
  - "install-couchdb.ps1 uses hardcoded defaults (admin123/doctor123/nurse123) -- zero-friction setup, passwords changeable via app after install"

patterns-established:
  - "Password management via CouchDB _users API -- no local hashing, no recovery codes"

requirements-completed: [AUTH-02]

duration: 15min
completed: 2026-03-19
---

# Phase 21 Plan 03: Password Management and PBKDF2 Cleanup Summary

**Doctor password management via CouchDB _users API with nurse password reset, hardcoded install defaults, and full PBKDF2 code removal**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-19T18:40:00Z
- **Completed:** 2026-03-19T18:55:00Z
- **Tasks:** 2
- **Files modified:** 6 (3 created/modified, 3 deleted)

## Accomplishments
- Created `ResetNursePassword` component: doctor enters admin password to reset nurse's CouchDB password
- Updated `SettingsPage` to show `ResetNursePassword` under a `role === 'doctor'` guard, below `ChangePassword`
- Replaced all `Read-Host` interactive prompts in `install-couchdb.ps1` with hardcoded defaults
- Deleted `useAuth.ts` (PBKDF2 hook), `hash.ts` (PBKDF2 functions), and `auth.test.ts` (tests for deleted code)

## Task Commits

1. **Task 1: Create ResetNursePassword component** - `1a5f8d6` (feat)
2. **Task 2: Update SettingsPage, hardcode install script, delete PBKDF2 code** - `d3b2b30` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/auth/ResetNursePassword.tsx` - New component: admin-credentialed nurse password reset for doctor
- `src/pages/SettingsPage.tsx` - Added ResetNursePassword import and doctor-only conditional render
- `scripts/couchdb-setup/install-couchdb.ps1` - Replaced Read-Host prompts with hardcoded admin123/doctor123/nurse123
- `src/auth/useAuth.ts` - DELETED (replaced by useCouchAuth.ts in Plan 01)
- `src/auth/hash.ts` - DELETED (PBKDF2 functions no longer needed)
- `src/__tests__/auth.test.ts` - DELETED (tested PBKDF2 code that was removed)

## Decisions Made
- Deleted the PBKDF2 test file alongside the source files. It tested `hashPassword`, `verifyPassword`, `generateRecoveryCode`, and `generateSalt` -- all from `hash.ts` which was deleted. Keeping the test file would cause a broken import and a misleading test suite.
- Hardcoded install defaults make the script zero-friction. The passwords are default/well-known and meant to be changed via the app post-install. No security concern since CouchDB requires LAN access to reach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Deleted auth.test.ts alongside hash.ts**
- **Found during:** Task 2 (deleting deprecated files)
- **Issue:** Plan said to delete `useAuth.ts` and `hash.ts` but did not mention `auth.test.ts` which imports from `hash.ts` -- leaving it would break the test suite
- **Fix:** Deleted `src/__tests__/auth.test.ts` together with the source files it tests
- **Files modified:** src/__tests__/auth.test.ts (deleted)
- **Verification:** `npx tsc --noEmit` passes, `grep` finds no stale hash imports
- **Committed in:** d3b2b30 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (missing critical)
**Impact on plan:** Necessary to keep test suite valid. No scope creep.

## Issues Encountered
- `PrintVisitPage.test.tsx` has 7 pre-existing test failures (PouchDB LevelDB adapter error). Verified pre-existing by checking out previous commit. Out of scope for this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AUTH-02 complete: doctor and nurse accounts use default passwords, changeable from the app
- Phase 22 (sync): `credentials` field from `useCouchAuth` state is ready for PouchDB sync configuration
- Phase 23 (backup): restore flow unaffected by this plan

---
*Phase: 21-auth-and-role-enforcement*
*Completed: 2026-03-19*
