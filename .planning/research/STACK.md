# Stack Research: v1.1 Urdu Prescription Printing & Database Backup

> Scope: Only new additions for Urdu/Nastaliq font rendering, RTL print layout, and IndexedDB export/import. Existing stack (React 19, Vite, TailwindCSS v4, Dexie 4.3.x, VitePWA) is validated and unchanged.

## Decision Summary

| Addition | Choice | Version | New Dependency? |
|----------|--------|---------|-----------------|
| Nastaliq Font | Noto Nastaliq Urdu (variable, self-hosted via fontsource) | 5.2.8 | Yes, `@fontsource-variable/noto-nastaliq-urdu` |
| RTL Layout | CSS `direction` + `unicode-bidi` (no library) | N/A | No |
| DB Export/Import | `dexie-export-import` | 4.1.4 | Yes |
| Urdu Translation Map | Plain TypeScript object (dosage/frequency/duration to Urdu) | N/A | No |

Total new runtime deps: 2. No new dev deps.

---

## 1. Nastaliq Font for Urdu

### Font Options Evaluated

| Font | Type | Size | License | Web/Print Quality | Verdict |
|------|------|------|---------|-------------------|---------|
| **Noto Nastaliq Urdu** (Google) | Variable (wght 400-700) | ~330KB woff2 | OFL 1.1 | Excellent in both. Google's Noto family, well-hinted, consistent cross-browser. Variable font = single file for all weights. | **Use this** |
| Jameel Noori Nastaleeq | Static | ~5MB TTF (~1.5MB woff2) | Proprietary (Jameel Publications) | Best visual authenticity for Pakistani Urdu readers. The "standard" Nastaliq font in Pakistan. | Cannot use: proprietary license, massive file size, no npm package |
| Nafees Nastaleeq | Static | ~1.2MB woff2 | Free (CRULP) | Decent rendering, but no variable weights, older hinting. Print quality is acceptable but inferior to Noto. | Backup option if Noto has issues |
| Alvi Nastaleeq | Static | ~800KB woff2 | Free | Lighter weight but less polished kerning. Some ligature issues in Chrome. | Not recommended |

### Decision: Noto Nastaliq Urdu (Variable)

**Why:** Open source (OFL), ~330KB woff2 (acceptable for offline PWA), actively maintained by Google, variable font (one file covers 400-700 weight range), excellent print rendering, available as an npm package via fontsource.

**Why not Jameel Noori:** Despite being the culturally preferred font in Pakistan, it's proprietary (no clear web license) and ~5x the file size. For a PWA that needs to cache everything in the service worker, 330KB beats 1.5MB+. If the doctor specifically requests Jameel, revisit, but start with Noto.

### Self-Hosting (Required for Offline-First)

CDN (Google Fonts) is **not an option**. The clinic has unreliable internet. The font must be bundled in the build output and cached by the service worker.

**Approach: fontsource npm package**

```
npm i @fontsource-variable/noto-nastaliq-urdu
```

Then in the app entry point or the CSS:
```ts
// In main.tsx or a dedicated fonts.ts
import '@fontsource-variable/noto-nastaliq-urdu';
```

This copies the woff2 file into the build output. Vite handles the asset, and the existing Workbox config (`globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`) already caches `.woff2` files. No config changes needed.

**Usage in CSS:**
```css
.urdu-text {
  font-family: 'Noto Nastaliq Urdu Variable', serif;
}
```

The variable font variant uses the family name `Noto Nastaliq Urdu Variable`. If using the static package (`@fontsource/noto-nastaliq-urdu`), the family name is `Noto Nastaliq Urdu`.

**Why variable over static:** Single file (~330KB) covers all weights vs. separate files per weight. Fewer network requests, simpler caching, smaller total size when using multiple weights.

---

## 2. RTL Layout for Urdu in Print

### The Problem

The prescription slip is LTR English. Urdu text (dosage instructions, frequency, duration, rx notes) needs to render RTL within this LTR document. This is mixed-directionality, not a full RTL page.

### CSS Properties Needed

No library required. Three CSS properties handle this:

1. **`direction: rtl`** on Urdu text containers. Sets the base text direction.
2. **`unicode-bidi: isolate`** on inline Urdu spans within LTR context. Prevents the Urdu text from disrupting surrounding LTR flow. `isolate` is the modern correct value (not `embed` or `bidi-override`).
3. **`text-align: right`** on block-level Urdu containers (for rx notes paragraphs).

### Implementation Pattern

For the medication table (dosage/frequency/duration cells with Urdu text):
```css
/* Applied to individual cells or spans containing Urdu */
.urdu-text {
  font-family: 'Noto Nastaliq Urdu Variable', serif;
  direction: rtl;
  unicode-bidi: isolate;
}
```

For the Rx Notes block (full RTL paragraph):
```css
.urdu-block {
  font-family: 'Noto Nastaliq Urdu Variable', serif;
  direction: rtl;
  text-align: right;
  line-height: 2; /* Nastaliq scripts need extra line-height for descenders/ascenders */
}
```

### Print-Specific Considerations

- **`@media print` inherits these styles.** No special print-only RTL rules needed. The same `direction: rtl` that works on screen works in print.
- **Line height:** Nastaliq script has tall vertical strokes (ascenders on letters like alif, lam). Standard `line-height: 1.5` causes overlapping. Use `line-height: 1.8` to `2.0` for Urdu text blocks.
- **Font size:** Nastaliq at the same pt size as Latin text appears visually smaller. May need to bump Urdu text 1-2pt larger for readability. Test on actual A5 print.
- **Table cells:** The table structure stays LTR. Only the *content* of dosage/frequency/duration cells switches to RTL via `unicode-bidi: isolate`. The cell itself and column ordering remain LTR.

### What NOT to Do

- Do NOT set `dir="rtl"` on the `<html>` or `<body>` element. The app is English-primary. Only Urdu text fragments are RTL.
- Do NOT use a CSS-in-JS RTL transformation library (e.g., `rtlcss`, `stylis-plugin-rtl`). Those are for full RTL apps. We only need targeted RTL on specific text spans.

---

## 3. IndexedDB Full Database Export/Import

### Option A: `dexie-export-import` (Recommended)

```
npm i dexie-export-import
```

- **Version:** 4.1.4
- **Peer dep:** `dexie ^4.0.1` (we have 4.3.x, compatible)
- **Size:** ~1MB unpacked (tree-shakes well, minimal runtime impact)
- **License:** Apache 2.0

**What it does:**
- `exportDB(db)` returns a `Blob` containing the full database (all tables, all rows, schema metadata) as a structured binary format (not raw JSON, but a Blob that can be saved as a file).
- `importDB(blob)` restores from that Blob, recreating the database with all tables and data.
- Handles schema versioning: the export includes version info, so imports work even if the schema has evolved.
- Supports progress callbacks for large databases.
- Streaming export (doesn't load entire DB into memory at once).

**Usage pattern:**
```ts
import { exportDB, importDB } from 'dexie-export-import';
import { db } from '@/db';

// Export
const blob = await exportDB(db);
// Trigger download via <a> tag or File System Access API

// Import
await db.delete(); // Clear existing
const newDb = await importDB(blob);
```

**Why use it over manual:** Handles edge cases (schema versions, binary data, large datasets via streaming, table metadata). Writing a manual `db.table.toArray()` loop for each table works for simple cases but doesn't preserve schema info and can OOM on large datasets.

### Option B: Manual JSON Export (Simpler, Less Robust)

No additional dependency. Iterate all tables, serialize to JSON.

```ts
// Export
const backup = {};
for (const table of db.tables) {
  backup[table.name] = await table.toArray();
}
const json = JSON.stringify(backup);
// Save as .json file

// Import
const data = JSON.parse(jsonString);
await db.transaction('rw', db.tables, async () => {
  for (const table of db.tables) {
    await table.clear();
    await table.bulkAdd(data[table.name]);
  }
});
```

**Tradeoffs vs. dexie-export-import:**
- Pro: Zero dependency. Full control over format (plain JSON is human-readable, debuggable).
- Con: No schema metadata preservation. No streaming (loads full DB into memory). Must manually handle table order (foreign key dependencies). No progress callbacks.

### Decision: Use `dexie-export-import`

For a medical records database, robustness matters more than saving one dependency. The package handles schema evolution, streaming, and edge cases that a manual approach would need to reinvent.

**File format note:** The exported Blob is not plain JSON. If we want human-readable backups (for debugging or manual inspection), we could add a secondary "export as JSON" option using the manual approach. But the primary backup/restore should use `dexie-export-import` for reliability.

**File download approach:** Use the standard browser download pattern:
```ts
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `clinic-backup-${new Date().toISOString().slice(0,10)}.db`;
a.click();
URL.revokeObjectURL(url);
```

File import: `<input type="file">` to read the Blob back.

---

## 4. Urdu Translation Layer

No npm package needed. This is a static TypeScript map of English dosage/frequency/duration values to their Urdu equivalents.

**Structure:**
```ts
// src/data/urdu-translations.ts
export const urduDosage: Record<string, string> = {
  '1 tablet': '۱ گولی',
  '2 tablets': '۲ گولیاں',
  '1 teaspoon': '۱ چائے کا چمچ',
  // ...
};

export const urduFrequency: Record<string, string> = {
  'Once daily': 'دن میں ایک بار',
  'Twice daily': 'دن میں دو بار',
  'Three times daily': 'دن میں تین بار',
  // ...
};

export const urduDuration: Record<string, string> = {
  '3 days': '۳ دن',
  '5 days': '۵ دن',
  '7 days': '۷ دن',
  '1 week': 'ایک ہفتہ',
  // ...
};
```

This approach works because dosage/frequency/duration are selected from predefined dropdown options, not free-text. The Urdu map mirrors those exact options.

---

## 5. What NOT to Add

| Technology | Why It Seems Relevant | Why NOT to Add It |
|------------|----------------------|-------------------|
| `rtlcss` / `stylis-plugin-rtl` | RTL CSS transformation | Designed for full-page RTL apps. We only need targeted RTL on Urdu text spans. CSS `direction` + `unicode-bidi` is sufficient. |
| `react-i18next` / `i18next` | Internationalization | Overkill. We're not translating the UI into Urdu. Only printed prescription fields get Urdu text. A simple TS map is enough. |
| `intl-messageformat` | ICU message formatting | Same reason. No dynamic pluralization or complex message formatting needed. Static map covers it. |
| Google Fonts CDN | Font delivery | Breaks offline-first. Self-hosted via fontsource is the correct approach. |
| `@fontsource/noto-nastaliq-urdu` (static) | Alternative fontsource package | The variable font package (`@fontsource-variable/...`) is smaller for multi-weight usage and more flexible. Use variable. |
| `react-to-print` | Print triggering | Already evaluated in v1.0 STACK but not used. The app uses `window.print()` directly with CSS `@media print`. No reason to add it now. |
| `file-saver` | File download helper | The 4-line `URL.createObjectURL` + anchor click pattern does the same thing. No need for a dependency. |
| `jszip` | Compress backup files | Backup files for a single-doctor clinic will be small (likely <5MB even with years of data). Compression adds complexity without meaningful benefit. |
| Dexie Cloud | Managed sync service | Out of scope for v1.1. Backup/restore is local file-based, not cloud sync. |

---

## 6. New Dependencies Summary

### Runtime (production)

```bash
npm i @fontsource-variable/noto-nastaliq-urdu dexie-export-import
```

| Package | Version | Size Impact | Purpose |
|---------|---------|-------------|---------|
| `@fontsource-variable/noto-nastaliq-urdu` | 5.2.8 | ~330KB (woff2 font file) | Self-hosted Nastaliq font for Urdu rendering in web and print |
| `dexie-export-import` | 4.1.4 | Minimal JS (peer dep on existing dexie) | Full database export/import with schema preservation |

### Dev (none)

No new dev dependencies required.

### Config Changes

- **vite.config.ts:** No changes needed. Workbox `globPatterns` already includes `woff2`.
- **tailwind:** No changes. Urdu styles are applied via inline styles or a small CSS class, not Tailwind utilities.

---

## 7. Integration Notes

### Font Loading and Print

The font import (`import '@fontsource-variable/noto-nastaliq-urdu'`) injects a `@font-face` declaration. This works in both screen and print contexts. No separate print font loading needed.

However: Chrome's print preview may flash if the font isn't fully loaded. Since this is a PWA with the font cached by the service worker, it will be loaded from cache on subsequent visits. First install may have a brief FOUT (flash of unstyled text) in print preview.

### Dexie Version Compatibility

`dexie-export-import@4.1.4` declares `dexie ^4.0.1` as a peer dependency. Our `dexie@^4.3.0` satisfies this. The import is an addon that attaches to the existing Dexie instance.

### Existing Print Styles

Current `@media print` in `src/index.css` and `PrescriptionSlip.tsx` use `fontFamily: "'Segoe UI', Arial, sans-serif"`. Urdu text sections will need a font-family override to `'Noto Nastaliq Urdu Variable', serif`. This is a per-element override, not a global change. English text continues using the existing system font stack.

---

*Research date: 2026-03-06. Versions verified via `npm view`. Font size based on fontsource package contents.*
