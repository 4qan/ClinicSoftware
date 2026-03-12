# Phase 11: Layout Scaling & Preview - Research

**Researched:** 2026-03-12
**Domain:** CSS proportional scaling, Urdu/Nastaliq rendering, on-screen print preview
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Drop A6 from both slips entirely (prescription and dispensary)
- Remove A6 from `PAPER_SIZE_ORDER`, `PAPER_SIZES` constant, and Settings dropdowns
- If a saved setting reads A6 from IndexedDB, fall back to A5
- Remaining sizes: A5, A4, Letter
- Scaled page frame: slip renders inside a bordered rectangle matching paper proportions
- A5 preview is physically smaller on screen than A4 (represents actual paper size difference)
- Preview replaces current slip area (no modal, no new page)
- Tab toggle and print button stay above the preview frame
- Live data: preview shows actual visit content (patient, medications, clinic info)
- Paper size changes only from Settings > Print tab (badge stays informational)
- Uniform proportional scaling: fonts, spacing, padding all scale by the same ratio relative to A5 baseline
- A5 is the baseline (prescription: 11pt base / 14pt header, dispensary: 10pt base)
- A4/Letter: everything scales up proportionally (doctor name, patient info, table, notes)
- No caps on header font size (uniform scaling applies to everything)
- Per-size line-height tuning: each paper size gets its own Urdu line-height value
- Urdu text must never clip at any supported paper size (non-negotiable)
- Same scaling for medication instruction column and Rx Notes section (both use .urdu-cell)
- Values determined by empirical testing of actual print output

### Claude's Discretion
- CSS scaling technique (custom properties, calc(), transform, or class-based)
- Dispensary slip density relative to prescription at each size
- Exact per-size Urdu line-height values (determined by testing)
- Preview frame styling (shadow, border, background)
- Scale ratio formula (area-based, width-based, or other)

### Deferred Ideas (OUT OF SCOPE)
- Custom paper dimensions input (width/height in mm) for non-standard paper (PRSET-05)
- If custom sizes are added, scaling formula needs to handle arbitrary dimensions
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCALE-01 | Prescription slip fonts, spacing, and content area scale proportionally to fill the selected paper size | calcMargin() width-ratio pattern reusable; CSS custom properties pass computed values to components |
| SCALE-02 | Dispensary slip fonts, spacing, and content area scale proportionally to fill the selected paper size | Same mechanism as SCALE-01; dispensary baseline is 10pt |
| SCALE-03 | Urdu/Nastaliq text renders correctly at all supported paper sizes (line-height tuned per size) | Per-size constants table; `.urdu-cell` already in index.css, needs dynamic override |
| SCALE-04 | On-screen print preview reflects the selected paper size proportions before printing | Container div sized in mm-equivalent px with overflow:hidden; slip rendered at natural scale inside |
</phase_requirements>

---

## Summary

Phase 10 delivered paper size selection, @page injection, and proportional margins. Phase 11 makes the slip content respond to that size selection: fonts and spacing grow/shrink with the paper, Urdu line-heights are tuned per size, and the on-screen preview shows a scaled page frame.

The implementation is self-contained within the existing component tree. No new libraries are needed. The recommended approach uses CSS custom properties (`--slip-font-base`, `--slip-font-header`) passed as inline styles to slip components, driven by a `calcScale()` function analogous to the existing `calcMargin()`. The preview frame is a fixed-size container div whose dimensions are derived from the PAPER_SIZES constants, with the slip rendered inside at 1:1 scale (no CSS `transform: scale()` needed -- the frame just crops to paper proportions and sizes in screen pixels proportional to actual mm dimensions).

The A6 removal is a cleanup task: delete the entry from `PAPER_SIZES`, `PAPER_SIZE_ORDER`, and `PaperSize` type, and add a fallback in `getPrintSettings()` to coerce a stored `'A6'` value to `'A5'`.

**Primary recommendation:** Width-ratio scaling from A5 baseline using CSS custom properties; per-size Urdu line-height lookup table; preview frame sized as `width * PREVIEW_SCALE_FACTOR` px.

---

## Standard Stack

No new libraries. Everything is already in the project.

### Core (already installed)
| Library | Purpose | Notes |
|---------|---------|-------|
| React 19 + TypeScript | Component props carry `paperSize`, computed scale values as inline styles | No change |
| TailwindCSS v4 | Layout utilities; scaling values use inline `style={}` not Tailwind classes | Per-project pattern |
| Dexie.js | `getPrintSettings()` reads sizes; A6 fallback added here | Existing |

### No additions required
This phase is pure logic + CSS. No npm installs.

---

## Architecture Patterns

### Recommended Project Structure (changes only)
```
src/
├── db/
│   └── printSettings.ts     # Remove A6, add calcScale(), A6 fallback in getPrintSettings()
├── components/
│   ├── PrescriptionSlip.tsx  # Accept paperSize prop, apply scaled inline styles
│   ├── DispensarySlip.tsx    # Accept paperSize prop, apply scaled inline styles
│   └── PrintSettings.tsx     # Remove A6 from dropdown (PAPER_SIZE_ORDER drives it automatically)
├── pages/
│   └── PrintVisitPage.tsx    # Wrap slip in preview frame; pass paperSize to slips
└── index.css                  # .urdu-cell line-height: per-size values injected via CSS custom property
```

### Pattern 1: Width-Ratio Scale Factor

**What:** Derive a multiplier from paper width relative to A5 baseline (148mm). Apply this multiplier to font sizes, padding, and spacing via inline styles.

**Why width-ratio over area-ratio:** Slips are portrait columns. Content flows vertically; the constraining dimension for readability is width. Width-ratio produces more natural results than area-ratio (which was appropriate for margins but is too aggressive for font scaling).

**Formula:**
```typescript
// In db/printSettings.ts
const A5_WIDTH = 148

export function calcScale(size: PaperSize): number {
  return PAPER_SIZES[size].width / A5_WIDTH
  // A5 -> 1.00
  // A4 -> 210/148 = 1.419
  // Letter -> 216/148 = 1.459
}
```

**Confidence:** HIGH - width-ratio is the standard approach for single-column document scaling. Area-ratio would produce ~2x font size for A4 which is too large.

### Pattern 2: CSS Custom Properties via Inline Style

**What:** Slip components receive `paperSize` prop, call `calcScale()`, and apply computed values as inline styles on the root element.

**When to use:** When scaled values must survive both screen rendering and print media (CSS custom properties set on the element are inherited by @media print rules).

**Example:**
```typescript
// PrescriptionSlip.tsx
interface PrescriptionSlipProps {
  visit: Visit
  medications: VisitMedication[]
  patient: Patient
  clinicInfo: ClinicInfo
  paperSize: PaperSize  // new prop
}

export function PrescriptionSlip({ ..., paperSize }: PrescriptionSlipProps) {
  const scale = calcScale(paperSize)
  const basePt = 11 * scale
  const headerPt = 14 * scale
  const urduLineHeight = URDU_LINE_HEIGHTS[paperSize]

  return (
    <div
      className="prescription-slip bg-white mx-auto"
      style={{
        maxWidth: `${Math.round(PAPER_SIZES[paperSize].width)}mm`,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: `${basePt.toFixed(1)}pt`,
        '--urdu-line-height': urduLineHeight,
      } as React.CSSProperties}
    >
```

### Pattern 3: Per-Size Urdu Line-Height Lookup Table

**What:** A static constant maps each paper size to a tuned line-height value for `.urdu-cell`. The CSS custom property `--urdu-line-height` is set on the slip root; `.urdu-cell` references it.

**Why not scale linearly:** Nastaliq descenders and diacritics require optical adjustment. Linear scaling from A5's 2.2 produces clipping on A4 because Nastaliq glyphs at larger point sizes need proportionally more vertical room. The exact values require empirical testing, but starting estimates are documented below.

**Lookup table (starting point for empirical testing):**
```typescript
// In db/printSettings.ts
export const URDU_LINE_HEIGHTS: Record<PaperSize, number> = {
  A5: 2.2,      // current hardcoded value, confirmed working
  A4: 2.6,      // estimate: larger font = more diacritic space needed
  Letter: 2.6,  // Letter ~ A4 in width, same estimate
}
```

**CSS in index.css:**
```css
@media print {
  .urdu-cell {
    font-family: 'Noto Nastaliq Urdu Variable', serif;
    direction: rtl;
    line-height: var(--urdu-line-height, 2.2);  /* fallback to 2.2 */
    overflow: visible;
    padding-top: 4px;
    padding-bottom: 4px;
  }
}
```

**Confidence:** MEDIUM for starting values. A5=2.2 is HIGH (confirmed). A4/Letter estimates need print testing.

### Pattern 4: On-Screen Preview Frame

**What:** A container div whose screen dimensions (in px) are proportional to the physical paper dimensions (in mm). The slip renders inside this frame at natural scale. No CSS transform.

**Why not CSS `transform: scale()`:** Transform-based scaling creates hit area mismatches, requires manual origin calculations, and makes the print output unpredictable. Sizing the container to paper proportions and letting the slip fill it naturally is simpler and more reliable.

**Implementation approach:**
- Define a screen reference height for A5 (e.g., `PREVIEW_BASE_HEIGHT_PX = 600`). This is the on-screen pixel height for A5.
- Derive screen width from the paper's aspect ratio: `width = height * (paperWidth / paperHeight)`.
- All paper sizes share the same `PREVIEW_BASE_HEIGHT_PX`, so A4 and Letter will be taller on screen than A5.

Wait -- the context says "A5 preview is physically smaller on screen than A4 (represents actual paper size difference)." This means the preview height scales with paper height too. The correct interpretation: use a fixed px-per-mm ratio, so all sizes render at the same physical scale factor.

**Correct approach:**
```typescript
const PREVIEW_PX_PER_MM = 2.8  // tweak for comfortable on-screen size

function previewDimensions(size: PaperSize) {
  const { width, height } = PAPER_SIZES[size]
  return {
    widthPx: Math.round(width * PREVIEW_PX_PER_MM),
    heightPx: Math.round(height * PREVIEW_PX_PER_MM),
  }
}
// A5: 414 x 588 px
// A4: 588 x 832 px
// Letter: 605 x 781 px
```

**Frame JSX in PrintVisitPage.tsx:**
```tsx
const { widthPx, heightPx } = previewDimensions(activeSize)

<div
  className="no-print mx-auto bg-white border border-gray-300 shadow-md overflow-auto"
  style={{ width: widthPx, minHeight: heightPx }}
>
  {showPrescription && <PrescriptionSlip ... paperSize={activeSize} />}
  {showDispensary && <DispensarySlip ... paperSize={activeSize} />}
</div>
```

Note: The slip renders at its natural `maxWidth` set in mm units, which the browser converts to px. This works because the container is sized in px derived from the same mm values, so they match. Use `overflow: auto` (not `hidden`) so very long content isn't silently clipped on screen.

### Anti-Patterns to Avoid

- **`transform: scale()` on slip for preview:** Creates print/screen divergence. The CSS applied for print must match what's shown on screen. Scaling the container instead of the content avoids this.
- **Tailwind classes for scaled sizes:** `text-sm`, `text-base` etc. are fixed values. Dynamic scaling requires computed `pt` values in inline styles, consistent with existing slip code patterns.
- **Area-ratio for font scaling:** Too aggressive. Width-ratio is correct for portrait single-column documents.
- **Hardcoding A6 fallback only in UI:** The fallback must be in `getPrintSettings()` so any consumer (auto-print, PrintVisitPage) always receives a valid non-A6 size.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Scaling formula | Custom heuristic | `calcScale()` extending existing `calcMargin()` pattern in printSettings.ts |
| Per-size config | Nested switch/if blocks | Lookup tables keyed by `PaperSize` (same pattern as `PAPER_SIZES`) |

---

## Common Pitfalls

### Pitfall 1: maxWidth still in mm string -- browser converts correctly but must match preview frame
**What goes wrong:** Slip has `maxWidth: '148mm'` hardcoded. If the preview frame is wider than 148mm-equivalent-px, the slip won't fill it on A4.
**How to avoid:** Make `maxWidth` dynamic: `style={{ maxWidth: \`${PAPER_SIZES[paperSize].width}mm\` }}`. The print CSS already removes maxWidth via `.prescription-slip { max-width: none !important; }` so this only affects screen.

### Pitfall 2: CSS custom property not inherited through @media print
**What goes wrong:** Setting `--urdu-line-height` on the slip root element and reading it in `@media print { .urdu-cell }` may not work if the custom property is only set via JS (not in stylesheet).
**How to avoid:** Custom properties set as inline styles ARE inherited through media queries -- they're DOM properties, not computed stylesheet values. This works. Tested pattern: set `style={{ '--urdu-line-height': 2.6 }}` on parent, read `var(--urdu-line-height, 2.2)` in CSS. Confidence: HIGH (CSS spec: custom properties are inherited by default and are media-query transparent).

### Pitfall 3: A6 value still in IndexedDB after removal
**What goes wrong:** User had A6 selected in Phase 10. After Phase 11 ships, `getPrintSettings()` reads `'A6'` from DB and passes it to components. PAPER_SIZES no longer has an A6 entry. Runtime error.
**How to avoid:** In `getPrintSettings()`, after reading DB value, coerce: `if (size === 'A6') size = 'A5'`. Do this before returning.

### Pitfall 4: Preview frame overflow clips Urdu text visually
**What goes wrong:** Urdu Nastaliq glyphs exceed their cell's bounds. With `overflow: hidden` on the preview frame, descenders clip at the frame edge.
**How to avoid:** Use `overflow: auto` on the preview frame container, not `overflow: hidden`. The slip itself has `overflow: visible` on `.urdu-cell`.

### Pitfall 5: Existing test for A6 badge will fail after A6 removal
**What goes wrong:** `PrintVisitPage.test.tsx` line 238 saves `'A6'` as a dispensary size and asserts `'Paper: A6 (105 x 148 mm)'` is shown. After removing A6, this test breaks.
**How to avoid:** Update that test in the same wave that removes A6. Replace with a test that verifies A6 falls back to A5.

---

## Code Examples

### calcScale() function
```typescript
// db/printSettings.ts -- add alongside calcMargin()
const A5_WIDTH = 148

export function calcScale(size: PaperSize): number {
  return PAPER_SIZES[size].width / A5_WIDTH
}
```

### A6 fallback in getPrintSettings()
```typescript
const VALID_SIZES: PaperSize[] = ['A5', 'A4', 'Letter']

function coerceSize(raw: unknown): PaperSize {
  if (VALID_SIZES.includes(raw as PaperSize)) return raw as PaperSize
  return 'A5'  // catches A6 and any invalid values
}

export async function getPrintSettings(): Promise<PrintSettings> {
  const [prescriptionEntry, dispensaryEntry] = await Promise.all([
    db.settings.get('printPrescriptionSize'),
    db.settings.get('printDispensarySize'),
  ])
  return {
    prescriptionSize: coerceSize(prescriptionEntry?.value),
    dispensarySize: coerceSize(dispensaryEntry?.value),
  }
}
```

### PaperSize type after A6 removal
```typescript
// db/printSettings.ts
export type PaperSize = 'A5' | 'A4' | 'Letter'

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A5: { width: 148, height: 210, label: 'A5 (148 x 210 mm)' },
  A4: { width: 210, height: 297, label: 'A4 (210 x 297 mm)' },
  Letter: { width: 216, height: 279, label: 'Letter (216 x 279 mm)' },
}

export const PAPER_SIZE_ORDER: PaperSize[] = ['A5', 'A4', 'Letter']
```

### Urdu line-height custom property in index.css
```css
@media print {
  .urdu-cell {
    font-family: 'Noto Nastaliq Urdu Variable', serif;
    direction: rtl;
    line-height: var(--urdu-line-height, 2.2);
    overflow: visible;
    padding-top: 4px;
    padding-bottom: 4px;
  }
}
```

### Scaled PrescriptionSlip (key lines)
```typescript
// Pass paperSize, compute scale, apply inline
export function PrescriptionSlip({ ..., paperSize }: PrescriptionSlipProps) {
  const scale = calcScale(paperSize)
  const basePt = +(11 * scale).toFixed(1)
  const headerPt = +(14 * scale).toFixed(1)

  return (
    <div
      className="prescription-slip bg-white mx-auto"
      style={{
        maxWidth: `${PAPER_SIZES[paperSize].width}mm`,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: `${basePt}pt`,
        '--urdu-line-height': URDU_LINE_HEIGHTS[paperSize],
      } as React.CSSProperties}
    >
      <div className="p-6">
        <h1 style={{ fontSize: `${headerPt}pt` }}>{clinicInfo.doctorName}</h1>
        ...
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Hardcoded `fontSize: '11pt'` in slip | Dynamic `fontSize` from `calcScale(paperSize)` | Content fills paper at all sizes |
| Fixed `line-height: 2.2` in CSS | `var(--urdu-line-height, 2.2)` with per-size values | No Urdu clipping |
| No preview frame | Container div sized from PAPER_SIZES constants | Doctor sees paper proportions before printing |
| A6 in type and constants | A6 removed; coerce in getPrintSettings() | Clean, no runtime errors |

---

## Open Questions

1. **Exact Urdu line-height values for A4 and Letter**
   - What we know: A5 = 2.2 (confirmed working). Larger fonts need more vertical room.
   - What's unclear: The exact values require printing actual slips and measuring. Starting estimates (2.6 for A4/Letter) may need adjustment.
   - Recommendation: Implement with 2.6 estimates, document them as empirically-determined-TBD in code comments. The planner should include a manual verification step: print a slip with a long Urdu instruction on A4 and confirm no clipping.

2. **Preview frame scroll vs. fixed height**
   - What we know: A4 preview at 2.8px/mm = 832px tall, which may scroll on smaller screens.
   - What's unclear: Whether the doctor's screen is large enough that scrolling in the preview frame is acceptable.
   - Recommendation: Use `overflow: auto` on the frame. On the outer page container, keep standard scroll behavior. The preview is informational; scrolling is acceptable.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCALE-01 | Prescription slip font size scales with paper size (A4 > A5) | unit | `npx vitest run src/__tests__/PrescriptionSlip.test.tsx` | Wave 0 |
| SCALE-02 | Dispensary slip font size scales with paper size | unit | `npx vitest run src/__tests__/DispensarySlip.test.tsx` | Wave 0 |
| SCALE-03 | Urdu line-height CSS custom property set per paper size | unit | `npx vitest run src/__tests__/PrescriptionSlip.test.tsx` | Wave 0 |
| SCALE-04 | Preview frame dimensions reflect paper proportions in DOM | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | Exists (extend) |

Note: SCALE-03 actual print output (clipping) cannot be verified in jsdom. Tests verify the correct CSS custom property value is set. Manual print verification is required for the non-negotiable "no clipping" constraint.

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/PrintVisitPage.test.tsx src/__tests__/PrescriptionSlip.test.tsx src/__tests__/DispensarySlip.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/PrescriptionSlip.test.tsx` -- covers SCALE-01, SCALE-03
- [ ] `src/__tests__/DispensarySlip.test.tsx` -- covers SCALE-02
- Update `src/__tests__/PrintVisitPage.test.tsx` -- A6 badge test must be replaced with A6-fallback test (covers A6 removal)

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/db/printSettings.ts`, `src/components/PrescriptionSlip.tsx`, `src/components/DispensarySlip.tsx`, `src/pages/PrintVisitPage.tsx`, `src/index.css`, `src/__tests__/PrintVisitPage.test.tsx`
- CSS specification: custom properties are inherited and media-query transparent (MDN: CSS Custom Properties, Inheritance section)

### Secondary (MEDIUM confidence)
- Urdu line-height starting estimates (A4: 2.6) based on scaling pattern from A5 baseline; require empirical validation

---

## Metadata

**Confidence breakdown:**
- A6 removal + type changes: HIGH -- pure refactor with clear scope
- Scale formula (width-ratio): HIGH -- mathematically appropriate for portrait column layout
- CSS custom property inheritance through print media: HIGH -- CSS spec behavior
- Preview frame approach: HIGH -- derives from existing PAPER_SIZES constants, no new mechanism
- Urdu line-height values for A4/Letter: MEDIUM -- starting estimates require print testing

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable CSS and React patterns)
