# Pitfalls: v1.1 Urdu/RTL Print Support & Database Backup/Restore

Pitfalls specific to adding Nastaliq/RTL prescription printing and IndexedDB backup/restore to the existing ClinicSoftware PWA.

For v1.0 general pitfalls (IndexedDB eviction, SW updates, print layout basics), see git history of this file.

---

## Part A: Urdu/RTL Prescription Printing

### 1. Nastaliq Font Ligature Breakage

**The risk:** Nastaliq script (used for Urdu) relies heavily on complex ligatures and contextual shaping. Many fonts render isolated characters instead of connected Nastaliq forms if the shaping engine or font is wrong. Chrome and Edge use different text shaping pipelines, and older versions on Windows can silently fall back to Naskh (Arabic-style) rendering, which is technically readable but culturally wrong for a Pakistani clinic.

**What breaks:**
- Using a font that claims Nastaliq support but has incomplete ligature tables (e.g., some Google Fonts Urdu options)
- Chrome on older Windows (pre-Win10) sometimes fails to apply `liga`/`calt` OpenType features in print context
- Edge (Chromium) handles the same font differently than Chrome due to DirectWrite vs Skia differences
- Setting `font-feature-settings` incorrectly can disable required ligature substitutions

**Prevention:**
- Use **Jameel Noori Nastaliq** or **Noto Nastaliq Urdu** (Google Fonts). These have the most complete ligature tables for Urdu.
- Never set `font-feature-settings: "liga" 0` or `text-rendering: optimizeSpeed` on Urdu text, as both disable ligatures.
- Test on the actual target machine (old Windows + Chrome/Edge). Print preview is not sufficient; print to PDF and inspect glyph shapes.
- Include explicit `@font-face` with `unicode-range` so the Nastaliq font only activates for Urdu Unicode ranges (U+0600-U+06FF, U+FB50-U+FDFF, U+FE70-U+FEFF), keeping English text on Segoe UI.

**Phase:** Urdu support, first task. Font choice gates everything else.

---

### 2. Line-Height and Vertical Overflow with Nastaliq

**The risk:** Nastaliq script has extreme vertical extents. Descenders drop far below the baseline, and ascenders (especially with diacritics like zabar/zer/pesh) extend high. Standard `line-height: 1.5` causes overlap between lines. But setting line-height too high wastes space on the A5 slip, potentially pushing content to a second page.

**What breaks:**
- Table rows with Nastaliq text clip at the top/bottom if `overflow: hidden` is set (it is on many Tailwind utilities)
- `line-height` values that work on screen may clip in print due to different rendering
- Chrome and Edge compute Nastaliq line-height differently; Chrome is generally tighter

**Prevention:**
- Set `line-height: 2.0` to `2.4` specifically for Nastaliq containers. Test empirically on the target hardware.
- Use `overflow: visible` on table cells containing Urdu text.
- Add vertical padding to table cells (`py-2` minimum) rather than relying on line-height alone.
- Test with worst-case Urdu text: full diacritics (tashkeel), stacked marks, long words with deep descenders.
- Current `PrescriptionSlip.tsx` uses `text-sm` and tight padding (`py-1`). This will clip Nastaliq. The medication table rows need Urdu-specific vertical spacing.

**Phase:** Urdu support, alongside font integration. Must be tested on real printer.

---

### 3. RTL Layout Breaking in Print vs Screen

**The risk:** CSS `direction: rtl` behaves differently in `@media print` contexts across browsers. Common failures: flexbox `justify-content` reversal not applying in print, table column order not flipping, `text-align` defaulting to left in print even when RTL is set on screen.

**What breaks in this codebase specifically:**
- `PrescriptionSlip.tsx` uses `text-left` on all `<th>` and `<td>` elements. Adding `dir="rtl"` won't override hardcoded `text-left`.
- The `flex flex-wrap gap-x-6` patient info row will reverse item order in RTL, putting Date before Patient Name. This may or may not be desired.
- `@page` directive in `index.css` has no RTL-aware margin adjustment.
- Print-specific CSS uses `!important` extensively. RTL overrides will need equal specificity or they'll lose.

**Prevention:**
- Do NOT set `dir="rtl"` on the entire prescription slip. Use per-element `dir` attributes only on Urdu content (dosage, frequency, duration cells, Rx Notes).
- Replace `text-left` with `text-start` in table headers/cells. `text-start` respects the element's `dir` attribute.
- For mixed-direction table rows, use `dir="auto"` on individual `<td>` elements so the browser detects direction from content.
- Test print output specifically. Chrome DevTools print emulation does NOT accurately reproduce RTL print rendering. Use actual `Ctrl+P` and inspect the PDF.

**Phase:** Urdu support. Requires refactoring existing table CSS before adding Urdu content.

---

### 4. Mixed LTR/RTL Content in Medication Table

**The risk:** Each medication row has English content (brand name, salt, strength, form) and Urdu content (dosage, frequency, duration). Mixing directions in a single table row causes visual chaos: punctuation jumps to wrong positions, numbers appear on the wrong side of units, parentheses reverse.

**What breaks:**
- "1 tablet" in English next to Urdu dosage text causes the "1" to jump to the right side of the Urdu text due to Unicode Bidirectional Algorithm (BIDI) reordering.
- Parentheses, slashes, and hyphens in medication strings (e.g., "500mg/5ml") get BIDI-reordered when adjacent to RTL text.
- Screen rendering may look correct while print rendering breaks, because the print CSS changes element widths and triggers different BIDI line-break points.

**Prevention:**
- Wrap each LTR segment in `<span dir="ltr">` and each RTL segment in `<span dir="rtl">`. Do not rely on auto-detection for mixed content.
- Use Unicode control characters `\u200E` (LTR mark) and `\u200F` (RTL mark) as boundary markers in generated text that concatenates English and Urdu.
- Design the table so LTR columns (brand, salt, strength, form) are physically grouped on the left, and RTL columns (dosage, frequency, duration) are grouped on the right. Do not interleave.
- Consider making dosage/frequency/duration a single merged RTL cell per row instead of three separate columns, reducing BIDI boundary issues.

**Phase:** Urdu support. This is the hardest rendering problem; prototype it early.

---

### 5. Nastaliq Font File Size and Offline Caching

**The risk:** Nastaliq fonts are large. Noto Nastaliq Urdu WOFF2 is ~500KB (full), Jameel Noori Nastaliq can be 1-2MB as TTF. This font must be cached by the service worker for offline use. If it's not in the precache manifest, the first offline print will render in a fallback font (Arial/sans-serif), which cannot render Nastaliq properly.

**What breaks:**
- VitePWA's Workbox precache has a default `maximumFileSizeToCacheInBytes` of 2MB. Large TTF files may be excluded silently.
- The font file doesn't get hashed into the Vite build output unless explicitly configured, so Workbox's glob patterns may miss it.
- On the target old Windows machine with slow disk, a 2MB font fetch from the service worker cache can add visible delay to print rendering.

**Prevention:**
- Use WOFF2 format (not TTF/OTF). WOFF2 compression reduces Nastaliq fonts by ~30-50%.
- Subset the font to only the Urdu Unicode ranges needed. Tools: `pyftsubset` or `glyphhanger`. Target size: under 300KB.
- Place the font in `public/fonts/` so Vite copies it to the build output. Reference it with an absolute path in `@font-face`.
- Explicitly add the font path to VitePWA's `workbox.globPatterns` or `additionalManifestEntries`.
- Add a `font-display: swap` to the `@font-face` rule so English content renders immediately while the Nastaliq font loads.
- Verify the font is cached: in DevTools > Application > Cache Storage, confirm the font URL appears in the Workbox precache.

**Phase:** Urdu support, infrastructure task. Do this before any Urdu rendering work.

---

### 6. Browser-Specific Print Rendering on Old Windows

**The risk:** The target environment is "older Windows machines with Chrome/Edge." Chrome 90-110 on Windows 7/8.1 and Edge Legacy (pre-Chromium) have known print rendering bugs: incorrect `@page size`, missing `break-inside: avoid`, font substitution in print context.

**What breaks:**
- Windows 7 reached EOL in 2020. Chrome stopped supporting it in 2023 (Chrome 109). The doctor may be on a frozen Chrome version with known print bugs.
- Edge on old Windows may be the pre-Chromium EdgeHTML version, which has a completely different print engine and does not support `@page { size: A5 }`.
- Older Chromium versions render `direction: rtl` in print differently, especially inside `<table>`.
- Windows GDI text rendering (used by older Chrome) handles Nastaliq ligatures worse than DirectWrite.

**Prevention:**
- Determine the exact browser version on the target machine before development starts. This gates which CSS features are safe to use.
- If Chrome < 110, avoid relying on `@page size` and use explicit width/margin in mm instead.
- If Edge Legacy (EdgeHTML) is in play, it's a blocker for RTL print support. Recommend upgrading to Chromium Edge.
- Test with the exact browser version. Don't assume "Chrome" means "latest Chrome."
- Consider providing a "print instructions" overlay that tells the doctor to set paper size to A5, margins to None, and uncheck headers/footers.

**Phase:** Urdu support, prerequisite research. Must be done before writing any print CSS.

---

## Part B: Database Backup & Restore

### 7. IndexedDB Export: Blob and Binary Data Handling

**The risk:** `JSON.stringify()` cannot serialize `Blob`, `ArrayBuffer`, `Date`, or `undefined` values. If any table in the database contains these types (now or in the future), the export silently drops or corrupts that data. The backup file looks complete but is missing fields.

**What breaks in this codebase:**
- Current schema uses string dates (`createdAt`, `updatedAt` as ISO strings), so Date objects aren't a problem today. But if any field is later changed to store a `Date` object, export breaks silently.
- If a future feature adds image storage (e.g., patient photos as Blobs), the export pipeline breaks.
- `undefined` values in optional fields (`contact?`, `cnic?`, `drugId?`) are silently dropped by `JSON.stringify()`. On import, missing keys vs. `undefined` values may behave differently in Dexie queries.

**Prevention:**
- Use a custom `replacer` function with `JSON.stringify()` that explicitly handles or rejects non-serializable types. Throw on Blob/ArrayBuffer rather than silently dropping.
- For optional fields, normalize `undefined` to `null` before export so the key is preserved in JSON.
- Add a schema descriptor to the export file that lists expected fields per table. On import, validate field presence.
- Write a round-trip test: export the database, import to a fresh DB, export again, compare byte-for-byte.

**Phase:** Backup/restore, core implementation.

---

### 8. Large Dataset Export: Memory and Download Failures

**The risk:** `JSON.stringify()` on the entire database loads everything into memory at once. A clinic with 5,000+ patients and 20,000+ visits over several years could produce a 50-100MB JSON string. On an old Windows machine with limited RAM, this causes the tab to crash or the browser to kill the page. The doctor sees a blank screen and thinks data is lost.

**What breaks:**
- Dexie's `table.toArray()` loads all records into memory. For large tables, this alone can exhaust available memory.
- `JSON.stringify()` on a large object creates a second copy of the data in memory (the string).
- `URL.createObjectURL(new Blob([jsonString]))` creates a third copy.
- Peak memory usage: ~3x the database size. A 50MB database needs ~150MB of available memory.

**Prevention:**
- For v1.1 (single-doctor clinic, likely < 5,000 records), the naive approach is fine. But add a guard: before export, count total records across all tables. If > 10,000, warn the user.
- Export tables sequentially, not all at once. Stringify each table separately and concatenate into a JSON structure manually, releasing each array after stringifying.
- Use `const blob = new Blob([...chunks])` instead of building one massive string.
- For future-proofing: consider streaming export with NDJSON (one JSON line per record) if datasets grow large.
- Always wrap export in a try/catch and show a meaningful error ("Export failed, database may be too large") rather than letting the tab crash.

**Phase:** Backup/restore. Implement the simple approach first, add guards.

---

### 9. Import Validation: Schema Version Mismatch

**The risk:** The database schema evolves (currently at version 2). A backup from version 1 won't have `drugs`, `visits`, or `visitMedications` tables. A backup from a future version 3 might have fields the current code doesn't expect. Blindly importing without version checking corrupts the database or crashes the app.

**What breaks:**
- Importing a v1 backup into a v2 database leaves `drugs`, `visits`, and `visitMedications` empty. The app appears to work but has no prescription data.
- Importing a backup from a newer schema version may include fields that current Dexie indexes don't cover, causing silent data loss on the indexed fields.
- If the import replaces the entire database (delete-then-insert), a failure mid-import leaves the database in an inconsistent state: some tables imported, others empty.

**Prevention:**
- Include a metadata header in the export file: `{ version: 2, exportedAt: "...", tables: [...], recordCounts: {...} }`.
- On import, check `version` against the current schema version. If older, run migration logic (same as Dexie's version upgrade). If newer, reject with a clear message: "This backup was created by a newer version of the app. Please update the app first."
- Never delete existing data before confirming the import file is valid and complete. Parse and validate the entire file first, then replace.
- Use a Dexie transaction for the import: if any table fails to import, the entire operation rolls back.
- After import, run a sanity check: count records per table and compare to the metadata header's `recordCounts`.

**Phase:** Backup/restore. Schema validation is the first thing to implement, before the import logic.

---

### 10. Import: Corrupt or Tampered Backup Files

**The risk:** The backup file is a JSON file the doctor stores on their machine (or USB drive). It can be corrupted by incomplete downloads, text editor modifications, encoding issues (UTF-8 BOM), or even well-intentioned manual edits. A corrupt file that passes `JSON.parse()` but has wrong data types can silently corrupt the database.

**What breaks:**
- A UTF-8 BOM (`\uFEFF`) at the start of the file causes `JSON.parse()` to throw in some environments.
- A field that should be a string (e.g., `patientId: "2026-0001"`) imported as a number (`patientId: 2026`) breaks indexed queries.
- Missing required fields (e.g., a patient without `id`) cause Dexie `put()` to throw, but only for that record. If not in a transaction, previous records are already imported, leaving a partial state.
- Urdu text in the backup file requires UTF-8 encoding. If the file is saved as Windows-1252 (common on old Windows), Urdu characters become mojibake on import.

**Prevention:**
- Strip BOM before parsing: `jsonString.replace(/^\uFEFF/, '')`.
- Validate each record against the expected schema before inserting. Check: required fields present, correct types, string fields are strings, dates are valid ISO strings.
- Use `FileReader.readAsText(file, 'UTF-8')` explicitly when reading the import file.
- Show a pre-import summary: "This backup contains X patients, Y visits, Z medications. Created on [date]. Proceed?" This gives the doctor a chance to catch obvious problems (e.g., a backup with 0 patients).
- Wrap the entire import in a single Dexie transaction so it's all-or-nothing.

**Phase:** Backup/restore. Validation layer.

---

### 11. Import Overwrites Current Data Without Warning

**The risk:** If the import does a full database replace, the doctor could accidentally overwrite 6 months of new data with a 6-month-old backup. There's no undo. For a clinic with no cloud sync, this is catastrophic data loss.

**Prevention:**
- Before import, auto-export the current database as a timestamped backup file. Download it to the doctor's machine before proceeding.
- Show a clear warning: "This will replace ALL current data with the backup. Current data will be downloaded as a safety backup first."
- Consider a merge strategy for future versions. For v1.1, full replace with auto-backup-first is sufficient.
- Never auto-import. Always require explicit user confirmation after showing the summary.

**Phase:** Backup/restore. UX design decision.

---

## Integration Pitfalls (Cross-Cutting)

### 12. Urdu Text in Backup Files

**The risk:** Urdu text stored in IndexedDB (Rx Notes in Urdu, dosage/frequency/duration translations) must survive the export-import round trip. JSON supports Unicode natively, but edge cases exist.

**What breaks:**
- `JSON.stringify()` escapes non-ASCII characters to `\uXXXX` by default in some environments. This is valid JSON but makes the backup file unreadable if opened in a text editor (important for debugging).
- If the export writes the file with `Content-Type: application/json; charset=ascii`, Urdu characters are escaped. Use `charset=utf-8`.
- Nastaliq text with zero-width joiners (ZWJ, U+200D) and other invisible Unicode characters can be stripped by naive sanitization.

**Prevention:**
- Use `new Blob([jsonString], { type: 'application/json;charset=utf-8' })` for the export download.
- Never strip or sanitize Unicode control characters in the U+200C-U+200F range (ZWNJ, ZWJ, LRM, RLM). These are structurally significant for Urdu text rendering.
- Add a round-trip test specifically for Urdu text: export a record with Urdu dosage text, import it, verify the text renders identically in the PrescriptionSlip.

**Phase:** Must be tested after both features are implemented.

---

### 13. Service Worker Cache Invalidation After Adding Font Assets

**The risk:** Adding a Nastaliq font file changes the set of precached assets. If the service worker update doesn't trigger correctly, users on the old cached version won't have the font file. Their prescriptions will print with a fallback font (no Nastaliq), and they won't know anything is wrong until they see the printout.

**Prevention:**
- After adding the font to the build, verify the service worker's precache manifest includes it. Check `dist/sw.js` or `dist/workbox-*.js` for the font filename.
- Test the upgrade path: load the app with the old SW, then deploy the new version, verify the "update available" flow, and confirm the font is cached after update.
- Include the font in a Workbox `runtimeCaching` strategy as a fallback, in case the precache misses it.

**Phase:** Urdu support, deployment verification.

---

## Summary: Phase Mapping

| # | Pitfall | Phase | Severity |
|---|---------|-------|----------|
| 1 | Nastaliq ligature breakage | Urdu: font selection | High |
| 2 | Line-height/vertical overflow | Urdu: font integration | High |
| 3 | RTL print vs screen | Urdu: layout | High |
| 4 | Mixed LTR/RTL in tables | Urdu: layout | High |
| 5 | Font file size + caching | Urdu: infrastructure | Medium |
| 6 | Old Windows browser rendering | Urdu: prerequisite | High |
| 7 | Blob/binary in export | Backup: core | Medium |
| 8 | Large dataset memory | Backup: core | Low (for now) |
| 9 | Schema version mismatch | Backup: validation | High |
| 10 | Corrupt backup files | Backup: validation | High |
| 11 | Import overwrites without warning | Backup: UX | High |
| 12 | Urdu text in backup round-trip | Integration | Medium |
| 13 | SW cache after font addition | Integration | Medium |

---

## Recommended Execution Order

1. **Determine target browser version** (#6) - gates all CSS decisions
2. **Select and subset Nastaliq font, configure SW caching** (#5, #13)
3. **Refactor table CSS for directional neutrality** (#3) - `text-left` to `text-start`, etc.
4. **Implement per-cell RTL with BIDI isolation** (#4)
5. **Tune line-height/padding for Nastaliq** (#2) - requires real printer testing
6. **Verify ligature rendering on target hardware** (#1)
7. **Implement export with metadata header** (#7, #8, #12)
8. **Implement import with schema validation** (#9, #10)
9. **Add pre-import auto-backup** (#11)
10. **End-to-end round-trip test with Urdu data** (#12)

---

*Research based on: existing codebase analysis (PrescriptionSlip.tsx, PrintVisitPage.tsx, index.css, db/index.ts), Dexie.js v4 documentation, CSS Writing Modes spec, Unicode BIDI algorithm, Chromium print rendering known issues.*
