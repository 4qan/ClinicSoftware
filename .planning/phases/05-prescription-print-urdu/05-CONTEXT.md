# Phase 5: Prescription Print Urdu - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Modify PrescriptionSlip.tsx and DispensarySlip.tsx to render dosage, frequency, duration, and form in Urdu with correct RTL handling. Add bilingual column headers. Ensure mixed LTR/RTL content coexists without layout breakage on A5 print. This phase does NOT touch Rx Notes (Phase 6) or add any new UI controls.

</domain>

<decisions>
## Implementation Decisions

### Urdu column scope
- Translate 4 columns to Urdu: Form, Dosage, Frequency, Duration (all have translation maps from Phase 4)
- Brand Name, Salt, and Strength columns stay in English
- # column stays as-is

### Column headers
- Bilingual headers: English on top, Urdu below (two-line headers)
- All 7 medication columns get bilingual treatment (Brand Name/دوا, Salt/نمک, Strength/طاقت, Form/شکل, Dosage/خوراک, Freq/تعداد, Duration/دورانیہ)
- # column header stays as '#' only

### Dispensary slip
- Same full Urdu treatment as prescription slip (bilingual headers, Urdu columns)
- "Dispensary Slip" title stays in English
- Patient info labels (Patient, ID, Date) stay in English on both slips

### Section labels
- "Clinical Notes" and "Instructions" section headers on prescription slip get bilingual treatment (e.g., "Clinical Notes / طبی نوٹس", "Instructions / ہدایات")
- Patient info row labels (Patient, ID, Age/Gender, Date) stay English only

### Font sizing and layout
- Keep all 8 columns, do not drop any
- Keep current column order: # | Brand | Salt | Strength | Form | Dosage | Freq | Duration
- Urdu text is the primary readable content for the patient, must be at least as legible as English
- Adjust font sizes as needed to fit A5, but never sacrifice Urdu legibility
- Font change only for Urdu cells (Nastaliq + RTL), no extra background tint or visual distinction

### Claude's Discretion
- Exact font sizes for English vs Urdu to optimize A5 fit
- Cell padding adjustments for Nastaliq script height
- How to implement two-line bilingual headers (stacked spans, flexbox, etc.)
- Logical property replacements for text-left/text-right
- unicode-bidi and dir attribute placement strategy

</decisions>

<specifics>
## Specific Ideas

- Urdu is the primary language for the patient reading the prescription; English drug names are secondary context
- Typical prescription has 3-6 medications, so fitting on A5 is feasible with font size adjustments
- Pakistani medical practice: English drug names + Urdu dosage instructions matches how doctors verbally instruct patients (carried from Phase 4)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/constants/translations.ts`: All 4 translation maps (dosageUrdu, frequencyUrdu, durationUrdu, formsUrdu) + `toUrdu()` helper ready to use
- `.urdu-cell` CSS class: Print-only styling with Nastaliq font, line-height ~2.2, generous padding (from Phase 4)

### Established Patterns
- Print components use inline styles + Tailwind classes
- Font set via `style={{ fontFamily: ... }}` on root div
- A5 print layout via @media print + @page (browser-native)
- Both slips share identical table structure (8 columns, same order)

### Integration Points
- `src/components/PrescriptionSlip.tsx`: Main print component, 131 lines, medication table at lines 67-98
- `src/components/DispensarySlip.tsx`: Dispensary print component, 75 lines, medication table at lines 42-70
- `toUrdu()` import from `@/constants/translations`
- `.urdu-cell` class from global print styles

</code_context>

<deferred>
## Deferred Ideas

None. Discussion stayed within phase scope.

</deferred>

---

*Phase: 05-prescription-print-urdu*
*Context gathered: 2026-03-06*
