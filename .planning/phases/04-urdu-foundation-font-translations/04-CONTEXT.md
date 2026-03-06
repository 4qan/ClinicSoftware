# Phase 4: Urdu Foundation (Font + Translations) - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Install and configure Nastaliq font for offline use. Build English-to-Urdu translation maps for dosage, frequency, duration, and medication form values. Export a `toUrdu()` helper. This phase does NOT modify print components (Phase 5) or the Rx Notes field (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Translation style
- Patient-friendly, colloquial Urdu that any patient can understand
- Natural Urdu phrasing for compound instructions (e.g., "روزانہ ایک بار ناشتے سے پہلے"), not literal word-for-word mapping
- Western numerals (1, 2, 3) in Urdu text, not Urdu numerals
- Claude generates translations with best effort accuracy; no manual review step planned

### Translation scope
- Translate all 4 categories: dosage (16), frequency (17), duration (13), medication forms (16) = ~62 entries
- Strength values (500mg, 250mg/5ml) stay as-is, universal medical notation
- Drug names and salt names always English (standard Pakistani medical practice)
- Single `translations.ts` file with separate named exports per category: `dosageUrdu`, `frequencyUrdu`, `durationUrdu`, `formsUrdu`

### Untranslated value handling
- Silent English fallback for any value without a mapping (no visual indicator)
- All dosage/frequency/duration values come from predefined dropdowns (even for custom medications), so all will have Urdu mappings
- Only medication name and salt name are free-text, and those stay in English by design

### Font and rendering
- Readability over density: line-height ~2.2 with generous padding for Nastaliq diacritics
- Urdu styling (.urdu-cell) applies in @media print only, not on-screen UI
- Eager font loading: import in app entry point, always cached and ready
- font-display: swap for graceful loading

### Claude's Discretion
- Exact line-height value within 2.0-2.4 range (test what renders cleanly)
- Vertical padding amounts on .urdu-cell
- Font weight selection from variable font
- toUrdu() implementation details (case handling, lookup approach)

</decisions>

<specifics>
## Specific Ideas

- Prescriptions in Pakistani clinics use English drug names with Urdu dosage instructions, matching how doctors verbally instruct patients
- Typical prescription has 3-6 medications, so readability is more important than fitting 10+ rows
- Custom medications still use dropdown for dosage/frequency/duration, only the name/salt are free-text

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/constants/clinical.ts`: All 4 value arrays (DOSAGE_OPTIONS, FREQUENCY_OPTIONS, DURATION_OPTIONS, MEDICATION_FORMS) that need translation maps
- VitePWA config already includes `woff2` in globPatterns, so font caching works automatically

### Established Patterns
- Constants live in `src/constants/` directory
- Print components use inline styles + Tailwind, font set via `style={{ fontFamily: ... }}`
- A5 print layout via @media print + @page (browser-native, no print library)

### Integration Points
- `src/main.tsx` or `src/App.tsx`: Font import entry point
- `src/constants/translations.ts`: New file, same directory as clinical.ts
- `.urdu-cell` CSS class: Add to global print styles (likely `src/index.css` or equivalent)
- `toUrdu()` export: Will be consumed by PrescriptionSlip.tsx and DispensarySlip.tsx in Phase 5

</code_context>

<deferred>
## Deferred Ideas

None. Discussion stayed within phase scope.

</deferred>

---

*Phase: 04-urdu-foundation-font-translations*
*Context gathered: 2026-03-06*
