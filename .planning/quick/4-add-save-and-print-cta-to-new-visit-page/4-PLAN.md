# Quick Plan 4: Add "Save & Print" CTA to Visit Pages

## Context
Currently NewVisitPage and EditVisitPage only have "Save Visit"/"Save Changes" (primary) and "Cancel" buttons. The doctor's most common flow is save then immediately print, so "Save & Print" should be the primary action.

## Key Facts
- Print route: `/visit/:id/print`
- `createVisit()` returns the visit (need to confirm return type for visit ID)
- `updateVisit()` uses existing `visitId` from params
- NewVisitPage action bar: lines 331-352
- EditVisitPage action bar: lines 199-228

## Tasks

### Task 1: Add `handleSaveAndPrint` to both pages, restyle buttons
**Files:** `src/pages/NewVisitPage.tsx`, `src/pages/EditVisitPage.tsx`

**NewVisitPage changes:**
1. Add `handleSaveAndPrint()`: same as `handleSave()` but navigates to `/visit/${visitId}/print` instead of patient page. Need `createVisit` to return the visit ID.
2. Restyle action bar (3 buttons, right-aligned):
   - Cancel: text/link style (no border, just text)
   - Save Visit: secondary (outline style, border-gray-300, text-gray-700)
   - Save & Print: primary (filled blue, bg-blue-600)

**EditVisitPage changes:**
1. Add `handleSaveAndPrint()`: same as `handleSave()` but navigates to `/visit/${visitId}/print`
2. Restyle action bar (keep Delete on left, right side gets 3 buttons):
   - Cancel: text/link style
   - Save Changes: secondary (outline)
   - Save & Print: primary (filled blue)

**Verify:** Check `createVisit` return type in `src/db/visits.ts` to get visit ID for navigation.
