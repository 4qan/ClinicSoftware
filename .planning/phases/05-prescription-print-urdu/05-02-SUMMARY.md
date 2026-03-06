---
phase: 05-prescription-print-urdu
plan: "02"
subsystem: ui
tags: [urdu, i18n, print, prescription, bilingual]

requires:
  - phase: 05-prescription-print-urdu
    provides: Bilingual column headers, toUrdu() helper, urdu-cell CSS class
provides:
  - buildUrduInstruction() for natural Urdu sentence generation
  - 5-column medication table layout (consolidated from 8)
  - Form-category-aware English verb prefixes
  - Fallback to English when translations missing
affects: [prescription-print, dispensary-slip]

tech-stack:
  added: []
  patterns: [form-category-aware sentence builder, passthrough detection for fallback]

key-files:
  created: []
  modified:
    - src/constants/translations.ts
    - src/components/PrescriptionSlip.tsx
    - src/components/DispensarySlip.tsx
    - src/constants/__tests__/translations.test.ts

key-decisions:
  - "Uniform Urdu sentence template with form-awareness from dosage lookup, not template variation"
  - "Passthrough detection (toUrdu(x) === x) as fallback trigger instead of explicit missing-key check"

patterns-established:
  - "buildUrduInstruction: centralized sentence builder consumed by both print slips"
  - "IIFE pattern in JSX for per-row instruction rendering with fallback"

requirements-completed: [URDU-02, URDU-04, URDU-05]

duration: 3min
completed: 2026-03-06
---

# Phase 5 Plan 02: Natural Language Urdu Instructions Column Summary

**Consolidated 8-column medication table to 5 columns with natural Urdu instruction sentences via buildUrduInstruction()**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T17:33:50Z
- **Completed:** 2026-03-06T17:36:39Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- buildUrduInstruction() generates natural Urdu sentences with English equivalents, returns null for missing translations
- Both PrescriptionSlip and DispensarySlip reduced from 8 to 5 columns (#, Brand Name, Salt, Strength, Instructions)
- Form-category-aware English verb prefixes (Take/Apply/Instill/Administer/Inhale/Insert)
- Self-contained durations (Ongoing, As needed) correctly omit "کے لیے" suffix
- 6 unit tests covering oral, topical, drops, inhaler, ongoing duration, and fallback scenarios

## Task Commits

Each task was committed atomically:

1. **Task 05-02-04: Add buildUrduInstruction tests** - `3709990` (test, RED phase)
2. **Task 05-02-01: Implement buildUrduInstruction()** - `2b5a2a0` (feat, GREEN phase)
3. **Task 05-02-02: Refactor PrescriptionSlip** - `cbcfb7f` (feat)
4. **Task 05-02-03: Refactor DispensarySlip** - `e4c7cff` (feat)

## Files Created/Modified
- `src/constants/translations.ts` - Added MedicationForInstruction, FORM_CATEGORY, ENGLISH_VERB_PREFIX, buildUrduInstruction(); removed Form/Dosage/Freq/Duration column headers, added Instructions header
- `src/components/PrescriptionSlip.tsx` - 5-column layout with Instructions cell (140px minWidth)
- `src/components/DispensarySlip.tsx` - 5-column layout with Instructions cell (120px minWidth)
- `src/constants/__tests__/translations.test.ts` - 6 new buildUrduInstruction test cases

## Decisions Made
- Uniform sentence template (`{dosageUrdu} {frequencyUrdu} {durationUrdu} [کے لیے]`) since form-awareness already embedded in dosage translations
- Passthrough detection as fallback trigger: simple, no separate "known keys" registry needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing login test failures (4 tests in login.test.tsx) unrelated to this plan's changes. Not addressed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Print slips fully bilingual with natural Urdu instruction sentences
- Ready for Phase 6 (Rx Notes Urdu Toggle)

---
*Phase: 05-prescription-print-urdu*
*Completed: 2026-03-06*
