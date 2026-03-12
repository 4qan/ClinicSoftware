# Phase 11: Layout Scaling & Preview - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Prescription and dispensary slip content fills the selected paper size proportionally, including correct Urdu rendering, with an on-screen preview before printing. Paper size infrastructure (settings, @page injection, conditional rendering) was delivered in Phase 10.

</domain>

<decisions>
## Implementation Decisions

### A6 removal
- Drop A6 from both slips entirely (prescription and dispensary)
- Remove from `PAPER_SIZE_ORDER`, `PAPER_SIZES` constant, and Settings dropdowns
- If a saved setting reads A6 from IndexedDB, fall back to A5
- Remaining sizes: A5, A4, Letter

### Preview experience
- Scaled page frame: slip renders inside a bordered rectangle matching paper proportions
- A5 preview is physically smaller on screen than A4 (represents actual paper size difference)
- Replaces current slip area (no modal, no new page)
- Tab toggle and print button stay above the preview frame
- Live data: preview shows actual visit content (patient, medications, clinic info)
- Paper size changes only from Settings > Print tab (badge stays informational, consistent with Phase 10)

### Scaling behavior
- Uniform proportional scaling: fonts, spacing, padding all scale by the same ratio relative to A5 baseline
- A5 is the baseline (current hardcoded values: prescription 11pt base/14pt header, dispensary 10pt base)
- A4/Letter: everything scales up proportionally (doctor name, patient info, table, notes)
- No caps on header font size (uniform scaling applies to everything)

### Dispensary slip density
- Claude's discretion: pick what reads well at each size
- Dispensary is intentionally compact relative to prescription; preserve or relax that distinction as appropriate

### Urdu/Nastaliq rendering
- Per-size line-height tuning: each paper size gets its own Urdu line-height value
- Urdu text must never clip at any supported paper size (non-negotiable)
- Same scaling for medication instruction column and Rx Notes section (both use .urdu-cell)
- Values determined by empirical testing of actual print output

### Rollback safety
- No database schema changes in Phase 10 or 11 (settings are additive key-value pairs)
- Git revert restores hardcoded A5 behavior; orphaned print settings in IndexedDB are harmless
- Noted as user concern: clean rollback to fixed-A5 world must remain possible

### Claude's Discretion
- CSS scaling technique (custom properties, calc(), transform, or class-based)
- Dispensary slip density relative to prescription at each size
- Exact per-size Urdu line-height values (determined by testing)
- Preview frame styling (shadow, border, background)
- Scale ratio formula (area-based, width-based, or other)

</decisions>

<specifics>
## Specific Ideas

- "Things should not absurdly look off or start breaking" on larger sizes
- Scaling up should be straightforward (more space = easier)
- Doctor wants confidence that this won't break printing; rollback must be simple

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PAPER_SIZES` constant in `db/printSettings.ts`: dimensions per size, used for @page injection and can drive scale ratios
- `calcMargin()` in `db/printSettings.ts`: already implements area-based proportional scaling (A5 baseline), pattern reusable for font scaling
- `injectPageStyle()` in `PrintVisitPage.tsx`: dynamic @page CSS injection, can be extended for scaled styles
- Preview tab toggle already exists in `PrintVisitPage.tsx` (prescription/dispensary switcher)

### Established Patterns
- Print CSS in `index.css` with `@media print` block; `.prescription-slip, .dispensary-slip { max-width: none !important; }` already removes width constraints for print
- Both slips use inline `style={{ fontSize: 'Xpt' }}` for font sizes (will need to become dynamic)
- `.urdu-cell` class in index.css handles Nastaliq with fixed `line-height: 2.2` (needs per-size values)
- Slip components receive data as props (visit, medications, patient, clinicInfo); no internal data fetching

### Integration Points
- `PrintVisitPage.tsx`: Wrap slip components in a proportional page frame for preview; pass paper size to slips for scaling
- `PrescriptionSlip.tsx`: Accept paper size prop, apply scaled font sizes/spacing
- `DispensarySlip.tsx`: Accept paper size prop, apply scaled font sizes/spacing
- `db/printSettings.ts`: Remove A6 from constants, add A6 fallback logic in `getPrintSettings()`
- `index.css`: Make `.urdu-cell` line-height dynamic or add per-size variants
- `PrintSettings.tsx`: Update dropdown to exclude A6

</code_context>

<deferred>
## Deferred Ideas

- Custom paper dimensions input (width/height in mm) for non-standard paper (PRSET-05, future requirement)
- If custom sizes are added, scaling formula needs to handle arbitrary dimensions (continuous function, not just 3 presets)

</deferred>

---

*Phase: 11-layout-scaling-preview*
*Context gathered: 2026-03-12*
