---
phase: 18-unified-medication-management
plan: 02
subsystem: ui
tags: [react, dexie, tailwind, medications, crud]

requires:
  - phase: 18-01
    provides: getAllDrugsUnfiltered, updateDrug, deleteDrug, addCustomDrug, toggleDrugActive, resetDrugToDefault, Drug interface with isOverridden

provides:
  - MedicationsPage at /medications with full CRUD table
  - MedicationModal for add/edit
  - Sidebar Medications nav item
  - Settings page link to Medications page (DrugManagement removed)

affects: [prescription-entry, drug-search, settings-navigation]

tech-stack:
  added: []
  patterns:
    - Inline row-level confirm (delete/reset) without modal; avoids double-modal UX
    - Filter pills + search combined client-side on pre-loaded list
    - seedKey field for stable identity of predefined drugs across UUID-migrated records

key-files:
  created:
    - src/components/MedicationModal.tsx
    - src/pages/MedicationsPage.tsx
  modified:
    - src/components/Sidebar.tsx
    - src/App.tsx
    - src/pages/SettingsPage.tsx
    - src/db/drugs.ts
  deleted:
    - src/components/DrugManagement.tsx

key-decisions:
  - "Inline row confirm for delete/reset keeps UX simple; no secondary modal needed for destructive actions in a table"
  - "Medications nav item uses a pill/beaker-shaped Heroicons path for visual distinction"
  - "Settings page shows a persistent blue banner linking to /medications (not a tab)"
  - "resetDrugToDefault uses seedKey field with partial-match fallback to handle legacy UUID-based records that predate buildSeedId"

requirements-completed: [MED-01, MED-02, MED-03, MED-08]

duration: 20min
completed: 2026-03-19
---

# Phase 18 Plan 02: Unified Medication Management UI Summary

**Dedicated /medications page with searchable/filterable table, modal CRUD, override tracking, and sidebar navigation replacing the old Settings-embedded DrugManagement component**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-19
- **Completed:** 2026-03-19
- **Tasks:** 3 of 3
- **Files modified:** 6 (2 created, 3 modified, 1 deleted) + db/drugs.ts bug fix

## Accomplishments
- Full MedicationsPage with table showing all ~156 drugs, search by brand/salt, filter pills (All/Predefined/Custom/Disabled)
- Inline row-level confirmation for delete and reset actions (no extra modal)
- MedicationModal for add/edit with ComboBox for form selection and validation
- Sidebar Medications item between Patients and Settings
- SettingsPage medications tab removed; replaced with persistent link banner
- Bug fix: reset-to-default now works correctly for legacy UUID-based drug records via seedKey + partial-match fallback

## Task Commits

1. **Task 1: Create MedicationModal and MedicationsPage** - `2c82032` (feat)
2. **Task 2: Wire routing, sidebar, and clean up Settings** - `fbc1415` (feat)
3. **Bug fix: reset-to-default for legacy UUID drug records** - `cc60e7e` (fix)

## Files Created/Modified
- `src/components/MedicationModal.tsx` - Add/edit modal with brand, salt, form (ComboBox), strength
- `src/pages/MedicationsPage.tsx` - Full medications management page with table, search, filters, CRUD
- `src/components/Sidebar.tsx` - Added Medications nav item between Patients and Settings
- `src/App.tsx` - Added /medications route
- `src/pages/SettingsPage.tsx` - Removed medications tab, added /medications link banner
- `src/components/DrugManagement.tsx` - Deleted (fully replaced by MedicationsPage)
- `src/db/drugs.ts` - Fixed resetDrugToDefault to handle legacy UUID records with seedKey + partial-match fallback

## Decisions Made
- Inline row confirm for delete/reset: avoids double-modal pattern, keeps the table self-contained
- Medications nav uses a beaker/pill SVG from Heroicons outline style, consistent with existing icons
- Settings page shows a persistent blue info banner (always visible, not tab-gated) so it's impossible to miss
- resetDrugToDefault: legacy records seeded before buildSeedId existed stored random UUIDs as their id; fix uses a seedKey field where present, otherwise falls back to partial-match on brand+salt+form to identify the correct seed entry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed reset-to-default failure for legacy UUID-based drug records**
- **Found during:** Task 3 checkpoint verification (user reported reset did not work)
- **Issue:** buildSeedId generates deterministic IDs from drug fields, but existing predefined records in the DB were seeded with random UUIDs (generated before the id-stabilization logic existed). resetDrugToDefault compared the stored id against buildSeedId output, which never matched for those legacy records, so reset silently failed.
- **Fix:** Added a `seedKey` field to the Drug interface (set during seeding), and updated resetDrugToDefault to first look up by seedKey, then fall back to partial brand+salt+form match against the seed list if seedKey is absent.
- **Files modified:** src/db/drugs.ts
- **Verification:** User verified reset-to-default reverts values correctly after the fix
- **Committed in:** cc60e7e

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Essential for correctness of the reset feature. No scope creep.

## Issues Encountered

The reset-to-default flow failed silently during human verification because legacy predefined drug records in IndexedDB had random UUID ids from an earlier seeding pass, while the reset logic expected deterministic ids generated by buildSeedId. Fixed via seedKey field and partial-match fallback in the CRUD layer (see Deviations above).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full medications page is live and verified end-to-end
- All CRUD operations confirmed working: add, edit, disable/enable, delete, reset-to-default
- Settings page correctly links to /medications with no medications tab
- Ready for Phase 17 (Visit Vitals) or any dependent phase

---
*Phase: 18-unified-medication-management*
*Completed: 2026-03-19*
