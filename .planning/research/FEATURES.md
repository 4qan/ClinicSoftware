# Feature Research: Urdu Prescription Printing & Database Backup/Restore

Research for v1.1 milestone. Context: single-doctor offline PWA, walk-in clinic in Pakistan, A5 prescription slips, patients are often low-literacy Urdu speakers.

---

## 1. Urdu on Pakistani Clinic Prescriptions: How It Actually Works

### What's in English vs Urdu in practice

Pakistani prescriptions are bilingual by convention, not by choice. The medical system trains in English, but the patient reads Urdu (if they read at all).

| Element | Typical Language | Why |
|---------|-----------------|-----|
| Doctor name / clinic name | English or bilingual | Branding, sometimes Urdu on signage |
| Drug brand name | English | Brand names are English (Panadol, Augmentin). Always English. |
| Salt/generic name | English | Medical terminology, never translated |
| Strength (500mg, 10ml) | English numerals | Universal |
| Form (tablet, syrup) | English | Sometimes Urdu verbally, rarely on print |
| **Dosage** (1 tablet, 5ml) | **Urdu** | Patient-facing. "ایک گولی" is what a pharmacist or family member reads aloud. |
| **Frequency** (twice daily, after meals) | **Urdu** | Patient-facing. "دن میں دو بار" or "کھانے کے بعد". |
| **Duration** (5 days, 1 month) | **Urdu** | Patient-facing. "پانچ دن". |
| **Rx Notes / instructions** | **Urdu** | "خالی پیٹ لیں", "دودھ کے ساتھ نہ لیں". Free-text, doctor writes in Urdu. |
| Clinical notes | English | Doctor-facing, not printed for patient (or printed small). |

**Key insight:** Drug identification stays English. Patient instructions go Urdu. The prescription is a hybrid document.

### What patients actually expect

1. **They don't read the prescription themselves.** A family member or pharmacist reads it to them. Urdu text makes this possible without the pharmacist guessing.
2. **Nastaliq script, not Naskh.** Pakistani Urdu uses Nastaliq (slanted calligraphic style). Naskh (Arabic-style) looks "foreign" and reduces trust. Jameel Noori Nastaleeq or Alvi Nastaliq are the standard fonts.
3. **RTL text must not break the layout.** Mixed English/Urdu on the same line is common. BiDi handling must be correct.
4. **Numbers stay Western (1, 2, 3), not Eastern Arabic numerals.** Pakistani convention uses Western numerals even in Urdu text.

---

## 2. Urdu Prescription Printing: Feature Breakdown

### Table Stakes

| # | Feature | Complexity | Dependencies | Notes |
|---|---------|-----------|--------------|-------|
| U1 | **Urdu translation map for predefined options** | Low | `clinical.ts` constants | Static map: English string -> Urdu string for all DOSAGE_OPTIONS, FREQUENCY_OPTIONS, DURATION_OPTIONS. ~45 entries. One-time translation work. |
| U2 | **Urdu text on printed prescription** (dosage, frequency, duration columns) | Medium | U1, PrescriptionSlip.tsx | Replace English values with Urdu equivalents in the print layout only. Input stays English (doctor selects from dropdowns). |
| U3 | **Nastaliq font loaded for print** | Low | None | Embed Jameel Noori Nastaleeq or similar via @font-face. Only needed for print CSS, not the whole UI. ~2-4MB font file. Self-hosted (offline requirement). |
| U4 | **RTL handling in print layout** | Medium | U2, U3 | Urdu columns need `dir="rtl"`. Mixed LTR/RTL in the same table row. CSS `unicode-bidi` and `direction` properties. Test carefully on Chrome print. |
| U5 | **Rx Notes English/Urdu toggle** | Medium | Visit form | Toggle button on the rxNotes textarea. When Urdu: set `dir="rtl"`, switch font to Nastaliq, store language metadata with the note. |
| U6 | **Rx Notes print in original language** | Low | U5 | Print component reads language metadata and applies correct `dir` and font. |

### Differentiators

| # | Feature | Complexity | Dependencies | Why It Stands Out |
|---|---------|-----------|--------------|-------------------|
| U7 | **Bilingual prescription layout** (English row + Urdu row per medication) | Medium | U1, U2 | Instead of replacing English with Urdu, show both. Doctor reads English, patient/pharmacist reads Urdu. Professional appearance. |
| U8 | **Urdu clinic header** (doctor name, clinic name in Urdu) | Low | Settings page, ClinicInfo | Add Urdu name fields in clinic settings. Print header shows both English and Urdu. Builds patient trust. |
| U9 | **Form labels in Urdu on print** (column headers) | Low | U2 | "دوا", "خوراک", "دورانیہ" instead of "Medicine", "Dosage", "Duration" on the slip. Small touch, big perception shift. |

### Anti-Features (Skip These)

| Feature | Why Not |
|---------|---------|
| **Full Urdu UI** (menus, buttons, navigation) | Doctor is comfortable with English UI. Translating the entire interface adds massive maintenance burden for zero workflow improvement. The Urdu need is print-only. |
| **Urdu keyboard / IME integration** | OS-level concern. Windows already has Urdu keyboard support. Building a custom on-screen keyboard is wasted effort. Just set `dir="rtl"` and let the OS handle input. |
| **Custom Urdu translations per doctor** | Predefined options cover 95% of cases. Letting the doctor edit translations creates a settings page nobody will use and introduces typo risk in Urdu text. |
| **Urdu autocomplete for drugs** | Drug names are English. Searching in Urdu for "پیراسیٹامول" adds fuzzy matching complexity with no real use case. |
| **Multiple Urdu fonts / font picker** | One good Nastaliq font is enough. Font selection is a rabbit hole that doesn't improve prescriptions. |

---

## 3. Database Backup & Restore: Feature Breakdown

### How medical/clinic software handles this

**Pattern 1: Manual file export (most common in offline tools)**
- One button: "Export Backup" downloads a JSON/SQLite file to the user's Downloads folder.
- One button: "Restore from Backup" opens a file picker, reads the file, replaces or merges data.
- File is timestamped: `ClinicSoftware-backup-2026-03-06.json`
- This is the right pattern for this project. Simple, no cloud dependency, doctor can copy the file to a USB drive.

**Pattern 2: Auto-backup to local filesystem**
- Periodic auto-export. Not feasible in a PWA (no filesystem write access without File System Access API, which has poor support).
- Skip this.

**Pattern 3: Cloud backup**
- Out of scope per PROJECT.md. Deferred to future milestone.

### Table Stakes

| # | Feature | Complexity | Dependencies | Notes |
|---|---------|-----------|--------------|-------|
| B1 | **Full database export to JSON** | Low | Dexie.js tables | Export all tables (patients, visits, visitMedications, drugs, settings, recentPatients) as a single JSON file. Include schema version for forward compatibility. |
| B2 | **Full database restore from JSON** | Medium | B1 | File picker, validate JSON structure, confirm before overwrite, clear existing data, import all tables. Must handle version mismatches gracefully. |
| B3 | **Backup reminder after N visits** | Low | Visit creation flow | After every N visits (configurable, default 20), show a non-blocking reminder: "You haven't backed up in X visits. Back up now?" Dismissible. Stored as a counter in settings. |
| B4 | **Backup metadata in the file** | Low | B1 | Include in the JSON: export date, app version, record counts per table, schema version. Shown during restore so the doctor knows what they're restoring. |

### Differentiators

| # | Feature | Complexity | Dependencies | Why It Stands Out |
|---|---------|-----------|--------------|-------------------|
| B5 | **Selective restore** (choose which tables to restore) | Medium | B2 | "Restore only patients" or "Restore only drugs." Useful if the doctor wants to move the drug list to a new device without overwriting patient data. |
| B6 | **Merge mode** (import without overwriting existing records) | High | B2 | Instead of full overwrite, merge by ID. Skip existing records, add new ones. Complex: needs conflict detection, duplicate ID handling. |
| B7 | **Backup file encryption** | Medium | B1 | Encrypt the JSON with the user's password before download. Protects patient data if the USB drive is lost. Adds complexity to restore (must decrypt first). |

### Anti-Features (Skip These)

| Feature | Why Not |
|---------|---------|
| **Automatic scheduled backups** | PWA can't write to filesystem without user interaction. A reminder is the practical equivalent. |
| **Incremental / differential backups** | Single-user, moderate data volume. Full export is fast and simple. Incremental adds change-tracking complexity for negligible time savings. |
| **Cloud backup (Google Drive, Dropbox)** | Out of scope per PROJECT.md. Adds OAuth, API integration, and connectivity dependency. Deferred to cloud sync milestone. |
| **Multiple backup history / versioning** | The doctor will have one USB drive with one file. Version management UI is wasted. They can rename files manually. |
| **Import from other clinic software** | No standard format exists. Building CSV/XML parsers for unknown schemas is speculative work. |

---

## 4. Implementation Dependencies

```
Urdu Printing:
  U1 (translation map) -- pure data, no deps
    -> U2 (print layout) -- depends on U1, PrescriptionSlip.tsx
    -> U3 (Nastaliq font) -- independent, CSS only
    -> U4 (RTL layout)   -- depends on U2, U3
  U5 (Rx Notes toggle)   -- independent of U1-U4, touches Visit form
    -> U6 (Rx Notes print) -- depends on U5

Database Backup:
  B1 (export) -- depends on db/index.ts schema
    -> B4 (metadata) -- extends B1
    -> B2 (restore) -- depends on B1 format
    -> B3 (reminder) -- independent, touches visit creation
```

### Recommended build order for v1.1:
1. U1 + U3 (translation map + font, parallel, no risk)
2. U2 + U4 (print layout changes, test on Chrome print dialog)
3. U5 + U6 (Rx Notes toggle, independent track)
4. B1 + B4 (export with metadata)
5. B2 (restore)
6. B3 (reminder)

### Key technical considerations

- **Font file size:** Nastaliq fonts are large (2-4MB). Must be included in the PWA cache via VitePWA config. Test that the service worker handles it.
- **Print testing:** `@media print` behaves differently across browsers. Chrome on Windows is the target. RTL in print CSS is a known pain point, needs real testing.
- **Dexie export:** Dexie has no built-in export. Use `table.toArray()` for each table, serialize to JSON. Straightforward but verbose.
- **Restore safety:** Must confirm before overwrite. Consider a "last backup date" display in settings so the doctor knows how stale their backup is.
- **Schema versioning:** The JSON file must include the Dexie schema version. If the app schema has advanced past the backup's version, the restore logic needs to handle migration or reject incompatible files.

---

*Last updated: 2026-03-06*
