# Phase 2: Clinical Workflow - Research

**Researched:** 2026-03-06
**Purpose:** Inform planning for encounters, prescriptions, and drug database implementation.

---

## Existing Codebase Analysis

### Database Layer (`src/db/index.ts`)

Dexie v1 schema with three tables:

```
patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt'
settings: 'key'
recentPatients: 'id, viewedAt'
```

- `ClinicDatabase` extends `Dexie`, exported as singleton `db`
- Tables are typed with TypeScript interfaces
- `withTimestamps()` helper auto-adds `createdAt`/`updatedAt` ISO strings
- Patient IDs generated via atomic counter in `settings` table (`patientCounter` key)
- `resetDatabase()` available for testing

### Search Pattern (`src/db/patients.ts`, `src/hooks/usePatientSearch.ts`)

Patient search uses a routing strategy:
- `0`/`+` prefix: contact number lookup via `.where('contact').startsWith()`
- Year-like digits: patient ID lookup via `.where('patientId').startsWith()`
- Letters: name prefix search on both `firstNameLower` and `lastNameLower` indexes, deduplicated

The `usePatientSearch` hook wraps this with:
- 250ms debounce via `setTimeout`
- Minimum 2 character threshold
- `isSearching` loading state
- Cleanup on unmount

This pattern directly informs drug autocomplete design.

### Component Patterns

- **Forms:** `RegisterPatientPage` uses `useState` for form state, inline `validate()`, `errors` object with field keys, `isSubmitting` guard. Grid layout with `sm:grid-cols-2`.
- **Cards:** `PatientInfoCard` has view/edit toggle, inline edit form.
- **Search dropdown:** `SearchBar` uses `useRef` for click-outside detection, keyboard handlers (Escape), absolute positioned dropdown with `z-50`.
- **Layout:** `AppLayout` with fixed `Sidebar` (60px wide) + content area. Breadcrumbs on every page.
- **Styling:** Tailwind v4. Consistent patterns: `bg-white border border-gray-200 rounded-lg p-6`, `text-base` for inputs, blue-600 for primary actions, `minHeight: 44px` for touch targets.

### Router (`src/App.tsx`)

```
/              -> HomePage
/patients      -> PatientsPage
/register      -> RegisterPatientPage
/patient/:id   -> PatientProfilePage
/settings      -> SettingsPage
```

BrowserRouter with `basename="/ClinicSoftware"`. New routes needed: `/visit/new`, `/visit/:id`, possibly `/patient/:id/visit/new`.

### Sidebar (`src/components/Sidebar.tsx`)

Three nav items: Home, Patients, Settings. Uses `isActive()` helper for highlight logic. "New Visit" entry point needs to be added here.

### Integration Points

- `PatientProfilePage` already has a "Visit History" placeholder section (empty state).
- `SettingsPage` has `RecoveryCodeSection` and `ChangePassword`. Drug management section will be added here.
- `PatientInfoCard` is reusable for the collapsible patient section on the visit page.

---

## Dexie Schema Design

### Version Migration

Current schema is `version(1)`. Add `version(2)` with new tables, preserving existing data:

```typescript
this.version(2).stores({
  patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
  settings: 'key',
  recentPatients: 'id, viewedAt',
  visits: 'id, patientId, createdAt',
  visitMedications: 'id, visitId',
  drugs: 'id, brandNameLower, saltNameLower, isCustom',
})
```

### `visits` Table

```typescript
interface Visit {
  id: string              // crypto.randomUUID()
  patientId: string       // FK to patients.id
  clinicalNotes: string   // Free-text with placeholder template
  rxNotes: string         // General prescription notes
  createdAt: string       // ISO timestamp (auto)
  updatedAt: string       // ISO timestamp (auto)
}
```

**Indexes:** `id` (PK), `patientId` (for patient visit history query), `createdAt` (for chronological ordering).

### `visitMedications` Table

```typescript
interface VisitMedication {
  id: string              // crypto.randomUUID()
  visitId: string         // FK to visits.id
  drugId?: string         // FK to drugs.id (null if free-text entry)
  brandName: string       // Snapshot at time of prescribing
  saltName: string        // Snapshot at time of prescribing
  form: string            // Tablet, Syrup, etc.
  strength: string        // "500mg", "250mg/5ml"
  dosage: string          // "1 tablet", "2 tablets", "5ml"
  frequency: string       // "Twice daily", "Every 8 hours"
  duration: string        // "5 days", "2 weeks"
  sortOrder: number       // Preserve ordering within visit
}
```

**Design note:** Brand/salt/form/strength are snapshotted (copied from drug record at prescription time), not referenced by FK. This ensures prescriptions remain accurate even if the drug record is later edited.

**Indexes:** `id` (PK), `visitId` (for loading medications with a visit).

### `drugs` Table

```typescript
interface Drug {
  id: string              // crypto.randomUUID()
  brandName: string       // "Panadol", "Augmentin"
  brandNameLower: string  // Lowercase for search index
  saltName: string        // "Paracetamol", "Amoxicillin + Clavulanate"
  saltNameLower: string   // Lowercase for search index
  form: string            // "Tablet", "Syrup", "Capsule"
  strength: string        // "500mg", "625mg"
  isCustom: boolean       // false = pre-seeded (read-only), true = user-added
  isActive: boolean       // false = hidden from autocomplete (soft delete for custom)
  createdAt: string
  updatedAt: string
}
```

**Indexes:** `id` (PK), `brandNameLower` (prefix search), `saltNameLower` (prefix search), `isCustom` (filter in settings).

### Seeding Strategy

Use Dexie's `on('populate')` hook (fires on database creation) OR check a settings key (`drugsSeedVersion`) on app startup. The settings key approach is better because it allows re-seeding if the seed data is updated in a future version:

```typescript
const SEED_VERSION = 1
const setting = await db.settings.get('drugsSeedVersion')
if (!setting || (setting.value as number) < SEED_VERSION) {
  await db.drugs.bulkAdd(SEED_DRUGS)
  await db.settings.put({ key: 'drugsSeedVersion', value: SEED_VERSION })
}
```

---

## Drug Autocomplete Strategy

### Performance Target

Sub-300ms on older hardware (e.g., 2015-era Celeron with HDD). With ~200 seed drugs + custom drugs, the dataset is small enough that IndexedDB indexed prefix matching will be fast.

### Recommended Approach: Dual Index Prefix Search

Use Dexie's `.where().startsWith()` on both `brandNameLower` and `saltNameLower` indexes, then deduplicate. This mirrors the existing patient name search pattern.

```typescript
async function searchDrugs(query: string): Promise<Drug[]> {
  const lower = query.toLowerCase().trim()
  if (!lower) return []

  const byBrand = await db.drugs
    .where('brandNameLower').startsWith(lower)
    .and(d => d.isActive)
    .limit(15)
    .toArray()

  const bySalt = await db.drugs
    .where('saltNameLower').startsWith(lower)
    .and(d => d.isActive)
    .limit(15)
    .toArray()

  // Deduplicate
  const seen = new Set<string>()
  const results: Drug[] = []
  for (const d of [...byBrand, ...bySalt]) {
    if (!seen.has(d.id)) {
      seen.add(d.id)
      results.push(d)
    }
    if (results.length >= 10) break
  }
  return results
}
```

### Why This Works for < 300ms

- `.where().startsWith()` uses `IDBKeyRange.bound()` internally, which is an indexed B-tree lookup (not a table scan).
- The `.and()` filter for `isActive` runs in JS only on the already-narrowed index results.
- With ~200 records, even a full table scan would be fast, but indexed prefix match ensures it stays fast at 1000+ records.
- No need for trigram indexes, full-text search, or Web Workers at this scale.

### Debouncing

Reuse the same pattern as `usePatientSearch`: 200ms debounce (slightly faster than the 250ms used for patients, since drug search should feel instant). Minimum 1 character threshold (shorter than patient search's 2-char minimum, since drug names are shorter and more varied).

### Display Format

Per CONTEXT.md: `"Panadol (Paracetamol 500mg Tablet)"`

Format: `{brandName} ({saltName} {strength} {form})`

### Hook Design

```typescript
function useDrugSearch(query: string) {
  // Same pattern as usePatientSearch
  // Returns { results: Drug[], isSearching: boolean }
}
```

---

## Clinical Dropdown Values

### Dosage Options

```typescript
const DOSAGE_OPTIONS = [
  // Tablets/Capsules
  '1/2 tablet',
  '1 tablet',
  '2 tablets',
  '3 tablets',
  // Liquids
  '2.5 ml',
  '5 ml',
  '10 ml',
  '15 ml',
  // Drops
  '1 drop',
  '2 drops',
  '3 drops',
  '5 drops',
  // Injections
  '1 injection',
  // Sachets/Powders
  '1 sachet',
  // Topical
  'Apply thin layer',
  'Apply as directed',
  // Inhalers
  '1 puff',
  '2 puffs',
]
```

**Implementation note:** Use a combobox (dropdown + free text). Doctor can pick from the list or type a custom value. This handles edge cases without restricting the doctor.

### Frequency Options

```typescript
const FREQUENCY_OPTIONS = [
  'Once daily',                  // OD
  'Twice daily',                 // BD / BID
  'Three times daily',           // TDS / TID
  'Four times daily',            // QID
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'Once weekly',
  'As needed',                   // PRN
  'Before meals',                // AC
  'After meals',                 // PC
  'At bedtime',                  // HS
  'Once daily before breakfast',
  'Once daily at night',
  'Twice daily (morning and night)',
  'Stat (single dose)',
]
```

### Duration Options

```typescript
const DURATION_OPTIONS = [
  '1 day',
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '3 weeks',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  'Ongoing',
  'As needed',
]
```

### Medication Forms (for drug entry)

```typescript
const MEDICATION_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Drops',
  'Injection',
  'Cream',
  'Ointment',
  'Gel',
  'Inhaler',
  'Suppository',
  'Sachet',
  'Powder',
  'Patch',
  'Spray',
  'Solution',
]
```

All dropdowns should allow free-text input (combobox pattern) for flexibility.

---

## Pakistani Market Drug Seed Data

Compiled from common prescribing patterns in Pakistani general practice. Covers antibiotics, analgesics, GI, cardiac, respiratory, dermatology, vitamins, antidiabetics, and neuropsychiatry.

### Antibiotics

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Amoxil | Amoxicillin | Capsule | 500mg |
| Amoxil | Amoxicillin | Syrup | 125mg/5ml |
| Amoxil | Amoxicillin | Syrup | 250mg/5ml |
| Augmentin | Amoxicillin + Clavulanate | Tablet | 625mg |
| Augmentin | Amoxicillin + Clavulanate | Syrup | 228mg/5ml |
| Augmentin | Amoxicillin + Clavulanate | Syrup | 457mg/5ml |
| Novidat | Ciprofloxacin | Tablet | 250mg |
| Novidat | Ciprofloxacin | Tablet | 500mg |
| Ciprin | Ciprofloxacin | Tablet | 500mg |
| Flagyl | Metronidazole | Tablet | 400mg |
| Flagyl | Metronidazole | Syrup | 200mg/5ml |
| Azomax | Azithromycin | Tablet | 500mg |
| Azomax | Azithromycin | Syrup | 200mg/5ml |
| Klaricid | Clarithromycin | Tablet | 250mg |
| Klaricid | Clarithromycin | Tablet | 500mg |
| Velosef | Cephradine | Capsule | 500mg |
| Velosef | Cephradine | Syrup | 125mg/5ml |
| Velosef | Cephradine | Syrup | 250mg/5ml |
| Ceclor | Cefaclor | Capsule | 500mg |
| Cespan | Cefixime | Capsule | 400mg |
| Cespan | Cefixime | Syrup | 100mg/5ml |
| Zinnat | Cefuroxime | Tablet | 250mg |
| Zinnat | Cefuroxime | Tablet | 500mg |
| Dalacin C | Clindamycin | Capsule | 300mg |
| Vibramycin | Doxycycline | Capsule | 100mg |
| Septran | Co-trimoxazole | Tablet | 480mg |
| Septran | Co-trimoxazole | Syrup | 240mg/5ml |
| Oxidil | Ceftriaxone | Injection | 500mg |
| Oxidil | Ceftriaxone | Injection | 1g |
| Cefspan | Cefixime | Tablet | 200mg |

### Analgesics & Anti-inflammatories

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Panadol | Paracetamol | Tablet | 500mg |
| Panadol Extra | Paracetamol + Caffeine | Tablet | 500mg/65mg |
| Calpol | Paracetamol | Syrup | 120mg/5ml |
| Calpol | Paracetamol | Syrup | 250mg/5ml |
| Brufen | Ibuprofen | Tablet | 200mg |
| Brufen | Ibuprofen | Tablet | 400mg |
| Brufen | Ibuprofen | Syrup | 100mg/5ml |
| Ponstan | Mefenamic Acid | Capsule | 250mg |
| Ponstan Forte | Mefenamic Acid | Tablet | 500mg |
| Disprin | Aspirin | Tablet | 300mg |
| Ascard | Aspirin | Tablet | 75mg |
| Ascard | Aspirin | Tablet | 150mg |
| Voltaren | Diclofenac Sodium | Tablet | 50mg |
| Voltaren | Diclofenac Sodium | Injection | 75mg/3ml |
| Voltaren | Diclofenac Sodium | Gel | 1% |
| Arcoxia | Etoricoxib | Tablet | 60mg |
| Arcoxia | Etoricoxib | Tablet | 90mg |
| Toradol | Ketorolac | Injection | 30mg |
| Tramal | Tramadol | Capsule | 50mg |

### Gastrointestinal

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Risek | Omeprazole | Capsule | 20mg |
| Risek | Omeprazole | Capsule | 40mg |
| Nexium | Esomeprazole | Tablet | 20mg |
| Nexium | Esomeprazole | Tablet | 40mg |
| Zantac | Ranitidine | Tablet | 150mg |
| Motilium | Domperidone | Tablet | 10mg |
| Motilium | Domperidone | Syrup | 5mg/5ml |
| Imodium | Loperamide | Capsule | 2mg |
| Buscopan | Hyoscine Butylbromide | Tablet | 10mg |
| Buscopan | Hyoscine Butylbromide | Injection | 20mg |
| Duphalac | Lactulose | Syrup | 3.35g/5ml |
| Ulgel | Aluminium Hydroxide + Magnesium Hydroxide | Suspension | - |
| Flagyl | Metronidazole | Tablet | 200mg |
| Entamizole | Metronidazole + Diloxanide | Tablet | 200mg/250mg |

### Respiratory & Allergy

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Ventolin | Salbutamol | Inhaler | 100mcg |
| Ventolin | Salbutamol | Syrup | 2mg/5ml |
| Seretide | Fluticasone + Salmeterol | Inhaler | 250/50mcg |
| Rigix | Cetirizine | Tablet | 10mg |
| Rigix | Cetirizine | Syrup | 5mg/5ml |
| Clarityn | Loratadine | Tablet | 10mg |
| Xyzal | Levocetirizine | Tablet | 5mg |
| Montika | Montelukast | Tablet | 10mg |
| Montika | Montelukast | Tablet | 5mg |
| Phenergan | Promethazine | Syrup | 5mg/5ml |
| Benadryl | Diphenhydramine | Syrup | 12.5mg/5ml |
| Prospan | Ivy Leaf Extract | Syrup | - |
| Hydryllin | Diphenhydramine + Ammonium Chloride | Syrup | - |
| Sinecod | Butamirate | Syrup | 7.5mg/5ml |
| Mucolite | Ambroxol | Syrup | 15mg/5ml |
| Mucolite | Ambroxol | Tablet | 30mg |

### Cardiovascular

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Lopressor | Metoprolol | Tablet | 50mg |
| Tenormin | Atenolol | Tablet | 50mg |
| Tenormin | Atenolol | Tablet | 100mg |
| Norvasc | Amlodipine | Tablet | 5mg |
| Norvasc | Amlodipine | Tablet | 10mg |
| Coversyl | Perindopril | Tablet | 5mg |
| Zestril | Lisinopril | Tablet | 5mg |
| Zestril | Lisinopril | Tablet | 10mg |
| Cozaar | Losartan | Tablet | 50mg |
| Cozaar | Losartan | Tablet | 100mg |
| Lipitor | Atorvastatin | Tablet | 10mg |
| Lipitor | Atorvastatin | Tablet | 20mg |
| Lipitor | Atorvastatin | Tablet | 40mg |
| Plavix | Clopidogrel | Tablet | 75mg |
| Lasix | Furosemide | Tablet | 40mg |
| Aldactone | Spironolactone | Tablet | 25mg |

### Antidiabetics

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Glucophage | Metformin | Tablet | 500mg |
| Glucophage | Metformin | Tablet | 850mg |
| Glucophage | Metformin | Tablet | 1000mg |
| Diamicron | Gliclazide | Tablet | 80mg |
| Diamicron MR | Gliclazide | Tablet | 30mg |
| Daonil | Glibenclamide | Tablet | 5mg |
| Januvia | Sitagliptin | Tablet | 50mg |
| Januvia | Sitagliptin | Tablet | 100mg |
| Mixtard | Insulin (Human) | Injection | 100 IU/ml |
| NovoRapid | Insulin Aspart | Injection | 100 IU/ml |
| Lantus | Insulin Glargine | Injection | 100 IU/ml |

### Neuropsychiatric

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Lexotanil | Bromazepam | Tablet | 3mg |
| Xanax | Alprazolam | Tablet | 0.5mg |
| Stilnoct | Zolpidem | Tablet | 10mg |
| Tegral | Carbamazepine | Tablet | 200mg |
| Epival | Divalproex Sodium | Tablet | 250mg |
| Cipramil | Citalopram | Tablet | 20mg |
| Prozac | Fluoxetine | Capsule | 20mg |

### Vitamins & Supplements

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Neurobion | Vitamin B Complex | Tablet | - |
| Neurobion | Vitamin B Complex | Injection | - |
| Cal-C | Calcium + Vitamin D | Tablet | 500mg/200IU |
| Osteocare | Calcium + Magnesium + Zinc + Vitamin D | Tablet | - |
| Fefol | Iron + Folic Acid | Capsule | - |
| Folic Acid | Folic Acid | Tablet | 5mg |

### Dermatology & Topical

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Betnovate | Betamethasone Valerate | Cream | 0.1% |
| Dermovate | Clobetasol Propionate | Cream | 0.05% |
| Canesten | Clotrimazole | Cream | 1% |
| Fucidin | Fusidic Acid | Cream | 2% |
| Kenacort | Triamcinolone | Injection | 40mg |
| Polyfax | Polymyxin B + Bacitracin | Ointment | - |

### Muscle Relaxants

| Brand Name | Salt Name | Form | Strength |
|-----------|-----------|------|----------|
| Myoril | Thiocolchicoside | Capsule | 4mg |
| Norgesic | Orphenadrine + Paracetamol | Tablet | 35mg/450mg |
| Relaxon | Cyclobenzaprine | Tablet | 10mg |

**Total: ~170 entries.** This covers the vast majority of what a Pakistani GP would prescribe in general practice.

---

## UI/UX Patterns

### New Visit Page Layout

**Two entry points (per CONTEXT.md):**
1. "New Visit" button on `PatientProfilePage` (patient pre-selected)
2. "New Visit" nav item in sidebar (patient search required)

**Page structure (top to bottom):**

1. **Patient Section** (collapsible after selection)
   - If patient pre-selected: show `PatientInfoCard` summary (name, ID, age, gender), collapsed by default
   - If standalone entry: inline search field at top. On selection, show summary and collapse.
   - "Register New" link if patient not found.

2. **Visit History** (collapsible, collapsed by default)
   - Shows last 5 visits for the selected patient with date, first line of clinical notes, medication count
   - "Show more" to expand

3. **Clinical Notes** (always visible)
   - Single `<textarea>` with placeholder template:
     ```
     Complaint:
     Examination:
     Diagnosis:
     ```
   - Auto-resizing or generous height (at least 120px)

4. **Prescription** (always visible, gets most screen space)
   - **Medication entry row:**
     - Drug search (autocomplete combobox)
     - Dosage dropdown (combobox)
     - Frequency dropdown (combobox)
     - Duration dropdown (combobox)
     - "Add" button
   - **Medication list:** table below showing added medications with remove button per row
   - **Rx Notes:** single textarea below the medication list

5. **Action bar** (sticky bottom or at page end)
   - "Save Visit" primary button
   - "Cancel" secondary

### Edit Visit

Same layout as new visit, pre-populated with existing data. URL: `/visit/:id/edit` or same component with visit ID param.

### Visit History on Patient Profile

Replace the placeholder in `PatientProfilePage` with:
- Reverse chronological list of visits
- Each visit card shows: date, clinical notes preview (truncated), medication count
- Click to expand full visit details inline, or navigate to visit page
- "New Visit" button at the top of the section

### Settings: Drug Management

Add a new section to `SettingsPage`:
- Search/filter field for drug list
- Table of custom drugs with brand name, salt name, form, strength
- Edit button per row (inline edit or modal)
- Add new drug form (either inline at top or expand panel)
- Toggle to disable/hide a custom drug from autocomplete
- Delete button with confirmation
- Pre-seeded drugs shown separately (read-only, or filtered out by default)

### Combobox Pattern

For dosage/frequency/duration fields: use an input with a dropdown that appears on focus, filtered as user types. User can select from list or type a custom value. Simpler than a full-featured combobox library. Implement as a reusable `<ComboBox>` component.

---

## Validation Architecture

### Visit Validation

| Field | Rule |
|-------|------|
| patientId | Required. Must exist in patients table. |
| clinicalNotes | Required (at least some text). Prevents empty visits. |
| medications | Optional (visit can have notes only, no prescription). |
| rxNotes | Optional. |

### Medication Validation (per item before adding to list)

| Field | Rule |
|-------|------|
| brandName or drugId | Required. Must select a drug or type a name. |
| dosage | Required. |
| frequency | Required. |
| duration | Required. |

### Drug Validation (Settings: add/edit custom drug)

| Field | Rule |
|-------|------|
| brandName | Required, non-empty. |
| saltName | Required, non-empty. |
| form | Required, from form options or custom. |
| strength | Optional (some drugs like syrups may not need it). |

### Error Display Pattern

Follow existing pattern: `errors` Record with field keys, red border on invalid inputs, error message below field. Same styling as `RegisterPatientPage`.

---

## RESEARCH COMPLETE

Key findings that should inform planning:

1. **Schema is straightforward.** Dexie version(2) migration adds 3 tables. Medication data is snapshotted (not referenced by FK) for prescription accuracy.
2. **Autocomplete will be fast.** With ~200 drugs and indexed prefix search, sub-300ms is trivially achievable. Same pattern as patient search.
3. **Existing patterns cover 80% of UI needs.** Search dropdown, form validation, card layout, debounced search hook. New reusable component needed: `ComboBox`.
4. **Drug seed data covers ~170 entries.** Pakistani market brands with salt names, forms, and strengths.
5. **The visit page is the most complex UI in the app so far.** Collapsible sections, inline patient search, medication list management, multiple comboboxes. Should be decomposed into focused sub-components.
6. **All dropdowns should be comboboxes** (allow custom input). Doctors prescribe edge cases that no predefined list covers.
