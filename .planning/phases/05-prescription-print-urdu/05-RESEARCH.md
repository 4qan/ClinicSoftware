# Phase 5: Prescription Print Urdu - Research

## Current Implementation

### PrescriptionSlip.tsx (131 lines)
- Root div: `maxWidth: 148mm`, `fontFamily: 'Segoe UI', Arial, sans-serif`, `fontSize: 11pt`
- Sections: Clinic Header, Patient Info Row, Medication Table, Clinical Notes, Instructions (rxNotes), Footer
- Medication table (lines 67-98): 8 columns, plain `<table>` with Tailwind classes
- Headers: single-line English, `text-left py-1 pr-2 font-semibold text-gray-700`
- Body cells: `py-1 pr-2`, all render `med.{field}` directly (English values from DB)
- Section headers "Clinical Notes" and "Instructions" are plain `<h3>` elements

### DispensarySlip.tsx (75 lines)
- Root div: same 148mm width, `fontSize: 10pt` (smaller than prescription)
- Simpler layout: Header row with "Dispensary Slip" title + patient info, then medication table only
- Identical 8-column table structure, slightly tighter padding (`py-0.5` vs `py-1`)
- No clinical notes, no rx notes, no footer

### Shared Pattern
Both components use identical column order: # | Brand Name | Salt | Strength | Form | Dosage | Freq | Duration. Neither imports `toUrdu()` yet. No RTL handling exists.

## Translation Infrastructure

From Phase 4, ready to use in `src/constants/translations.ts`:

| Map | Entries | Covers Column |
|-----|---------|---------------|
| `dosageUrdu` | 18 | Dosage |
| `frequencyUrdu` | 17 | Freq |
| `durationUrdu` | 13 | Duration |
| `formsUrdu` | 16 | Form |

- `toUrdu(value)`: Unified lookup across all 4 maps. Returns original string if no translation found (silent fallback, no error).
- Values stored in DB are English strings matching the keys in these maps (e.g., `"1 tablet"`, `"Twice daily"`, `"7 days"`, `"Tablet"`).

## Print Layout Analysis

### CSS in `src/index.css`
- `@page { size: A5 portrait; margin: 8mm; }` -- A5 = 148mm x 210mm, usable width ~132mm
- Print hides sidebar, app header, screen-only elements
- `.prescription-slip, .dispensary-slip { max-width: none !important; }` -- removes 148mm cap in print
- `tr { break-inside: avoid; }` -- prevents row splitting across pages

### `.urdu-cell` class (already defined, unused)
```css
.urdu-cell {
  font-family: 'Noto Nastaliq Urdu Variable', serif;
  direction: rtl;
  line-height: 2.2;
  overflow: visible;
  padding-top: 4px;
  padding-bottom: 4px;
}
```
Key: `line-height: 2.2` is necessary because Nastaliq has tall ascenders/descenders. The `direction: rtl` is cell-level, not document-level, which is correct for mixed-direction tables.

### Font Loading
`main.tsx` imports `@fontsource-variable/noto-nastaliq-urdu`. Font is bundled and service-worker cached (offline-ready per URDU-03, marked complete).

### Column Width Considerations
- 132mm usable width across 8 columns. No explicit widths except `#` column (24px/20px).
- Current columns auto-size based on content. Urdu text for Form/Dosage/Freq/Duration will be wider than English equivalents.
- Longest Urdu values: "ہدایت کے مطابق لگائیں" (dosage, ~20 chars), "روزانہ ناشتے سے پہلے" (frequency, ~18 chars).
- Brand Name + Salt typically consume the most width. Urdu columns replacing short English text ("Tablet", "7 days") should not blow out the layout.

## RTL/Bidi Strategy

### Cell-Level Direction
Apply `dir="rtl"` + `.urdu-cell` class to the 4 translated columns (Form, Dosage, Freq, Duration) in `<td>` elements. This isolates RTL rendering to those cells without affecting the LTR table flow.

### Why `dir` attribute, not just CSS `direction`
The HTML `dir` attribute informs the browser's bidi algorithm at the DOM level. CSS `direction` alone doesn't always trigger proper bidi reordering for mixed content. The `.urdu-cell` class already sets `direction: rtl` via CSS, but adding `dir="rtl"` on the `<td>` is belt-and-suspenders and costs nothing.

### No `unicode-bidi: isolate` needed
Each Urdu cell contains purely Urdu text (the translation output). There's no mixed LTR/RTL within a single cell for translated columns, so `unicode-bidi` isolation is unnecessary. The fallback case (toUrdu returns English original) is LTR text in an RTL cell, but this renders fine since numbers and Latin text have "neutral" directionality.

### Header Cells
Bilingual headers (English on top, Urdu below) are LTR-dominant. The header `<th>` should remain `dir="ltr"` (default). The Urdu line within can be wrapped in a `<span dir="rtl" className="urdu-cell">` for correct rendering of the Urdu label.

## Implementation Approach

### 1. Bilingual Header Component
Create a small inline helper or stacked spans for two-line headers:
```
<th>
  <span>Brand Name</span>
  <br />
  <span dir="rtl" class="urdu-cell" style="font-size: ...">دوا</span>
</th>
```
All 7 medication columns get this treatment. `#` stays as-is.

Header Urdu labels (from 05-CONTEXT decisions):
- Brand Name / دوا
- Salt / نمک
- Strength / طاقت
- Form / شکل
- Dosage / خوراک
- Freq / تعداد
- Duration / دورانیہ

### 2. Urdu Cell Rendering (4 columns)
For Form, Dosage, Freq, Duration `<td>` elements:
```tsx
<td dir="rtl" className="urdu-cell py-1 pr-2">{toUrdu(med.form)}</td>
```
- Import `toUrdu` from `@/constants/translations`
- Apply `.urdu-cell` class for Nastaliq font + RTL + line-height
- Keep existing padding classes alongside

### 3. English-Only Columns (3 columns)
Brand Name, Salt, Strength stay as-is. No changes to their `<td>` elements.

### 4. Section Label Bilingual Treatment
"Clinical Notes" becomes "Clinical Notes / طبی نوٹس" and "Instructions" becomes "Instructions / ہدایات". Simple inline text with a `<span dir="rtl" class="urdu-cell">` for the Urdu portion.

### 5. Font Size Tuning
- Urdu Nastaliq renders visually larger than Latin at the same pt size due to script geometry.
- Prescription slip base: 11pt. Urdu cells may need ~10pt to visually balance while staying legible.
- Dispensary slip base: 10pt. Urdu cells may need ~9pt.
- Header Urdu labels: slightly smaller than English header text.
- Exact sizes: determine during implementation, test with print preview.

### 6. Dispensary Slip
Apply identical changes. Both slips share the same column structure, so the translation logic is copy-paste symmetric. Consider extracting a shared header config array to avoid duplication, but given the simplicity (static labels), inline is acceptable.

## Risks & Edge Cases

| Risk | Mitigation |
|------|------------|
| **Urdu text overflow on A5** | Nastaliq is compact horizontally. Test with max-length values. Worst case: reduce font-size or allow cell text wrapping. |
| **No translation found** | `toUrdu()` returns original English string. Cell still gets RTL direction, but Latin text in RTL cell renders fine. No visual breakage. |
| **Nastaliq line-height pushing row heights** | `line-height: 2.2` on `.urdu-cell` will increase row height. For 3-6 medication rows, this is acceptable on A5. If >6 rows, vertical space could be tight. |
| **Custom/freeform medication values** | If doctor typed a custom dosage not in the predefined list, `toUrdu()` falls back to English. This is expected and documented behavior. |
| **Browser print rendering differences** | Nastaliq rendering varies by browser. Chrome/Edge (Chromium) handle it well. Safari may need testing. Target is Chrome (most common in Pakistani clinics). |
| **Two-line headers increasing header height** | Small visual cost, but necessary for bilingual requirement. Keep Urdu label font small to minimize impact. |

## Validation Architecture

### Manual Print Preview Testing (Primary)
This phase modifies print-only output. Automated testing of print layout is impractical (no DOM assertion for printed pixels). Validation is manual:

1. **Print preview in Chrome** with sample prescription (3-5 medications covering all form types)
2. **Verify checklist:**
   - All 4 Urdu columns render in Nastaliq script
   - RTL text flows right-to-left within cells
   - English columns (Brand, Salt, Strength) unchanged
   - Bilingual headers display on both slips
   - Section labels ("Clinical Notes / طبی نوٹس") render correctly
   - No horizontal overflow or column collapse on A5
   - Fallback: untranslated value shows English original without visual breakage
3. **Edge cases to test:**
   - Prescription with 1 medication (minimal)
   - Prescription with 6+ medications (density stress test)
   - Medication with custom/freeform values (fallback rendering)
   - Empty clinical notes / rx notes (section should not appear)

### Unit Test for Translation Coverage
Optional but useful: a test asserting that every value in `src/constants/clinical.ts` predefined options has a corresponding entry in the translation maps. This catches drift if new options are added later without translations. Not blocking for this phase, but good hygiene.

### Code Review Checks
- `toUrdu()` is called only on the 4 target columns
- `dir="rtl"` is present on Urdu `<td>` and Urdu header `<span>` elements
- `.urdu-cell` class is applied to all Urdu-rendered elements
- No changes to Brand Name, Salt, Strength columns
- Patient info labels remain English-only

## RESEARCH COMPLETE
