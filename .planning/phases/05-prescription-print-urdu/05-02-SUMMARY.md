---
phase: 05-prescription-print-urdu
plan: "02"
subsystem: ui
tags: [urdu, i18n, print, prescription, bilingual]

requires:
  - phase: 05-prescription-print-urdu
    provides: Bilingual column headers, toUrdu() helper, urdu-cell CSS class
provides:
  - buildUrduInstruction() with form-specific Urdu verbs and natural sentence patterns
  - buildDosageUrdu/buildDosageEnglish for form + quantity -> display construction
  - formatDosageDisplay() for UI display of raw quantity values
  - 5-column medication table layout (consolidated from 8)
  - Form-aware quantity picker in MedicationEntry (filtered by form category)
affects: [prescription-print, dispensary-slip, medication-entry, medication-list, visit-card]

tech-stack:
  added: []
  patterns: [form-aware dosage construction, form-specific Urdu verbs, FORM_TO_CATEGORY mapping]

key-files:
  created: []
  modified:
    - src/constants/clinical.ts
    - src/constants/translations.ts
    - src/components/PrescriptionSlip.tsx
    - src/components/DispensarySlip.tsx
    - src/components/MedicationEntry.tsx
    - src/components/MedicationList.tsx
    - src/components/VisitCard.tsx
    - src/constants/__tests__/translations.test.ts
    - src/constants/translations.test.ts

key-decisions:
  - "Separate form from dosage: dosage stores raw quantity, form inferred from drug record"
  - "Form-specific Urdu imperative verbs (لیں/لگائیں/ڈالیں/لگوائیں/استعمال کریں) based on Pakistani medical conventions"
  - "Duration postposition 'تک' (for time period) instead of 'کے لیے' (for purpose)"
  - "Always render Urdu (no null fallback); unknown quantities pass through (numbers read same in both scripts)"
  - "Form picker visible only for custom drugs; read-only when inferred from drug DB"

patterns-established:
  - "buildUrduInstruction: centralized sentence builder with form-specific verbs"
  - "QUANTITY_OPTIONS keyed by form category for filtered dropdowns"
  - "buildDosageUrdu/English: construct display from form + raw quantity"

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
- Separated form from dosage: dosage stores raw quantity, form inferred from drug DB
- Form-aware quantity picker in MedicationEntry (e.g., Tablet: ½, 1, 2, 3; Syrup: 2.5 ml, 5 ml...)
- buildDosageUrdu/English construct display from form + quantity (Tablet + "1" -> "1 گولی" / "1 tablet")
- buildUrduInstruction() with form-specific Urdu imperative verbs per Pakistani medical conventions
- Natural sentence pattern: "{dosage} {freq} {verb}، {duration} تک" (e.g., "1 گولی دن میں دو بار لیں، 7 دن تک")
- Ongoing uses continuous verbs (لیتے رہیں), special آدھی گولی for ½ tablet
- Both print slips: 5-column layout, always shows Urdu (no null fallback)
- 41 tests across 2 test files

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
- Form separated from dosage (dosage = raw quantity, form from drug record)
- Form-specific Urdu verbs based on internet research of Pakistani medical sites (usesinurdu.com, oladoc.com, MSU Urdu grammar)
- "تک" for duration (time period), not "کے لیے" (purpose)
- Always render Urdu: no null fallback, unknown values pass through

## Deviations from Plan

Significant post-execution refinement:
1. Rewrote Urdu sentence patterns: added form-specific verbs, replaced کے لیے with تک
2. Removed null fallback: always shows Urdu (numbers are script-neutral)
3. Refactored form/dosage separation: DOSAGE_OPTIONS replaced with QUANTITY_OPTIONS by category, MedicationEntry shows form picker for custom drugs

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
