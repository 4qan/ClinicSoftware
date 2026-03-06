---
phase: 04-urdu-foundation-font-translations
plan: "01"
subsystem: ui
tags: [fontsource, noto-nastaliq-urdu, print-css, pwa]

requires:
  - phase: none
    provides: n/a
provides:
  - Noto Nastaliq Urdu variable font loaded at app startup and SW-cached
  - .urdu-cell print CSS class for Nastaliq rendering in print slips
affects: [phase-5-prescription-print, phase-6-rx-notes-toggle]

tech-stack:
  added: ["@fontsource-variable/noto-nastaliq-urdu"]
  patterns: [fontsource-import-in-entry-point]

key-files:
  created: []
  modified:
    - package.json
    - src/main.tsx
    - src/index.css
    - src/constants/translations.test.ts

key-decisions:
  - "Used @ts-expect-error for fontsource import since CSS-only font packages have no type declarations"

requirements-completed: [URDU-03]

duration: 1 min
completed: 2026-03-06
---

# Phase 4 Plan 01: Font Installation & Print CSS Summary

**Installed Noto Nastaliq Urdu variable font with eager loading, added .urdu-cell print CSS class, and verified woff2 files are SW-precached**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-06T15:16:45Z
- **Completed:** 2026-03-06T15:18:11Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Noto Nastaliq Urdu variable font installed and imported at app startup
- `.urdu-cell` print CSS class defined with Nastaliq font, RTL direction, line-height 2.2, overflow visible
- Build confirmed 3 woff2 files in dist/assets/, SW precaches 13 entries

## Task Commits

Each task was committed atomically:

1. **Task 1: Install font package and add import** - `ef1a120` (feat)
2. **Task 2: Add .urdu-cell print CSS class** - `64a500c` (feat)
3. **Task 3: Verify build includes woff2 for SW precaching** - `eb5ba9c` (feat)

## Files Created/Modified
- `package.json` - Added @fontsource-variable/noto-nastaliq-urdu dependency
- `src/main.tsx` - Added font import before CSS import
- `src/index.css` - Added .urdu-cell class inside @media print block
- `src/constants/translations.test.ts` - Removed unused durationUrdu import (pre-existing TS error)

## Decisions Made
- Used `@ts-expect-error` for fontsource import since CSS-only font packages ship no type declarations. This is standard practice for fontsource packages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript error on fontsource import**
- **Found during:** Task 3 (build verification)
- **Issue:** `tsc` failed with TS2307 "Cannot find module" for the font package (no .d.ts shipped)
- **Fix:** Added `@ts-expect-error` comment above the import
- **Files modified:** src/main.tsx
- **Verification:** Build passes
- **Committed in:** eb5ba9c

**2. [Rule 3 - Blocking] Pre-existing unused import in translations.test.ts**
- **Found during:** Task 3 (build verification)
- **Issue:** `durationUrdu` imported but never used, causing TS6133
- **Fix:** Removed the unused import
- **Files modified:** src/constants/translations.test.ts
- **Verification:** Build passes
- **Committed in:** eb5ba9c

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for successful build. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Font and print CSS ready for Phase 5 (Prescription Print Urdu) consumption
- .urdu-cell class available for applying Nastaliq rendering to print table cells

---
*Phase: 04-urdu-foundation-font-translations*
*Completed: 2026-03-06*
