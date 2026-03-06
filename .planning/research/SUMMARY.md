# v1.1 Research Summary: Urdu Prescription Printing & Database Backup

Synthesis of STACK.md, FEATURES.md, ARCHITECTURE.md, and PITFALLS.md. Consumed by the requirements and roadmap phases.

---

## 1. Stack Additions

Two new runtime dependencies. No new dev deps. No config changes needed.

```bash
npm i @fontsource-variable/noto-nastaliq-urdu dexie-export-import
```

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| `@fontsource-variable/noto-nastaliq-urdu` | 5.2.8 | ~330KB woff2 | Self-hosted Nastaliq font for Urdu print rendering |
| `dexie-export-import` | 4.1.4 | Minimal (peers on existing Dexie 4.3.x) | Full DB export/import with schema preservation, streaming |

Workbox `globPatterns` already includes `woff2`, so the font is auto-precached by the service worker.

---

## 2. Feature Scope

### Table Stakes

| ID | Feature | Track |
|----|---------|-------|
| U1 | Urdu translation map (dosage, frequency, duration): ~50 static entries | Urdu |
| U2 | Urdu text on printed prescription (dosage/freq/duration columns) | Urdu |
| U3 | Nastaliq font loaded and cached for print | Urdu |
| U4 | RTL handling in print layout (per-cell, not page-level) | Urdu |
| U5 | Rx Notes English/Urdu toggle (with `rxNotesLang` schema field) | Urdu |
| U6 | Rx Notes print in correct direction/font | Urdu |
| B1 | Full database export to file | Backup |
| B2 | Full database restore from file | Backup |
| B3 | Backup reminder after N visits (default 20) | Backup |
| B4 | Backup metadata (date, app version, schema version, record counts) | Backup |

### Differentiators (nice-to-have)

| ID | Feature | Notes |
|----|---------|-------|
| U7 | Bilingual layout (English + Urdu per medication row) | Professional appearance, aids pharmacist |
| U8 | Urdu clinic header (doctor/clinic name in Urdu) | Builds patient trust |
| U9 | Urdu column headers on print | Small effort, big perception shift |
| B5 | Selective restore (choose which tables) | Useful for migrating drug lists to new devices |

### Anti-Features (do NOT build)

- Full Urdu UI (menus, buttons, navigation). Doctor works in English.
- Urdu keyboard/IME. OS handles this.
- Custom Urdu translations per doctor. Predefined options cover 95%.
- Urdu drug name search. Drug names are always English.
- Multiple font picker. One Nastaliq font is enough.
- Auto-scheduled backups. PWA can't write to filesystem without user action.
- Cloud backup. Out of scope for v1.1.
- Incremental/differential backups. Full export is fast for this data volume.
- Merge-mode restore. Full replace with auto-backup-first is sufficient for v1.1.

---

## 3. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Translation approach** | Print-time lookup via `toUrdu()` | No schema migration for Urdu fields. English stays source of truth. Custom freeform values fall through to English. |
| **Translation storage** | `src/constants/translations.ts`, flat `Record<string, string>` maps | ~50 static entries. i18n library is overkill. |
| **RTL strategy** | Per-cell `dir="rtl"` + `unicode-bidi: isolate` on Urdu content only | Page stays LTR. Table structure unchanged. LTR columns grouped left, RTL columns grouped right. |
| **Font delivery** | fontsource variable font, imported in app entry point | Self-hosted for offline. Variable = single file for all weights. SW precaches automatically. |
| **Rx Notes language** | New `rxNotesLang: 'en' \| 'ur'` field on Visit (Dexie schema v3) | Avoids fragile string-prefix hacking. Print components read this for `dir` and font. |
| **Backup format** | `dexie-export-import` Blob (primary) | Handles schema evolution, streaming, binary data. More robust than manual JSON for medical records. |
| **Backup download** | `URL.createObjectURL` + anchor click | No `file-saver` dependency needed. |
| **Import safety** | Validate-then-replace inside Dexie transaction. Auto-export current DB before import. | All-or-nothing. Doctor can't accidentally lose data. |

---

## 4. Build Order

Urdu (phases 1-5) and Backup (phase 6) are independent tracks. Constraint: phase 5 (Rx Notes schema v3) should settle before phase 6 so the backup format accounts for the new schema.

| Phase | What | Depends On |
|-------|------|------------|
| **1. Font + CSS** | Install fontsource package, add `.urdu-cell` print styles, verify SW caches font | Nothing |
| **2. Translation map** | Create `translations.ts` with all mappings + `toUrdu()` | Nothing |
| **3. Prescription print Urdu** | Modify `PrescriptionSlip.tsx`: apply `toUrdu()`, add RTL styling to dosage/freq/duration cells | Phases 1, 2 |
| **4. Dispensary print Urdu** | Same treatment on `DispensarySlip.tsx` | Phase 3 |
| **5. Rx Notes toggle** | Dexie v3 migration (`rxNotesLang`), `RxNotesInput.tsx`, wire into visit form + print | Phases 1, 2 |
| **6. Backup/Restore** | `backup.ts`, `BackupRestore.tsx`, wire into Settings, validation layer | Phase 5 (for schema version) |
| **7. Auto-backup reminder** | Counter logic in settings, non-blocking banner | Phase 6 |

---

## 5. Critical Pitfalls

Top 5 that must be addressed.

| # | Pitfall | Phase | Mitigation |
|---|---------|-------|------------|
| 1 | **Mixed LTR/RTL breaking table layout**: dosage numbers jump sides, punctuation reverses | Phase 3 | Per-cell `dir` attributes. LTR columns left, RTL right. `unicode-bidi: isolate`. Wrap each direction in explicit `<span dir>`. |
| 2 | **Nastaliq line-height clipping**: Urdu text cut off in table rows | Phase 1 | `line-height: 2.0-2.4` for Nastaliq containers. `overflow: visible` on Urdu cells. Minimum `py-2` padding. Test with worst-case diacritics. |
| 3 | **Import overwrites data without safety net**: doctor restores old backup, loses months of records | Phase 6 | Auto-export current DB before import. Confirmation dialog with record counts. All-or-nothing Dexie transaction. |
| 4 | **Schema version mismatch on import**: silent data loss from incompatible backup | Phase 6 | Version in export metadata. Older backup: migration transforms. Newer backup: reject with "update app" message. Validate before deleting. |
| 5 | **RTL differences in print vs screen**: looks correct on screen, broken on paper | Phase 3 | Do NOT rely on Chrome DevTools print emulation. Test with actual Ctrl+P. Replace `text-left` with `text-start`. Match `!important` specificity. |

---

## 6. What NOT to Do

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Set `dir="rtl"` on `<html>` or the whole prescription slip | Breaks all English content layout. RTL is per-element only. |
| Use `rtlcss` / `stylis-plugin-rtl` or any RTL CSS library | Designed for full RTL apps. We need targeted RTL on specific spans. |
| Use `react-i18next` or any i18n framework | 50 static strings don't justify a framework. Plain TS map. |
| Load font from Google Fonts CDN | Breaks offline-first. Must be self-hosted and SW-cached. |
| Store Urdu translations in the database | Creates two sources of truth. Translate at print-time from English source. |
| Delete DB before validating import file | Partial failure = total data loss. Validate first, replace in transaction. |
| Set `font-feature-settings: "liga" 0` on Urdu text | Disables Nastaliq ligatures, rendering broken isolated characters. |
| Use `font-display: optional` for the Nastaliq font | Font may not load for print. Use `font-display: swap`. |
| Strip Unicode control characters (U+200C-U+200F) | Structurally significant for Urdu text rendering (ZWJ, ZWNJ, LRM, RLM). |

---

*Synthesized: 2026-03-06. Source: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
