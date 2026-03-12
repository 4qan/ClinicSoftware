# Milestones

## v1.2 Print Customization (Shipped: 2026-03-12)

**Phases completed:** 2 phases, 4 plans, 11 tasks
**Timeline:** 2 days (2026-03-11 to 2026-03-12)
**Stats:** 16 commits, 20 files, 10,666 LOC (TypeScript/React)
**Git range:** feat(10-01) to fix(11-02)

**Key accomplishments:**
- Print settings data layer with independent paper size persistence per slip type
- Dynamic @page CSS injection and conditional slip rendering for clean print isolation
- Proportional scaling infrastructure (calcScale from A5 baseline, URDU_LINE_HEIGHTS per size)
- PrescriptionSlip and DispensarySlip scale proportionally to selected paper size
- On-screen preview frame with paper-proportional pixel dimensions
- Legacy A6 coercion and auto-print double-fire guard

**Requirements:** 11/11 satisfied
**Tech debt:** 6 non-blocking items (Urdu line-height calibration, 3 human verification items, test type safety, unused variable)

---

## v1.1 Urdu & Backup (Shipped: 2026-03-11)

**Phases completed:** 7 phases (4-9 + 5.1), 14 plans
**Timeline:** 5 days (2026-03-06 to 2026-03-11)
**Stats:** 93 commits, 118 files, 9,761 LOC (TypeScript/React/CSS)

**Key accomplishments:**
- Urdu prescription printing with Nastaliq font, RTL layout, and bilingual column headers
- Natural Urdu dosage instructions with form-specific verbs (tablets/cream/drops/injection)
- Rx Notes English/Urdu toggle with sticky preference and correct print rendering
- Prescription entry cleanup: dosage-to-quantity rename, drug display split, amber indicators for non-standard values
- Full database backup/restore with file validation, inline confirmation, and smart re-login
- Auto-snapshots: silent 24h backups with 3-copy rotation, integrated into Settings Data tab
- Toast notification system and app version injection via Vite define

**Requirements:** 17/17 active satisfied (BKUP-05 auto-safety-backup dropped per user decision)
**Dexie schema:** v1 → v4 (v3: dosage→quantity rename, v4: rxNotesLang field)

### Known Gaps
- BKUP-05 (auto-safety-backup before restore) deliberately dropped per user decision

---

## v1.0 MVP (Shipped: 2026-03-06)

**Phases completed:** 3 phases, 14 plans
**Timeline:** 2 days (2026-03-05 to 2026-03-06)
**Stats:** 127 commits, 134 files, 6,616 LOC (TypeScript/React/CSS)

**Key accomplishments:**
- Offline-first PWA with installable service worker and IndexedDB persistence
- Patient registration with auto-generated 2026-XXXX IDs, search by name/ID/contact
- Clinical encounter logging with complaint, examination, diagnosis
- Prescription writing with medication autocomplete from 120+ pre-seeded Pakistani market drugs
- Custom medication management (add/edit/disable) via Settings
- A5 prescription slip and compact dispensary slip printing via browser print dialog
- Inline patient creation during new visit (no page navigation)
- PBKDF2 authentication with recovery code system

**Requirements:** 27/27 satisfied
**Deferred to v2:** RX-05 (prescription immutability)

---
