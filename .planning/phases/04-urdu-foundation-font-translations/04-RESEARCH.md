# Phase 4: Urdu Foundation -- Research

**Researched:** 2026-03-06
**Status:** Research complete

## Codebase Analysis

### Entry Point
- `src/main.tsx` imports `./index.css` then renders `<App />`. Font import should go here, before the CSS import or right after it.
- `src/App.tsx` has routing, auth, and layout. No font concerns here.

### Constants Directory
- `src/constants/clinical.ts` contains all four arrays. New `src/constants/translations.ts` follows existing convention.

### Print Components
Both `PrescriptionSlip.tsx` and `DispensarySlip.tsx` render medication tables with `{med.dosage}`, `{med.frequency}`, `{med.duration}`, and `{med.form}` as plain English strings. Phase 5 will wrap these with `toUrdu()` calls and apply `.urdu-cell` class. Phase 4 just builds the infrastructure.

Both slips set `fontFamily: "'Segoe UI', Arial, sans-serif"` via inline style on the root div. The `.urdu-cell` class will override font-family on specific `<td>` elements in Phase 5.

### No Skills Files
No `.claude/skills/` or `.agents/skills/` directories exist in this project.

## Clinical Values Inventory

**DOSAGE_OPTIONS (17 values):**
1. `1/2 tablet`
2. `1 tablet`
3. `2 tablets`
4. `3 tablets`
5. `2.5 ml`
6. `5 ml`
7. `10 ml`
8. `15 ml`
9. `1 drop`
10. `2 drops`
11. `3 drops`
12. `5 drops`
13. `1 injection`
14. `1 sachet`
15. `Apply thin layer`
16. `Apply as directed`
17. `1 puff`
18. `2 puffs`

**Correction: 18 values, not 16 as stated in 04-CONTEXT.md.**

**FREQUENCY_OPTIONS (17 values):**
1. `Once daily`
2. `Twice daily`
3. `Three times daily`
4. `Four times daily`
5. `Every 4 hours`
6. `Every 6 hours`
7. `Every 8 hours`
8. `Every 12 hours`
9. `Once weekly`
10. `As needed`
11. `Before meals`
12. `After meals`
13. `At bedtime`
14. `Once daily before breakfast`
15. `Once daily at night`
16. `Twice daily (morning and night)`
17. `Stat (single dose)`

**DURATION_OPTIONS (13 values):**
1. `1 day`
2. `3 days`
3. `5 days`
4. `7 days`
5. `10 days`
6. `14 days`
7. `3 weeks`
8. `1 month`
9. `2 months`
10. `3 months`
11. `6 months`
12. `Ongoing`
13. `As needed`

**MEDICATION_FORMS (16 values):**
1. `Tablet`
2. `Capsule`
3. `Syrup`
4. `Suspension`
5. `Drops`
6. `Injection`
7. `Cream`
8. `Ointment`
9. `Gel`
10. `Inhaler`
11. `Suppository`
12. `Sachet`
13. `Powder`
14. `Patch`
15. `Spray`
16. `Solution`

**Total: 64 values** (18 + 17 + 13 + 16). Context doc estimated ~62.

### Duplicate Key: "As needed"
`As needed` appears in both FREQUENCY_OPTIONS and DURATION_OPTIONS. The translation map can handle this with a single entry since the Urdu translation would be the same (`ضرورت کے مطابق`).

## Font Integration

### Package
`@fontsource-variable/noto-nastaliq-urdu` is **not** in `package.json`. Needs `npm install`.

### Import Pattern
Standard @fontsource-variable import: `import '@fontsource-variable/noto-nastaliq-urdu'`

This auto-imports the CSS that loads the woff2 file. The CSS declares `@font-face` with `font-family: 'Noto Nastaliq Urdu Variable'` and `font-display: swap`.

### Where to Import
Add to `src/main.tsx` before or after `import './index.css'`. This ensures the font is loaded eagerly on app start and cached by service worker, ready for print.

### Font Family Reference
In CSS: `font-family: 'Noto Nastaliq Urdu Variable', serif`

## Print CSS Architecture

### Current Location
All print styles are in `src/index.css` inside a single `@media print { ... }` block (lines 22-53). This is the correct place for `.urdu-cell`.

### .urdu-cell Design
Add inside the existing `@media print` block:

```css
.urdu-cell {
  font-family: 'Noto Nastaliq Urdu Variable', serif;
  font-display: swap;
  direction: rtl;
  line-height: 2.2;
  overflow: visible;
  padding-top: 4px;
  padding-bottom: 4px;
}
```

Notes:
- `font-display: swap` is already set by the @fontsource `@font-face`, but including it in the class is harmless and documents intent
- `direction: rtl` is needed for proper Nastaliq rendering; Phase 5 will apply this class to specific table cells
- `overflow: visible` prevents diacritics from being clipped by table cell boundaries
- Print-only scope means no impact on screen UI

## Service Worker / PWA

### Current Config (vite.config.ts)
```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
}
```

`woff2` is already in `globPatterns`. When `@fontsource-variable/noto-nastaliq-urdu` is installed and imported, Vite bundles the woff2 into the build output (typically `assets/`). Workbox will automatically precache it. No config changes needed.

### Verification
After build, check `dist/assets/` for a `.woff2` file and verify `sw.js` or the workbox manifest references it.

## Translation Map Design

### File: `src/constants/translations.ts`

```typescript
// Separate named exports per category (per 04-CONTEXT.md decision)
export const dosageUrdu: Record<string, string> = {
  '1/2 tablet': 'آدھی گولی',
  '1 tablet': '1 گولی',
  // ...
}

export const frequencyUrdu: Record<string, string> = { ... }
export const durationUrdu: Record<string, string> = { ... }
export const formsUrdu: Record<string, string> = { ... }

// Unified lookup for toUrdu()
const allTranslations: Record<string, string> = {
  ...dosageUrdu,
  ...frequencyUrdu,
  ...durationUrdu,
  ...formsUrdu,
}

export function toUrdu(value: string): string {
  return allTranslations[value] ?? value
}
```

Key design decisions from 04-CONTEXT.md:
- Western numerals in Urdu text (1, 2, 3 not ۱, ۲, ۳)
- Patient-friendly colloquial Urdu
- Silent English fallback (return input as-is if no mapping)
- `"As needed"` maps once, shared by frequency and duration contexts

## Validation Architecture

### 1. Font renders correctly (Nastaliq diacritics not clipped)
- **Manual check:** Build app, open print preview, inspect Urdu text in medication cells. Diacritics (zabar, zer, pesh) and descenders should not be clipped.
- **CSS verification:** Confirm `.urdu-cell` has `line-height >= 2.0` and `overflow: visible`.
- **Print test:** Ctrl+P from `/visit/:id/print` route, verify A5 output.

### 2. toUrdu() returns correct Urdu for all clinical values
- **Unit test:** Import all four arrays from `clinical.ts`. For each value, assert `toUrdu(value)` returns a non-empty string that is NOT the English input (confirming a translation exists).
- **Completeness test:** Assert `Object.keys(dosageUrdu).length === DOSAGE_OPTIONS.length` (and same for the other three categories). This catches any missed translations.
- **Spot-check test:** Assert specific known translations, e.g., `toUrdu('Once daily') === 'روزانہ ایک بار'`.

### 3. toUrdu() returns English for unknown values
- **Unit test:** `expect(toUrdu('unknown-value')).toBe('unknown-value')`
- **Unit test:** `expect(toUrdu('')).toBe('')`

### 4. Font is cached by service worker offline
- **Build verification (automated):** After `npm run build`, assert a `.woff2` file exists in `dist/assets/`.
- **Config verification:** `globPatterns` in `vite.config.ts` includes `woff2` (already confirmed).
- **Manual verification:** In Chrome DevTools > Application > Cache Storage, confirm the workbox cache contains the woff2 file.

## Risks & Considerations

1. **Translation accuracy:** Claude generates Urdu translations with best-effort accuracy. No manual review step planned (per user decision). Translations can be refined later without code changes (just update the map values).

2. **Font file size:** Noto Nastaliq Urdu variable font woff2 is roughly 500KB-1MB. This is a one-time download, cached by service worker. Acceptable for an offline-first app.

3. **`As needed` duplication:** Appears in both FREQUENCY_OPTIONS and DURATION_OPTIONS. Same Urdu translation works for both contexts, so the merged `allTranslations` map handles it cleanly with a single entry.

4. **Dosage count mismatch:** 04-CONTEXT.md says "dosage (16)" but the actual array has 18 values (`1 puff` and `2 puffs` likely added after context was written). The translation map must cover all 18.

5. **Phase boundary:** This phase builds infrastructure only. No print component modifications. `.urdu-cell` is defined but not applied to any elements yet (that's Phase 5).

6. **`font-display: swap` in CSS class vs @font-face:** The `font-display` property only works in `@font-face` declarations, not in regular CSS rules. The @fontsource package already sets this in its `@font-face`. Including it in `.urdu-cell` is a no-op but harmless. Worth noting for accuracy.

---
*Phase: 04-urdu-foundation-font-translations*
*Research completed: 2026-03-06*
