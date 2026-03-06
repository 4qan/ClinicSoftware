# Plan: Show Full Drug Details After Selection

## Problem
In `MedicationEntry.tsx`, `handleSelectDrug` sets `drugQuery` to `drug.brandName` only (line 57). The dropdown uses `formatDrugDisplay()` which shows the full compound label, but once selected the input reverts to just the brand name.

## Fix

### Task 1: Use formatDrugDisplay in handleSelectDrug

**File:** `src/components/MedicationEntry.tsx`

Change line 57 from:
```ts
setDrugQuery(drug.brandName)
```
to:
```ts
setDrugQuery(formatDrugDisplay(drug))
```

This reuses the existing `formatDrugDisplay()` helper (line 89) that already produces the `"Brufen (Ibuprofen 200mg Tablet)"` format for the dropdown.

**Edge case:** When the user clears the input and retypes, `handleDrugQueryChange` (line 50-54) already resets `saltName`, `form`, `strength`, and `drugId`, so partial edits after selection correctly discard the old compound data.

### Task 2: Update handleDrugQueryChange to reset drugQuery cleanly

No change needed. The existing `handleDrugQueryChange` replaces `drugQuery` with whatever the user types, so editing after selection works correctly. The `brandName` in form state tracks the raw typed value (used for custom drugs), while `drugQuery` is display-only for the input.

**Estimated scope:** 1 line change. No new files, no new dependencies.
