---
phase: 01-foundation-and-patient-management
plan: 05
subsystem: ui
tags: [react, tailwind, ux, breadcrumbs, cnic, recovery-code]

requires:
  - phase: 01-foundation-and-patient-management (plans 1-4)
    provides: auth system, patient registration, patient profile, app layout
provides:
  - Recovery code management in Settings (independent of password change)
  - Breadcrumb navigation on all inner pages
  - Gender restricted to Male/Female
  - CNIC auto-formatting (XXXXX-XXXXXXX-X)
  - Improved patient ID visibility
affects: [phase-2-clinical-workflow]

tech-stack:
  added: []
  patterns: [formatCNIC utility, Breadcrumbs component]

key-files:
  created:
    - src/components/Breadcrumbs.tsx
    - src/utils/formatCNIC.ts
  modified:
    - src/pages/SettingsPage.tsx
    - src/auth/useAuth.ts
    - src/auth/ChangePassword.tsx
    - src/pages/PatientsPage.tsx
    - src/pages/RegisterPatientPage.tsx
    - src/pages/PatientProfilePage.tsx
    - src/components/PatientInfoCard.tsx
    - src/db/index.ts
    - src/db/patients.ts

key-decisions:
  - "Recovery code shown via Settings with password gate, not after password change"
  - "CNIC stored with dashes (formatted) in database"
  - "formatCNIC extracted to shared utility for reuse across registration and edit"

patterns-established:
  - "Breadcrumbs: each page renders its own <Breadcrumbs> with crumb array"
  - "formatCNIC: strip non-digits, insert dashes at positions 5 and 12"

requirements-completed: [FOUND-04, PAT-01, PAT-02]

duration: 4min
completed: 2026-03-05
---

# Phase 1 Plan 5: Form UX Fixes and Recovery Code Relocation Summary

**Recovery code relocated to Settings with password-gated access, breadcrumbs on all pages, gender restricted to Male/Female, CNIC auto-formatting, and patient ID visibility improved**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T20:49:54Z
- **Completed:** 2026-03-05T20:54:45Z
- **Tasks:** 5
- **Files modified:** 11

## Accomplishments
- Recovery code section in Settings page with password verification before displaying code
- ChangePassword no longer shows recovery code (simple success message instead)
- Breadcrumb navigation on Patients, Register, Patient Profile, and Settings pages
- Gender options restricted to Male and Female across all forms and types
- CNIC auto-formats to XXXXX-XXXXXXX-X pattern with 13-digit validation
- Patient ID preview on registration styled as informational blue (not broken gray)
- Patient ID badge on profile made larger and bolder

## Task Commits

Each task was committed atomically:

1. **Task 5-01: Relocate recovery code to Settings** - `b48c400` (feat)
2. **Task 5-02: Add breadcrumb navigation** - `eb4b66f` (feat)
3. **Task 5-03: Restrict gender to Male/Female** - `9eaa602` (feat)
4. **Task 5-04: Improve patient ID visibility** - `95c4e89` (feat)
5. **Task 5-05: CNIC auto-formatting** - `4c1e21f` (feat)

## Files Created/Modified
- `src/components/Breadcrumbs.tsx` - Reusable breadcrumb nav component
- `src/utils/formatCNIC.ts` - CNIC formatting utility (XXXXX-XXXXXXX-X)
- `src/pages/SettingsPage.tsx` - Added Security Code section above Change Password
- `src/auth/useAuth.ts` - Added regenerateRecoveryCode and checkRecoveryCodeExists
- `src/auth/ChangePassword.tsx` - Removed recovery code display, show simple success
- `src/pages/PatientsPage.tsx` - Added breadcrumbs
- `src/pages/RegisterPatientPage.tsx` - Added breadcrumbs, blue ID preview, CNIC formatting
- `src/pages/PatientProfilePage.tsx` - Added breadcrumbs
- `src/components/PatientInfoCard.tsx` - Larger ID badge, CNIC formatting in edit mode, gender fix
- `src/db/index.ts` - Gender type narrowed to 'male' | 'female'
- `src/db/patients.ts` - Gender type narrowed to 'male' | 'female'

## Decisions Made
- Recovery code shown via Settings with password gate, not after password change
- CNIC stored with dashes (formatted) in database since it is display-only
- formatCNIC extracted to shared utility to avoid duplication

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fix broken tests after breadcrumb and text changes**
- **Found during:** Task 5-05 (CNIC auto-formatting, final test run)
- **Issue:** Breadcrumbs added duplicate "Ahmed Khan" text breaking `getByText` in profile tests. Registration test used old "will be assigned on save" text.
- **Fix:** Changed profile tests to `getByRole('heading')` for disambiguation. Updated registration test text matcher.
- **Files modified:** src/__tests__/profile.test.tsx, src/__tests__/registration.test.tsx
- **Verification:** All 59 tests pass
- **Committed in:** 4c1e21f (part of Task 5-05 commit)

**2. [Rule 1 - Bug] Missing gender type fix in patients.ts**
- **Found during:** Task 5-03 (Gender restriction)
- **Issue:** Plan only mentioned db/index.ts but PatientInput in db/patients.ts also had 'other' in union type
- **Fix:** Updated PatientInput gender type to 'male' | 'female'
- **Files modified:** src/db/patients.ts
- **Verification:** Build passes, type-safe
- **Committed in:** 9eaa602 (part of Task 5-03 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 complete. All 5 plans executed, all gap closures addressed.
- Ready for Phase 2: Clinical Workflow

---
*Phase: 01-foundation-and-patient-management*
*Completed: 2026-03-05*
