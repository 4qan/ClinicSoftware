---
phase: 04-urdu-foundation-font-translations
plan: "02"
subsystem: ui
tags: [urdu, translations, i18n, clinical]

requires:
  - phase: none
    provides: n/a
provides:
  - "toUrdu() helper for English-to-Urdu clinical value translation"
  - "Translation maps for dosage, frequency, duration, medication forms (64 values)"
affects: [phase-5-prescription-print, phase-6-rx-notes]

tech-stack:
  added: []
  patterns: ["Record<string, string> translation maps with unified lookup", "Silent English fallback for unknown values"]

key-files:
  created:
    - src/constants/translations.ts
    - src/constants/translations.test.ts
  modified: []

key-decisions:
  - "Shared 'As needed' translation lives in frequencyUrdu, omitted from durationUrdu to avoid duplication; merged allTranslations resolves both contexts"

patterns-established:
  - "Translation map pattern: category-specific exports + unified toUrdu() lookup with nullish coalescing fallback"

requirements-completed: [URDU-01]

duration: 1 min
completed: 2026-03-06
---

# Phase 4 Plan 02: Translation Maps & toUrdu() Summary

**64 English-to-Urdu clinical translation mappings (dosage, frequency, duration, forms) with toUrdu() fallback helper and 13 comprehensive tests**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-06T15:16:51Z
- **Completed:** 2026-03-06T15:17:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created translation maps covering all 64 predefined clinical values across 4 categories
- Built toUrdu() helper with silent English fallback for unknown/custom values
- 13 tests validating completeness, correctness, fallback behavior, and no-leak guarantee

## Task Commits

Each task was committed atomically:

1. **Task 1: Create translations.ts with all 64 Urdu mappings** - `a5d3d62` (feat)
2. **Task 2: Write tests for translation completeness, correctness, and fallback** - `41c78ca` (test)

## Files Created/Modified
- `src/constants/translations.ts` - Translation maps (dosageUrdu, frequencyUrdu, durationUrdu, formsUrdu) and toUrdu() helper
- `src/constants/translations.test.ts` - 13 tests covering completeness, spot checks, fallback, and no-leak validation

## Decisions Made
- "As needed" translation lives in frequencyUrdu only; the merged allTranslations object resolves it for both frequency and duration contexts without duplication.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Translation infrastructure complete, ready for Phase 5 (Prescription Print Urdu) and Phase 6 (Rx Notes Toggle) to consume toUrdu()
- Check if plan 04-01 (font setup) is also complete before advancing to Phase 5

---
*Phase: 04-urdu-foundation-font-translations*
*Completed: 2026-03-06*
