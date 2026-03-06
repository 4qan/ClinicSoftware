# Summary: Show Full Drug Details After Selection

## What Changed
- `src/components/MedicationEntry.tsx` line 57: replaced `setDrugQuery(drug.brandName)` with `setDrugQuery(formatDrugDisplay(drug))`

## Result
After selecting a drug from the autocomplete dropdown, the input now shows the full compound label (e.g., "Brufen (Ibuprofen 200mg Tablet)") instead of just the brand name.

## Commit
`0870962` on `main`

## Scope
1 line changed. No new files, no new dependencies.
