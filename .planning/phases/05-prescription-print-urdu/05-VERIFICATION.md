---
phase: 05
status: human_needed
verified_at: 2026-03-06
must_haves_verified: 6/6
---

# Phase 05 Verification: Prescription Print Urdu

## Must-Haves Verification

1. **Form, Dosage, Frequency, Duration columns render Urdu text (Nastaliq script) on both print slips**
   - Status: PASS
   - Evidence: `PrescriptionSlip.tsx` lines 89-92 wrap Form/Dosage/Frequency/Duration with `toUrdu()` and apply `urdu-cell` class + `dir="rtl"`. `DispensarySlip.tsx` lines 63-66 do the same.

2. **All 7 medication column headers display bilingual labels (English on top, Urdu below)**
   - Status: PASS
   - Evidence: Both slips map over `['Brand Name', 'Salt', 'Strength', 'Form', 'Dosage', 'Freq', 'Duration']` and render `{col}<br /><span dir="rtl" className="urdu-cell">{columnHeadersUrdu[col]}</span>` in each `<th>`. PrescriptionSlip uses 9pt, DispensarySlip uses 8pt for Urdu labels.

3. **RTL text in Urdu cells coexists with LTR English drug names without layout breakage**
   - Status: PASS
   - Evidence: Urdu cells use `dir="rtl"` attribute. English cells (brandName, saltName, strength) have no RTL attributes. `urdu-cell` CSS class (from Phase 4) handles Nastaliq font rendering. Structural separation prevents overlap.

4. **"Clinical Notes" and "Instructions" section headers on prescription slip show bilingual labels**
   - Status: PASS
   - Evidence: `PrescriptionSlip.tsx` line 103 renders `Clinical Notes / <span dir="rtl" className="urdu-cell">{sectionHeadersUrdu['Clinical Notes']}</span>`. Line 111 renders `Instructions / <span dir="rtl" className="urdu-cell">{sectionHeadersUrdu['Instructions']}</span>`. Labels sourced from `sectionHeadersUrdu` in translations.ts.

5. **Brand Name, Salt, Strength columns remain English-only**
   - Status: PASS
   - Evidence: `PrescriptionSlip.tsx` lines 86-88 render `med.brandName`, `med.saltName`, `med.strength` directly without `toUrdu()` or RTL attributes. Same pattern in `DispensarySlip.tsx` lines 60-62.

6. **Fallback: untranslated values render as original English without visual breakage**
   - Status: PASS
   - Evidence: `toUrdu()` returns `allTranslations[value] ?? value` (translations.ts line 117). Test confirms: `toUrdu('SomeCustomValue') === 'SomeCustomValue'` (translations.test.ts line 32).

## Requirements Traceability

| Requirement | Description | Implementation | Status |
|-------------|-------------|----------------|--------|
| URDU-02 | Printed prescription slip shows dosage, frequency, duration in Urdu (Nastaliq script) | `PrescriptionSlip.tsx` wraps dosage/frequency/duration/form cells with `toUrdu()` + `urdu-cell` class. `DispensarySlip.tsx` mirrors this. | PASS |
| URDU-04 | RTL text renders correctly in prescription print layout with mixed LTR/RTL content | Urdu cells use `dir="rtl"` attribute + `urdu-cell` class. English cells remain default LTR. No shared containers force a single direction. | PASS |
| URDU-05 | Printed prescription column headers display in Urdu | All 7 medication columns have bilingual headers via `columnHeadersUrdu` lookup. Section headers use `sectionHeadersUrdu`. Both maps defined in `translations.ts`. | PASS |

## Test Results

- Translation coverage tests: 5/5 passed (all predefined clinical options have Urdu translations, fallback works)
- Failing tests (`login.test.tsx`): Pre-existing, unrelated to phase 05

## Human Verification

The following items require manual testing in Chrome print preview:

- [ ] Nastaliq Urdu renders in Form/Dosage/Freq/Duration columns on prescription slip
- [ ] Nastaliq Urdu renders in Form/Dosage/Freq/Duration columns on dispensary slip
- [ ] Bilingual headers visible on all 7 medication columns (both slips)
- [ ] English drug names (Brand, Salt, Strength) remain left-aligned, no overlap with RTL text
- [ ] "Clinical Notes / طبی نوٹس" and "Instructions / ہدایات" render correctly
- [ ] Custom/freeform medication values fall back to English without breakage
- [ ] A5 print layout accommodates 6 medications without overflow

## Summary

All 6 must-haves verified against source code. All 3 requirement IDs (URDU-02, URDU-04, URDU-05) are fully implemented. Translation coverage tests pass. Status is `human_needed` because print layout rendering requires manual Chrome print preview verification.
