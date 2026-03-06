# Phase 3: Printing and Visit Completion - Research

## Codebase Analysis

### Current Visit Data Flow
- `Visit` type: `{ id, patientId, clinicalNotes, rxNotes, createdAt, updatedAt }`
- `VisitMedication` type: `{ id, visitId, drugId?, brandName, saltName, form, strength, dosage, frequency, duration, sortOrder }`
- `getVisit(visitId)` returns `{ visit, medications }` sorted by `sortOrder` (in `src/db/visits.ts`)
- `getPatient(id)` returns full patient record (in `src/db/patients.ts`)
- No existing route for viewing/printing a visit. Current flow: visit data shown in `VisitCard` on PatientProfilePage.

### VisitCard (src/components/VisitCard.tsx)
- Displays visit date, clinical notes, medications table (desktop/mobile variants), Rx notes
- Actions: Edit link (`/visit/:id/edit`), Delete button
- No print link exists yet. Adding a "Print" link here is the entry point for PRINT-04.
- Medication table columns: Drug (brand + salt + strength + form), Dosage, Frequency, Duration

### NewVisitPage (src/pages/NewVisitPage.tsx)
- Patient search uses `usePatientSearch` hook with 250ms debounce, min 2 chars
- Search results dropdown rendered inline below the input
- When no results: shows "No patients found" text, plus a static "Register New Patient" link to `/register` (navigates away, violating VISIT-01)
- Clinical Notes, Prescription, and Rx Notes sections are **conditionally rendered** (`{selectedPatient && ...}`), causing layout shift when patient is selected (violates VISIT-02)
- No "Create [name] as new patient" option in search results (VISIT-03 missing)

### Settings Page (src/pages/SettingsPage.tsx)
- Currently flat layout: Security section (RecoveryCodeSection + ChangePassword), then Clinical section (DrugManagement)
- No clinic info fields exist yet. Settings stored as key-value pairs in Dexie `settings` table.
- No category-based navigation. The page needs restructuring before adding Clinic Info.

### Database Schema (src/db/index.ts)
- `settings` table with `key` as primary key, `value` as unknown. Used for `passwordHash`, `patientCounter`, `drugsSeedVersion`, `recoveryCodeHash`.
- New clinic info settings will use the same pattern: `doctorName`, `clinicName`, `clinicAddress`, `clinicPhone`, `footerText`.
- No schema migration needed; settings table already supports arbitrary keys.

### Registration Form (src/pages/RegisterPatientPage.tsx)
- Fields: firstName, lastName, gender (radio), age, contact, CNIC
- Validation: firstName required, lastName required, gender required, age > 0, CNIC 13 digits if provided
- Uses `registerPatient()` from `src/db/patients.ts` which handles ID generation in a transaction
- This form logic needs to be extractable into a reusable component for inline creation (VISIT-01).

### Routing (src/App.tsx)
- BrowserRouter with `basename="/ClinicSoftware/"`
- Current routes: `/`, `/patients`, `/register`, `/patient/:id`, `/visit/new`, `/visit/:id/edit`, `/settings`
- New route needed: `/visit/:id/print` for the prescription view/print page

### Styling (src/index.css)
- Tailwind CSS v4 imported via `@import "tailwindcss"`
- Base font: 18px system fonts
- No `@media print` rules exist anywhere in the codebase
- No print-specific CSS infrastructure

## Technical Approach

### PRINT-01 & PRINT-02: Prescription and Dispensary Slips

**Architecture: Dedicated print page at `/visit/:id/print`**

1. New page component `PrintVisitPage` at `src/pages/PrintVisitPage.tsx`
2. Loads visit data via `getVisit(visitId)` and patient via `getPatient(visit.patientId)`
3. Loads clinic info settings from Dexie (doctorName, clinicName, clinicAddress, clinicPhone, footerText)
4. Renders two print-optimized views on screen: prescription preview and dispensary preview
5. Each has its own "Print" button

**Print mechanism:**
- Use `@media print` CSS to hide everything except the target slip
- Two approaches for dual-print:
  - **Option A (recommended):** State-driven. A `printMode` state (`'prescription' | 'dispensary' | null`) controls which layout is visible during print. Button sets state, calls `window.print()` in a `useEffect` or `setTimeout(0)`, then resets state after `afterprint` event.
  - **Option B:** Hidden `<iframe>` or separate window. More complex, less reliable cross-browser.

**A5 paper size (148mm x 210mm):**
- CSS `@page` rule: `@page { size: A5 portrait; margin: 8mm; }`
- Print stylesheet in `src/index.css` under `@media print { ... }`
- Hide sidebar, header, navigation, buttons during print
- Font sizes reduced for print (10-12pt base)

**Prescription slip layout:**
- Clinic header: doctor name, clinic name, address, phone (from settings)
- Patient info: name, patient ID, age/gender, visit date
- Medication table: #, brand name, salt name, strength, form, dosage, frequency, duration
- Clinical notes and Rx notes sections
- Footer: disclaimer text, doctor name, phone, clinic address

**Dispensary slip layout:**
- Patient name, patient ID, visit date (identification only)
- Full medication table (same columns as prescription)
- No clinical notes, no Rx notes, no clinic header/footer
- Compact, denser formatting

### PRINT-03: Chrome/Edge Print Dialog Compatibility

Key considerations:
- `@page { size: A5 }` is supported in Chrome/Edge. The print dialog will suggest A5 paper if the CSS specifies it, but the user may need to manually select A5 in their printer settings the first time.
- Avoid `position: fixed` in print CSS (Chrome ignores it)
- Avoid `overflow: hidden` on ancestors (clips content)
- Use `break-inside: avoid` on medication rows and sections
- Test with `color-adjust: exact` / `print-color-adjust: exact` for backgrounds
- Tailwind's `print:` variant prefix can be used for print-specific classes inline

### PRINT-04: Both Prints from Prescription View

- `VisitCard` gets a new "Print" link alongside Edit/Delete, navigating to `/visit/:id/print`
- PrintVisitPage shows formatted preview with two prominent buttons: "Print Prescription" and "Print Dispensary"
- Buttons are large, clearly labeled (father is not tech-savvy)

### VISIT-01 & VISIT-03: Inline Patient Creation

**Recommended UX: Expandable inline form below search results**

When search returns no results and query has >= 2 characters:
1. Show "Create '[query]' as new patient" button in the dropdown (VISIT-03)
2. Clicking it expands a registration form below the search input (not a modal, to keep context visible)
3. Form pre-fills firstName from the search query (split on space: first word = firstName, rest = lastName)
4. Form includes all registration fields: firstName, lastName, gender, age, contact, CNIC
5. On submit, calls `registerPatient()`, then auto-selects the new patient and collapses the form
6. "Cancel" collapses the form, returns to search

**Why not a modal:**
- Modal obscures the visit form context
- The doctor (father) is not tech-savvy; inline flow keeps everything in one visual stream
- Expandable section is already a proven pattern in this codebase (CollapsibleSection)

**Implementation:**
- Extract registration form fields into a reusable `PatientRegistrationForm` component (used by both RegisterPatientPage and NewVisitPage inline creation)
- Or: duplicate the form inline in NewVisitPage (simpler, avoids over-abstraction for 2 usages)
- Recommendation: Extract. The validation logic and field set are identical, and RegisterPatientPage can be simplified.

### VISIT-02: Always-Visible Disabled Sections

**Current state:** Clinical Notes, Prescription, Rx Notes, and Action Bar are rendered only when `selectedPatient` is truthy (4 conditional blocks with `{selectedPatient && ...}`).

**Change:** Render all sections unconditionally. When `!selectedPatient`:
- Wrap each section in a container with `opacity-50 pointer-events-none` (or use `fieldset disabled`)
- Textarea and input elements get `disabled` attribute
- Buttons get `disabled` attribute
- This eliminates layout shift since all sections are in the DOM from page load

**Consideration:** The Visit History section should remain conditional (only shows when patient selected), as it has no meaningful empty state. Or show it always with "Select a patient to see history" placeholder.

### Settings Page Redesign

**Category-based layout:**
- Tab/pill navigation at the top or a sidebar within the settings area
- Categories: Account (password, recovery), Medications (drug management), Clinic Info (new)
- Recommendation: Horizontal tab pills at the top (simpler than sidebar, works on mobile)
- State: `activeCategory` string, persisted in URL params or local state

**Clinic Info section fields:**
- Doctor Name (text input)
- Clinic Name (text input)
- Clinic Address (textarea, 2-3 lines)
- Clinic Phone (text input)
- Footer Disclaimer Text (textarea, with default value pre-filled)
- Save button per section or auto-save on blur

**Storage:** Each field stored as a separate key in the `settings` table (e.g., `clinicDoctorName`, `clinicName`, `clinicAddress`, `clinicPhone`, `clinicFooterText`). Retrieved via `db.settings.get(key)`.

## Reusable Components

| Component | Location | Reuse in Phase 3 |
|-----------|----------|-------------------|
| `CollapsibleSection` | `src/components/CollapsibleSection.tsx` | Settings category sections, possibly inline patient form |
| `VisitCard` | `src/components/VisitCard.tsx` | Add Print link in actions bar |
| `MedicationList` | `src/components/MedicationList.tsx` | Reference for print table layout (but print table will be its own styled component) |
| `PatientInfoCard` | `src/components/PatientInfoCard.tsx` | Reference for patient display fields |
| `usePatientSearch` | `src/hooks/usePatientSearch.ts` | Already used in NewVisitPage, no changes needed |
| `Breadcrumbs` | `src/components/Breadcrumbs.tsx` | PrintVisitPage breadcrumbs |
| `registerPatient` | `src/db/patients.ts` | Called from inline creation form |
| `getVisit` | `src/db/visits.ts` | Used by PrintVisitPage to load visit + medications |
| `getPatient` | `src/db/patients.ts` | Used by PrintVisitPage to load patient info |
| `formatCNIC` | `src/utils/formatCNIC.ts` | Inline patient form CNIC field |

**New components to create:**
- `PrintVisitPage` (page component)
- `PrescriptionSlip` (print layout for Rx)
- `DispensarySlip` (print layout for dispenser)
- `ClinicInfoSettings` (settings section for clinic header/footer data)
- `PatientRegistrationForm` (extracted from RegisterPatientPage, shared with inline creation)

## Risk & Complexity Assessment

### Low Risk
- **Adding Print link to VisitCard**: Trivial, add a `<Link>` in the actions bar
- **New route `/visit/:id/print`**: Standard route addition in App.tsx
- **Clinic info in settings table**: Key-value pattern is established, no schema change
- **VISIT-02 (always-visible sections)**: Replace conditional renders with disabled state. Straightforward.

### Medium Risk
- **Print CSS for A5**: `@page { size: A5 }` works in Chrome/Edge but the user must have A5 paper loaded or select it in print dialog. First-time setup friction for a non-tech-savvy user. Mitigation: include on-screen instructions ("Set paper size to A5 in print dialog").
- **Dual print modes (Rx vs Dispensary)**: Managing `printMode` state and ensuring the correct layout renders before `window.print()` fires. Need `setTimeout` or `requestAnimationFrame` to ensure DOM update before print dialog opens.
- **Inline patient creation (VISIT-01/03)**: Form state management in an already complex NewVisitPage. The page will gain significant code. Extracting the registration form into a shared component is recommended to manage complexity.

### High Risk
- **Settings page redesign**: Scope creep risk. The redesign is not strictly needed for print functionality; it's needed to house Clinic Info. Recommendation: keep the redesign minimal (add tabs, move existing sections into tabs, add Clinic Info tab). Do not re-architect the settings infrastructure.

### Complexity Estimate
- **PRINT-01/02/03/04**: ~60% of phase effort. New page, print CSS, two slip layouts, clinic info settings, integration.
- **VISIT-01/02/03**: ~25% of phase effort. Inline form extraction, search dropdown modification, layout change.
- **Settings redesign**: ~15% of phase effort. Tab navigation, Clinic Info form.

## Validation Architecture

### PRINT-01: Prescription Slip
- **Manual test**: Navigate to `/visit/:id/print`, click "Print Prescription", verify Chrome print preview shows A5 layout with clinic header, patient info, medications, clinical notes, Rx notes, footer
- **Unit test**: PrintVisitPage renders prescription slip with correct data from visit/patient/settings
- **Visual check**: Font sizes readable on A5, no content overflow, page breaks behave

### PRINT-02: Dispensary Slip
- **Manual test**: Click "Print Dispensary", verify print preview shows only patient ID, name, date, and medications. No clinical notes, no header/footer.
- **Unit test**: DispensarySlip component renders only medication data and patient identification

### PRINT-03: Chrome/Edge Compatibility
- **Manual test**: Print from Chrome and Edge. Verify `@page size: A5` is respected (or at least doesn't break the layout). Verify no clipped content, no blank pages.
- **Checklist**: No `position: fixed`, no `overflow: hidden` on ancestors, `break-inside: avoid` on rows

### PRINT-04: Both Prints from Prescription View
- **Manual test**: VisitCard shows "Print" link, navigates to `/visit/:id/print`, both buttons visible and functional
- **Unit test**: VisitCard renders Print link with correct href

### VISIT-01: Inline Patient Creation
- **E2E scenario**: Search for non-existent name, click "Create [name]", fill form, submit. Patient auto-selected, visit form continues.
- **Unit test**: NewVisitPage shows inline form when "Create" is clicked, calls `registerPatient`, sets `selectedPatient` on success

### VISIT-02: No Layout Shift
- **Manual test**: Load `/visit/new` without preselected patient. All sections visible but disabled. Select patient. Sections enable without layout jump.
- **Unit test**: NewVisitPage renders Clinical Notes and Prescription sections even when no patient selected, with disabled state

### VISIT-03: "Create as New Patient" Option
- **Unit test**: When search returns 0 results and query >= 2 chars, dropdown shows "Create '[query]' as new patient" button
- **Manual test**: Type a name with no match, verify the create option appears in the dropdown

## RESEARCH COMPLETE
