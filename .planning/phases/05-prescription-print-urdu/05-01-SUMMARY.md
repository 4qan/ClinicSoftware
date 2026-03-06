---
phase: 05-prescription-print-urdu
plan: "01"
subsystem: ui
tags: [urdu, rtl, nastaliq, print, i18n]

requires:
  - phase: 04-urdu-foundation
    provides: toUrdu() helper, .urdu-cell CSS class, Nastaliq font
provides:
  - Bilingual (English + Urdu) medication column headers on both print slips
  - Urdu rendering of Form, Dosage, Frequency, Duration in print table cells
  - Bilingual section labels (Clinical Notes, Instructions) on prescription slip
  - Translation coverage test catching drift when clinical options change
affects: [06-rx-notes-urdu-toggle]

tech-stack:
  added: []
  patterns:
    - "Bilingual table headers via columnHeadersUrdu record + .map() rendering"
    - "toUrdu() wrapper on RTL cells with dir='rtl' and urdu-cell class"

key-files:
  created:
    - src/constants/__tests__/translations.test.ts
  modified:
    - src/constants/translations.ts
    - src/components/PrescriptionSlip.tsx
    - src/components/DispensarySlip.tsx

key-decisions:
  - "Used .map() over column name array for DRY bilingual header rendering instead of 7 individual <th> elements"
  - "Urdu header font size: 9pt for prescription (11pt base), 8pt for dispensary (10pt base)"

patterns-established:
  - "Bilingual header pattern: English text + <br /> + <span dir='rtl' className='urdu-cell'> for table headers"

requirements-completed: [URDU-02, URDU-04, URDU-05]

duration: 2 min
completed: 2026-03-06
---

# Phase 5 Plan 01: Urdu Columns, Bilingual Headers & Section Labels Summary

**Bilingual English/Urdu column headers on both print slips, Urdu rendering in Form/Dosage/Freq/Duration cells via toUrdu(), and translation coverage test**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T15:41:34Z
- **Completed:** 2026-03-06T15:43:53Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- All 7 medication column headers display bilingual labels (English + Urdu Nastaliq) on both PrescriptionSlip and DispensarySlip
- Form, Dosage, Frequency, Duration cells render Urdu text with RTL direction on both slips
- Clinical Notes and Instructions section headers show bilingual labels on prescription slip
- Translation coverage test ensures every predefined clinical option has a non-passthrough Urdu translation (catches drift)

## Task Commits

Each task was committed atomically:

1. **Task 3: Add Urdu header labels to translations.ts** - `d291724` (feat)
2. **Task 1: Add Urdu columns to PrescriptionSlip** - `b898cad` (feat)
3. **Task 2: Add Urdu columns to DispensarySlip** - `26a6d49` (feat)
4. **Task 4: Translation coverage test** - `545cb8b` (test)

## Files Created/Modified
- `src/constants/translations.ts` - Added columnHeadersUrdu and sectionHeadersUrdu record exports
- `src/components/PrescriptionSlip.tsx` - Bilingual headers, Urdu cells, bilingual section labels
- `src/components/DispensarySlip.tsx` - Bilingual headers, Urdu cells
- `src/constants/__tests__/translations.test.ts` - 5 tests covering all clinical option translations + fallback

## Decisions Made
- Executed task 03 (translations.ts) first since tasks 01 and 02 depend on its exports
- Used .map() over column array for DRY header rendering instead of 7 individual `<th>` elements
- Urdu header font: 9pt on prescription slip (base 11pt), 8pt on dispensary slip (base 10pt)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 complete (1/1 plans), ready for Phase 6 (Rx Notes Urdu Toggle)
- Brand Name, Salt, Strength remain English-only as specified
- Fallback behavior verified: unknown values pass through as original English

---
*Phase: 05-prescription-print-urdu*
*Completed: 2026-03-06*
