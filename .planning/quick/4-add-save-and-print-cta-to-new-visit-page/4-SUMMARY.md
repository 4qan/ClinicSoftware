# Quick Task 4: Summary

## Result
Added "Save & Print" CTA to both NewVisitPage and EditVisitPage.

## Changes

### `src/pages/NewVisitPage.tsx`
- Extracted shared `saveVisit()` helper returning the visit ID
- Added `handleSaveAndPrint()` that saves then navigates to `/visit/:id/print`
- Restyled action bar: Cancel (text), Save Visit (outline), Save & Print (primary blue)

### `src/pages/EditVisitPage.tsx`
- Extracted shared `saveVisit()` helper returning success boolean
- Added `handleSaveAndPrint()` that saves then navigates to `/visit/:id/print`
- Restyled right-side action bar: Cancel (text), Save Changes (outline), Save & Print (primary blue)
- Delete button remains on the left side, unchanged

## Commit
- `3aee6f0` feat: add Save & Print CTA to visit pages
