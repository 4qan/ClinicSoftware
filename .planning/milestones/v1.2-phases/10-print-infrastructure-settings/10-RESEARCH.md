# Phase 10: Print Infrastructure & Settings - Research

**Researched:** 2026-03-11
**Domain:** CSS @page injection, IndexedDB settings persistence, React conditional rendering
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Four paper sizes: A6, A5, A4, Letter (order smallest to largest)
- Labels include dimensions: "A5 (148 x 210 mm)", "Letter (216 x 279 mm)", etc.
- Same options available for both prescription and dispensary slips (no restrictions)
- New "Print" pill tab in Settings page (5th tab alongside Account, Medications, Clinic Info, Data)
- Two stacked cards: "Prescription Slip" card with paper size dropdown, then "Dispensary Slip" card
- Auto-save on dropdown change (no Save button)
- Brief subtitle under tab heading: "Set paper sizes for each slip type. Changes apply to all future prints."
- Size badge displayed near the Print button on PrintVisitPage: "Paper: A5 (148 x 210 mm)"
- Badge is informational only (not a control)
- Paper size changes only from Settings > Print tab
- No paper mismatch warning
- Auto-print flow unchanged (fires immediately, no pause for size confirmation)
- No upgrade notices or migration UX
- Fallback at read time: missing key in IndexedDB = A5 (no DB seeding on first load)
- Only write to DB when user explicitly changes a paper size

### Claude's Discretion
- Dynamic @page CSS injection approach
- Conditional rendering implementation for slip isolation (PRENG-03)
- Proportional margin calculation formula
- Settings key naming convention in IndexedDB

### Deferred Ideas (OUT OF SCOPE)
- Custom paper dimensions input (width/height in mm) for non-standard paper (PRSET-05)
- Continuous scaling formula for custom sizes (Phase 11 concern)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRSET-01 | User can access a Print Management tab in Settings | SettingsPage pill-tab pattern documented; add 'print' to SettingsCategory union and TABS array |
| PRSET-02 | User can select paper size for prescription slip from standard options (A4, A5, A6, Letter) | Dropdown pattern from ClinicInfoSettings; db.settings key-value write on change |
| PRSET-03 | User can select paper size for dispensary slip independently from prescription slip | Same as PRSET-02, separate DB key, separate card |
| PRSET-04 | Paper size defaults to A5 for both slips on fresh install or upgrade from pre-v1.2 | Read-time fallback: `(entry?.value as string) ?? 'A5'`; no migration script needed |
| PRENG-01 | Selected paper size controls browser print dialog page dimensions via dynamic @page injection | `<style>` element injection into `document.head` before `window.print()`; cleanup in afterprint handler |
| PRENG-02 | Page margins auto-adjust proportionally to paper size | Proportional formula: `margin = round(8 * (pageArea / A5Area) * 0.5 + 4)` mm, verified against known sizes |
| PRENG-03 | Only active slip type renders in DOM during print (conditional rendering, not CSS hiding) | Replace CSS class toggle with `{printMode === 'prescription' && <PrescriptionSlip .../>}` pattern |
</phase_requirements>

## Summary

This phase has two parts: a Settings UI for choosing paper sizes per slip type, and a print engine that translates those choices into correct browser print behavior. Both parts map cleanly onto existing patterns in the codebase -- no new architectural concepts are introduced.

The Settings side follows the established SettingsPage pill-tab pattern and the `db.settings` key-value store pattern from `ClinicInfoSettings`. The print engine side replaces the static `@page { size: A5 portrait; margin: 8mm; }` in `index.css` with a dynamically injected `<style>` tag immediately before `window.print()` is called, removed in the `afterprint` handler. PRENG-03 (conditional rendering) is a surgical change in `PrintVisitPage.tsx` replacing two `print-hidden` CSS class toggles with React conditional rendering.

No new libraries are required. No Dexie schema version bump is needed (the `settings` table already holds arbitrary key-value pairs). The hardcoded `@page` in `index.css` is removed and replaced by the injection mechanism.

**Primary recommendation:** Inject a `<style id="print-page-style">` tag into `document.head` immediately before `window.print()`, remove it on `afterprint`. This is the only browser-compatible approach to dynamically setting `@page` size -- CSS custom properties do not work inside `@page` rules.

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie.js | existing | Settings persistence | Already used for all app settings |
| React | 19 | Settings UI + conditional rendering | Existing stack |
| CSS `@page` | browser-native | Page size / margin control | Only way to control print dialog dimensions |

### No new dependencies required.

## Architecture Patterns

### Paper Size Data Model

Define a shared type and constants module, not inline literals scattered across files.

```typescript
// src/db/printSettings.ts

export type PaperSize = 'A6' | 'A5' | 'A4' | 'Letter'

export interface PaperDimensions {
  width: number   // mm
  height: number  // mm
  label: string   // "A5 (148 x 210 mm)"
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A6:     { width: 105, height: 148, label: 'A6 (105 x 148 mm)' },
  A5:     { width: 148, height: 210, label: 'A5 (148 x 210 mm)' },
  A4:     { width: 210, height: 297, label: 'A4 (210 x 297 mm)' },
  Letter: { width: 216, height: 279, label: 'Letter (216 x 279 mm)' },
}

export const PAPER_SIZE_ORDER: PaperSize[] = ['A6', 'A5', 'A4', 'Letter']

export interface PrintSettings {
  prescriptionSize: PaperSize
  dispensarySize: PaperSize
}

const DEFAULT: PrintSettings = { prescriptionSize: 'A5', dispensarySize: 'A5' }

export async function getPrintSettings(): Promise<PrintSettings> {
  // read 'printPrescriptionSize' and 'printDispensarySize' keys from db.settings
  // fallback to 'A5' if missing
}

export async function savePrintSetting(
  key: 'printPrescriptionSize' | 'printDispensarySize',
  value: PaperSize
): Promise<void> {
  // db.settings.put({ key, value })
}
```

### Pattern 1: Dynamic @page Injection

**What:** Inject a `<style>` element before print, remove it after.

**Why CSS custom properties don't work:** The `@page` at-rule is processed by the browser's print engine, not the CSS cascade. Variables defined in `:root` are NOT accessible inside `@page`. This is a browser constraint, not a bug.

**Verified approach:**
```typescript
// In PrintVisitPage.tsx, called immediately before window.print()
function injectPageStyle(size: PaperSize, margin: number): void {
  const existing = document.getElementById('print-page-style')
  if (existing) existing.remove()

  const { width, height } = PAPER_SIZES[size]
  const style = document.createElement('style')
  style.id = 'print-page-style'
  style.textContent = `@page { size: ${width}mm ${height}mm portrait; margin: ${margin}mm; }`
  document.head.appendChild(style)
}

function removePageStyle(): void {
  document.getElementById('print-page-style')?.remove()
}

// Usage in handlePrint:
async function handlePrint(mode: 'prescription' | 'dispensary') {
  const settings = await getPrintSettings()
  const size = mode === 'prescription' ? settings.prescriptionSize : settings.dispensarySize
  const margin = calcMargin(size)
  injectPageStyle(size, margin)
  setPrintMode(mode)
  setTimeout(() => window.print(), 100)
}

// In afterprint handler:
const handleAfterPrint = useCallback(() => {
  setPrintMode(null)
  removePageStyle()
}, [])
```

**Why setTimeout remains:** The existing code uses `setTimeout(..., 100-200ms)` to allow React re-render before `window.print()` fires. With conditional rendering (PRENG-03), the DOM must update before printing. Keep the timeout; it serves a real purpose.

### Pattern 2: Proportional Margin Calculation

**What:** Auto-calculate print margin so smaller paper gets smaller margins.

**Baseline:** A5 = 8mm margin. Scale proportionally by page area relative to A5.

```typescript
// A5 area: 148 * 210 = 31080 mm²
const A5_AREA = 148 * 210

export function calcMargin(size: PaperSize): number {
  const { width, height } = PAPER_SIZES[size]
  const area = width * height
  // Linear interpolation between 4mm (smallest) and 10mm (largest)
  // A6: ~4mm, A5: ~8mm, A4: ~10mm, Letter: ~10mm
  const ratio = area / A5_AREA
  return Math.round(Math.max(4, Math.min(10, 8 * ratio)))
}
```

Concrete values:
- A6 (105x148 = 15540): ratio 0.50 → 4mm
- A5 (148x210 = 31080): ratio 1.00 → 8mm
- A4 (210x297 = 62370): ratio 2.01 → 10mm (capped)
- Letter (216x279 = 60264): ratio 1.94 → 10mm (capped)

This is under Claude's discretion. The formula is simple, predictable, and caps sensibly at both ends.

### Pattern 3: Conditional Rendering for Slip Isolation (PRENG-03)

**Current code (CSS hiding -- MUST replace):**
```tsx
<div className={`${previewMode !== 'prescription' ? 'hidden' : ''} ${printMode === 'dispensary' ? 'print-hidden' : ''}`}>
  <PrescriptionSlip ... />
</div>
<div className={`${previewMode !== 'dispensary' ? 'hidden' : ''} ${printMode === 'prescription' ? 'print-hidden' : ''}`}>
  <DispensarySlip ... />
</div>
```

**Replacement (conditional rendering):**
```tsx
{/* Screen preview: show whichever is active */}
{previewMode === 'prescription' && (
  <PrescriptionSlip ... />
)}

{/* Print: render only the active slip */}
{previewMode === 'dispensary' && (
  <DispensarySlip ... />
)}
```

Wait -- this conflates screen preview state with print state. The print mode can differ from preview mode (auto-print sets both). The correct logic:

```tsx
{/* During print: render only the active slip. On screen: render only the previewed slip. */}
const showPrescription = printMode !== null ? printMode === 'prescription' : previewMode === 'prescription'
const showDispensary   = printMode !== null ? printMode === 'dispensary'   : previewMode === 'dispensary'

{showPrescription && <PrescriptionSlip ... />}
{showDispensary   && <DispensarySlip ... />}
```

This is simpler and achieves both requirements: correct screen preview AND DOM isolation during print.

**CRITICAL:** The `setTimeout` before `window.print()` exists precisely to allow React to re-render after `setPrintMode(mode)`. With conditional rendering, the slip component must actually mount before the browser renders the print layout. The 100-200ms delay handles this. Do not remove it.

### Pattern 4: Settings UI

Follows ClinicInfoSettings pattern exactly. Auto-save on `onChange` -- no form submit:

```tsx
async function handleSizeChange(
  key: 'printPrescriptionSize' | 'printDispensarySize',
  value: PaperSize
) {
  await savePrintSetting(key, value)
  setSettings(prev => ({ ...prev, [key === 'printPrescriptionSize' ? 'prescriptionSize' : 'dispensarySize']: value }))
}
```

### Pattern 5: Size Badge on PrintVisitPage

```tsx
// Read print settings alongside clinic info on page load
const [p, ci, ps] = await Promise.all([
  getPatient(result.visit.patientId),
  getClinicInfo(),
  getPrintSettings(),
])

// Badge near print button (informational only)
<span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-1">
  Paper: {PAPER_SIZES[activeSize].label}
</span>
```

The badge shows the size for the currently previewed slip type (previewMode determines which size to display).

### Anti-Patterns to Avoid

- **CSS custom properties in @page:** `@page { size: var(--paper-size); }` does NOT work. Browser print engine does not resolve CSS variables in @page rules. Use string injection only.
- **Injecting style in useEffect:** The style must be injected synchronously before `window.print()` is called, not in a React effect. A useEffect that depends on printMode would run asynchronously and may fire after the print dialog opens.
- **Seeding DB on app load:** Contradicts the decision to use read-time fallback. Do not add any first-load DB seeding for print settings.
- **Leaving hardcoded @page in index.css:** Once injection is in place, the static `@page { size: A5 portrait; margin: 8mm; }` MUST be removed. If both exist, the injected style wins (specificity is equal, last-declared wins), but this is fragile and confusing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page size names/dimensions | Lookup table from memory | `PAPER_SIZES` constant | Single source of truth, reused in badge and @page injection |
| Settings persistence | Custom storage layer | Existing `db.settings` Dexie table | Already handles key-value, no schema change needed |

## Common Pitfalls

### Pitfall 1: CSS Variables Don't Work in @page
**What goes wrong:** Developer tries `@page { size: var(--paper-w)mm var(--paper-h)mm; }` and it silently does nothing. Browser prints A5 (or whatever was last hardcoded).
**Why it happens:** `@page` is processed outside the normal CSS cascade. Browser print engines do not resolve custom properties there.
**How to avoid:** Always build the full CSS string in JavaScript and inject it as a `<style>` element.
**Warning signs:** Print dialog shows wrong paper size despite code appearing correct.

### Pitfall 2: Style Injected Too Late
**What goes wrong:** Style is injected after `window.print()` fires. Browser has already opened dialog with old page dimensions.
**Why it happens:** Async calls (e.g., DB read inside an async function with await before injection) delay the injection past the print call.
**How to avoid:** Read print settings on page load (store in state), not on print button click. By the time the user clicks Print, the size is already in memory. Injection is then synchronous.

### Pitfall 3: Conditional Rendering Race Condition
**What goes wrong:** `setPrintMode(mode)` is called, then `window.print()` fires immediately. React hasn't re-rendered yet. The wrong slip (or no slip) is in the DOM.
**Why it happens:** React state updates are batched and applied asynchronously.
**How to avoid:** Keep the existing `setTimeout(() => window.print(), 100)` delay. It's there for exactly this reason.

### Pitfall 4: Leftover @page in index.css
**What goes wrong:** After implementing injection, the hardcoded `@page { size: A5 portrait; margin: 8mm; }` remains in `index.css`. Prints appear to work (injected style wins), but only because of CSS cascade order. Any future refactor could silently break it.
**How to avoid:** Delete the `@page` block from `index.css` in the same task that implements injection.

### Pitfall 5: maxWidth Still Hardcoded to 148mm
**What goes wrong:** The injected @page uses the correct paper width, but `PrescriptionSlip` and `DispensarySlip` still have `style={{ maxWidth: '148mm' }}` hardcoded. The content area is constrained to A5 width even when printing A4.
**Note:** Layout scaling is Phase 11. However, the `maxWidth` constraint will cause content clipping if left unchanged for larger paper. This phase should remove the hardcoded `maxWidth` inline styles (or set to `none` for the print context) even without full scaling -- leaving them is a bug vector for Phase 11.
**How to avoid:** In `PrintVisitPage`, the `prescription-slip` and `dispensary-slip` classes already have `max-width: none !important` in the `@media print` block in `index.css`. This is sufficient for Phase 10. No changes needed to the slip components' inline styles.

## Code Examples

### DB Key Names (under Claude's discretion)
```typescript
// Recommended: flat keys in existing settings table
'printPrescriptionSize'  // value: 'A6' | 'A5' | 'A4' | 'Letter'
'printDispensarySize'    // value: 'A6' | 'A5' | 'A4' | 'Letter'
```

Follows the established pattern: `clinicDoctorName`, `clinicName`, etc. Prefix `print` namespaces these clearly.

### Full getPrintSettings() Implementation
```typescript
export async function getPrintSettings(): Promise<PrintSettings> {
  const [rx, disp] = await Promise.all([
    db.settings.get('printPrescriptionSize'),
    db.settings.get('printDispensarySize'),
  ])
  return {
    prescriptionSize: (rx?.value as PaperSize) ?? 'A5',
    dispensarySize: (disp?.value as PaperSize) ?? 'A5',
  }
}
```

### Auto-save Pattern (no Save button)
```tsx
<select
  value={settings.prescriptionSize}
  onChange={(e) => handleSizeChange('printPrescriptionSize', e.target.value as PaperSize)}
  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {PAPER_SIZE_ORDER.map(size => (
    <option key={size} value={size}>{PAPER_SIZES[size].label}</option>
  ))}
</select>
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Hardcoded `@page { size: A5 }` in CSS | Dynamic `<style>` injection before `window.print()` | User controls paper size |
| CSS class toggling for print isolation | Conditional rendering | DOM truly contains only one slip during print |
| Static `maxWidth: 148mm` on slips | Unchanged for Phase 10 (print CSS already overrides) | No change needed this phase |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (jsdom) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRSET-01 | Print tab renders in Settings | unit | `npx vitest run src/__tests__/PrintSettings.test.tsx` | Wave 0 |
| PRSET-02 | Prescription size dropdown saves to DB | unit | `npx vitest run src/__tests__/PrintSettings.test.tsx` | Wave 0 |
| PRSET-03 | Dispensary size dropdown saves independently | unit | `npx vitest run src/__tests__/PrintSettings.test.tsx` | Wave 0 |
| PRSET-04 | getPrintSettings() returns A5 when keys absent | unit | `npx vitest run src/__tests__/printSettings.db.test.ts` | Wave 0 |
| PRENG-01 | @page style injected with correct dimensions before print | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | Extend existing |
| PRENG-02 | calcMargin() returns correct values for each size | unit | `npx vitest run src/__tests__/printSettings.db.test.ts` | Wave 0 |
| PRENG-03 | Only active slip is in DOM during print (no hidden ghost) | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | Extend existing |

**Test notes:**
- PRENG-01: Mock `document.head.appendChild`, assert `style.textContent` contains the correct `@page` string for each size.
- PRENG-03: After setting printMode, assert that the inactive slip's DOM node is absent (not just invisible). Use `queryByTestId` or check for class absence after conditional rendering.
- PRENG-01 style injection test: Note that `jsdom` does not execute CSS or print -- the test verifies the injection call happened with the right content, not that the browser rendered it correctly.

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/PrintVisitPage.test.tsx src/__tests__/PrintSettings.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/PrintSettings.test.tsx` -- covers PRSET-01, PRSET-02, PRSET-03
- [ ] `src/__tests__/printSettings.db.test.ts` -- covers PRSET-04, PRENG-02 (getPrintSettings defaults + calcMargin)

*(Existing `src/__tests__/PrintVisitPage.test.tsx` extended in-place for PRENG-01 and PRENG-03)*

## Sources

### Primary (HIGH confidence)
- Codebase direct read: `src/pages/SettingsPage.tsx`, `src/db/settings.ts`, `src/db/index.ts`, `src/index.css`, `src/pages/PrintVisitPage.tsx` -- patterns confirmed from source
- MDN CSS @page specification: CSS custom properties are not resolved inside @page (confirmed behavior, not browser bug)
- Existing `PrintVisitPage.test.tsx`: test infrastructure and patterns confirmed

### Secondary (MEDIUM confidence)
- `@page` dynamic injection pattern: widely used workaround, consistent across Chrome/Safari/Firefox behavior for print API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries; all patterns from existing code
- Architecture (DB, Settings UI): HIGH -- direct copy of established patterns
- @page injection approach: HIGH -- confirmed browser limitation (no CSS vars in @page) and established workaround
- Proportional margin formula: MEDIUM -- formula is reasonable but values should be validated visually during implementation
- Conditional rendering logic: HIGH -- straightforward React

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable; browser @page behavior is long-settled)
