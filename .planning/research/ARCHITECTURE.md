# Architecture: v1.1 Urdu Prescription Printing & Backup/Restore

Reference: `.planning/PROJECT.md` for requirements and constraints.

## 1. Translation Mapping Approach

### Where to put English-to-Urdu mappings

Single file: `src/constants/translations.ts`

```ts
// Record<EnglishString, UrduString> for each category
export const DOSAGE_URDU: Record<string, string> = {
  '1/2 tablet':  'آدھی گولی',
  '1 tablet':    'ایک گولی',
  '2 tablets':   'دو گولیاں',
  // ... all DOSAGE_OPTIONS entries
}

export const FREQUENCY_URDU: Record<string, string> = {
  'Once daily':   'دن میں ایک بار',
  'Twice daily':  'دن میں دو بار',
  // ... all FREQUENCY_OPTIONS entries
}

export const DURATION_URDU: Record<string, string> = {
  '5 days':   'پانچ دن',
  '7 days':   'سات دن',
  // ... all DURATION_OPTIONS entries
}

// Single lookup: returns Urdu if mapping exists, English fallback otherwise
export function toUrdu(
  category: 'dosage' | 'frequency' | 'duration',
  english: string
): string
```

**Why a flat Record and not a more complex i18n system:** The translation scope is tiny (roughly 50 strings across 3 categories). These are not UI labels; they are clinical data values that appear only on printed output. A full i18n library (react-intl, i18next) would be overhead for zero benefit. A plain lookup map is debuggable, type-safe, and has no runtime dependencies.

**Custom/freeform values:** The ComboBox allows typing custom values not in the predefined lists. Custom values will NOT have Urdu mappings and will print as-is (English). This is the correct behavior: if the doctor types a custom dosage, it's their string and should print verbatim.

### Print-time Translation vs Store-time Translation

**Decision: Print-time translation.**

Rationale:

| Factor | Print-time | Store-time |
|--------|-----------|------------|
| DB schema change | None | Would need `dosageUrdu`, `frequencyUrdu`, `durationUrdu` fields |
| Migration risk | None | Must backfill all existing VisitMedication rows |
| Data integrity | English remains the source of truth for clinical data | Two sources of truth, can drift |
| Flexibility | Can change translations without touching stored data | Translation baked into records forever |
| Performance | Map lookup at render time (negligible, <50 entries) | N/A |
| Custom values | Fall through to English naturally | Must handle missing translations at write time |

Store-time would require a Dexie schema migration (version 3), backfill logic, and ongoing synchronization between English and Urdu fields. For a feature that only affects printed output, this complexity is not justified.

**Implementation:** `PrescriptionSlip.tsx` and `DispensarySlip.tsx` call `toUrdu()` at render time on `med.dosage`, `med.frequency`, `med.duration`. The DB stores English strings only, exactly as it does today.

## 2. RTL/Mixed-Direction CSS Strategy

### The problem

The prescription table has LTR columns (Brand Name, Salt, Strength, Form) and RTL columns (Dosage, Frequency, Duration in Urdu). This is a mixed-direction table, not a fully RTL page.

### Strategy: Column-level `dir` attributes, not page-level RTL

```
Table direction: LTR (unchanged)
Columns 1-5 (#, Brand, Salt, Strength, Form): LTR, left-aligned
Columns 6-8 (Dosage, Freq, Duration): RTL, right-aligned, Nastaliq font
```

Implementation:
- The `<table>` stays `dir="ltr"` (default).
- Urdu `<td>` cells get `dir="rtl"` and a CSS class for the Nastaliq font.
- Column headers for Dosage/Freq/Duration get bilingual labels or Urdu-only labels on print (design decision to make during implementation).

CSS additions to `index.css` inside `@media print`:

```css
.urdu-cell {
  direction: rtl;
  unicode-bidi: embed;
  font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
  text-align: right;
}
```

**Why not flip the entire table to RTL:** Brand names, salt names, and strengths are English/Latin-script. Flipping the table would misalign those columns and create a confusing reading order. The doctor's patients read Urdu dosage instructions but drug names are always in English.

### Rx Notes RTL

The `rxNotes` field needs an English/Urdu toggle. When in Urdu mode:
- The `<textarea>` gets `dir="rtl"` and the Nastaliq font.
- The stored value includes a direction marker (either a prefix convention or a separate `rxNotesLang` field on Visit).

**Recommendation:** Add `rxNotesLang: 'en' | 'ur'` to the Visit interface. This is a minor schema addition (Dexie version 3) but avoids fragile string-prefix hacking. The print components read this field to set the correct `dir` on the notes block.

## 3. Font Loading Strategy for Offline PWA

### Font choice

**Noto Nastaliq Urdu** (Google Fonts). Open source, good Nastaliq rendering, available as `.woff2`.

### Loading approach

1. Download `NotoNastaliqUrdu-Regular.woff2` and `NotoNastaliqUrdu-Bold.woff2` into `public/fonts/`.
2. Declare `@font-face` in `index.css`:

```css
@font-face {
  font-family: 'Noto Nastaliq Urdu';
  src: url('/ClinicSoftware/fonts/NotoNastaliqUrdu-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

3. The Vite PWA workbox config already globs `**/*.woff2`, so the font will be precached by the service worker automatically. No config change needed.

**Why self-hosted, not Google Fonts CDN:** The app is offline-first on unreliable internet. CDN fonts would fail to load on first visit without internet. Self-hosting with SW precaching guarantees the font is available from the very first print.

**File size concern:** Noto Nastaliq Urdu Regular is approximately 600KB as woff2. This is a one-time download, cached by the service worker. Acceptable for a clinic app that stays installed.

## 4. Dexie Export/Import Architecture

### Export (Backup)

```ts
// src/db/backup.ts

interface BackupPayload {
  version: number          // DB schema version (currently 2, will be 3)
  exportedAt: string       // ISO timestamp
  appVersion: string       // from package.json
  tables: {
    patients: Patient[]
    visits: Visit[]
    visitMedications: VisitMedication[]
    drugs: Drug[]
    settings: AppSettings[]
    recentPatients: RecentPatient[]
  }
}

async function exportDatabase(): Promise<BackupPayload>
```

Implementation:
1. Read all rows from each Dexie table via `db.patients.toArray()`, etc.
2. Build the `BackupPayload` object.
3. `JSON.stringify` it.
4. Trigger download via `URL.createObjectURL(new Blob([json]))` + temporary `<a>` element.
5. Filename: `clinic-backup-YYYY-MM-DD-HHmm.json`

### Import (Restore)

```ts
async function importDatabase(file: File): Promise<{ success: boolean; error?: string }>
```

Implementation:
1. Parse JSON, validate shape and `version` field.
2. Version compatibility check: if `payload.version > currentSchemaVersion`, reject with "Please update the app first."
3. **Clear all existing data** (confirm with user first via dialog).
4. Bulk-insert all tables inside a single Dexie transaction.
5. If `payload.version < currentSchemaVersion`, run migration transforms on the data before inserting (e.g., add default values for new fields).

### Version migration strategy

The `version` field in the backup enables forward compatibility:
- v2 backup imported into v3 app: the import function adds default `rxNotesLang: 'en'` to all Visit records before inserting.
- v3 backup imported into v2 app: rejected ("Please update the app").

### Auto-backup reminder

Store `lastBackupDate` and `visitsSinceBackup` in the `settings` table. After each visit creation, increment the counter. When it crosses a threshold (configurable, default 20), show a non-blocking banner suggesting backup. Reset counter after export.

## 5. Integration Points

### Existing files that need modification

| File | Change | Scope |
|------|--------|-------|
| `src/constants/clinical.ts` | No change. Translation map references these values but lives in its own file. | None |
| `src/components/PrescriptionSlip.tsx` | Import `toUrdu()`, apply to dosage/freq/duration cells. Add `dir="rtl"` + `urdu-cell` class to those `<td>` elements. Add Nastaliq font to Urdu cells. Handle `rxNotesLang` for notes direction. | Medium |
| `src/components/DispensarySlip.tsx` | Same Urdu cell treatment as PrescriptionSlip. Dispensary slip does NOT need Rx Notes. | Small |
| `src/components/MedicationEntry.tsx` | No change for Urdu (translation is print-only). | None |
| `src/db/index.ts` | Add Dexie version 3 schema with `rxNotesLang` on Visit interface. | Small |
| `src/index.css` | Add `@font-face` for Noto Nastaliq Urdu. Add `.urdu-cell` print styles. | Small |
| `vite.config.ts` | No change needed (woff2 already in glob pattern). | None |
| `src/db/settings.ts` | Add `lastBackupDate` and `visitsSinceBackup` helpers. | Small |
| `src/db/visits.ts` | Add `rxNotesLang` to `CreateVisitData` and `UpdateVisitData`. | Small |

### New files to create

| File | Purpose |
|------|---------|
| `src/constants/translations.ts` | English-to-Urdu mapping records + `toUrdu()` function |
| `src/db/backup.ts` | `exportDatabase()` and `importDatabase()` functions |
| `src/components/BackupRestore.tsx` | UI for export button, import file picker, confirmation dialog |
| `src/components/RxNotesInput.tsx` | Textarea with English/Urdu toggle (sets `dir`, font, tracks language) |
| `public/fonts/NotoNastaliqUrdu-Regular.woff2` | Self-hosted font file |
| `public/fonts/NotoNastaliqUrdu-Bold.woff2` | Self-hosted font file (for headers if needed) |

### Components/pages that surface the new features

- **Visit form page** (wherever it lives): Replace plain `<textarea>` for rxNotes with `<RxNotesInput>`.
- **Settings page**: Add `<BackupRestore>` section.
- **App layout / header**: Auto-backup reminder banner (conditional render based on `visitsSinceBackup`).

## 6. Suggested Build Order

Dependencies flow top-to-bottom. Each phase depends on the one above.

| Phase | What | Why first |
|-------|------|-----------|
| **1. Font + CSS** | Download Nastaliq woff2, add `@font-face`, add `.urdu-cell` print styles | Zero-risk foundation. Can verify font renders correctly in isolation. |
| **2. Translation map** | Create `translations.ts` with all mappings + `toUrdu()` | Pure data + pure function. Independently testable. No component changes yet. |
| **3. Prescription print Urdu** | Modify `PrescriptionSlip.tsx` to use `toUrdu()` on dosage/freq/duration cells with RTL styling | Core deliverable. Depends on phases 1-2. Can test by printing an existing visit. |
| **4. Dispensary print Urdu** | Same treatment on `DispensarySlip.tsx` | Near-identical change to phase 3. |
| **5. Rx Notes toggle** | Dexie v3 migration (add `rxNotesLang`), create `RxNotesInput.tsx`, wire into visit form, update print components | Requires schema migration. Separate from the medication Urdu work so that phases 3-4 can ship independently. |
| **6. Backup/Restore** | Create `backup.ts`, `BackupRestore.tsx`, wire into Settings | Independent of Urdu work. Can be built in parallel with phases 3-5 if desired. |
| **7. Auto-backup reminder** | Counter logic in settings, banner component | Depends on phase 6 (needs export to exist). Low priority, polish feature. |

### Parallelism opportunities

- Phases 1-4 (Urdu printing) and Phase 6 (backup/restore) are fully independent. They can be built by separate work streams or interleaved.
- Phase 5 (Rx Notes) has a schema migration dependency. If backup/restore (phase 6) ships first, the backup format must account for the upcoming v3 schema. Recommendation: build phase 5 before or alongside phase 6 so the schema version is settled.

---
*Produced: 2026-03-06. Feeds into v1.1 implementation plan.*
