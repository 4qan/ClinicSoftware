---
phase: 1
plan: 2
name: "Patient Management UI and Search"
wave: 2
depends_on: [1]
requirements: [PAT-01, PAT-02, PAT-03, PAT-04]
files_modified:
  - src/App.tsx
  - src/pages/HomePage.tsx
  - src/pages/RegisterPatientPage.tsx
  - src/pages/PatientProfilePage.tsx
  - src/components/SearchBar.tsx
  - src/components/PatientCard.tsx
  - src/components/RecentPatients.tsx
  - src/components/PatientInfoCard.tsx
  - src/components/Header.tsx
  - src/db/patients.ts
  - src/hooks/usePatientSearch.ts
  - src/hooks/useRecentPatients.ts
  - src/__tests__/patient-id.test.ts
  - src/__tests__/registration.test.tsx
  - src/__tests__/search.test.tsx
  - src/__tests__/profile.test.tsx
  - e2e/patient-flow.spec.ts
autonomous: true
estimated_tasks: 6
---

# Plan 2: Patient Management UI and Search

## Objective

Build the patient registration form with auto-generated IDs, type-ahead search across name/ID/contact, patient profile view, and home page with search and recent patients, completing all patient management requirements.

## must_haves

- Doctor can register a new patient with first name, last name, gender, age, and optional contact/CNIC
- System auto-generates unique patient ID in 2026-XXXX format on save (no gaps from abandoned forms)
- Doctor can search patients by name, ID, or contact and get results in under 1 second
- Patient profile page displays patient info card (ID, name, age/gender, contact) with empty history section
- Doctor can edit patient details from profile (all fields except patient ID)
- Home page has prominent search bar and list of recently viewed/registered patients
- Header with persistent compact search is present across all pages
- Navigation between home, registration, and profile works via React Router
- Registration page has duplicate-check search to prevent re-registering existing patients
- All data survives page refresh (IndexedDB persistence)

## Tasks

<task id="2-01">
<title>Patient ID generation and CRUD operations</title>
<description>
Build the data layer for patient management.

1. Create `src/db/patients.ts`:
   - `generatePatientId(): Promise<string>` - reads counter from settings table, increments, returns "2026-XXXX" format. Uses Dexie transaction to ensure atomicity. Counter starts at 1. Pads to 4 digits (2026-0001). If counter exceeds 9999, continues without padding (2026-10000).
   - `registerPatient(data: PatientInput): Promise<Patient>` - generates UUID (crypto.randomUUID()), generates patient ID inside a transaction, applies timestamps via `withTimestamps`, stores lowercase name variants, saves to patients table AND increments counter atomically. Also adds to recentPatients.
   - `getPatient(id: string): Promise<Patient | undefined>` - fetch by UUID.
   - `updatePatient(id: string, changes: Partial<PatientInput>): Promise<void>` - updates patient fields (not patientId), applies updatedAt timestamp, updates lowercase name variants if name changed.
   - `searchPatients(query: string): Promise<Patient[]>` - implements the search strategy from RESEARCH.md:
     - If query starts with digit: search by patientId prefix.
     - If query looks like phone number: search by contact prefix.
     - Otherwise: search by firstNameLower and lastNameLower prefix, deduplicate, limit 10 results.
   - `getRecentPatients(limit: number): Promise<Patient[]>` - fetch recent patient IDs from recentPatients table ordered by viewedAt desc, then fetch full patient records.
   - `addToRecent(patientId: string): Promise<void>` - upsert into recentPatients with current timestamp.

2. Define `PatientInput` type (the fields the UI provides, without id, patientId, timestamps, or lowercase variants).

3. Write unit tests (`src/__tests__/patient-id.test.ts`):
   - First patient gets ID "2026-0001".
   - Sequential registrations produce "2026-0001", "2026-0002", "2026-0003".
   - ID format is correct (padded to 4 digits).
   - No ID gaps when only completed registrations increment counter.
   - `registerPatient` sets createdAt and updatedAt.
   - `updatePatient` changes updatedAt but preserves createdAt.
   - `searchPatients` finds by name prefix (case-insensitive).
   - `searchPatients` finds by patient ID prefix.
   - `searchPatients` finds by contact prefix.
   - `searchPatients` returns empty array for no match.
   - `searchPatients` deduplicates results.
</description>
<files>
- src/db/patients.ts
- src/__tests__/patient-id.test.ts
</files>
<automated>
npx vitest run patient-id --reporter=verbose
</automated>
</task>

<task id="2-02">
<title>Navigation, routing, and app layout</title>
<description>
Set up React Router and the app shell with header navigation.

1. Install `react-router-dom` v7.x.
2. Update `src/App.tsx`:
   - Set up BrowserRouter with routes:
     - `/` - HomePage
     - `/register` - RegisterPatientPage
     - `/patient/:id` - PatientProfilePage
     - `/settings` - placeholder for future settings page
   - All routes wrapped in AuthProvider (already done in Plan 1).

3. Create `src/components/Header.tsx`:
   - App name "Clinic Software" (left side, clickable, navigates to home).
   - Compact search bar (center/right, always visible).
   - Settings gear icon (right, navigates to /settings).
   - Search bar shows dropdown results on type, clicking a result navigates to `/patient/:id`.
   - Responsive: stacks appropriately on smaller screens.
   - Large text, high contrast per UX requirements.

4. Create page stub files with placeholder content:
   - `src/pages/HomePage.tsx`
   - `src/pages/RegisterPatientPage.tsx`
   - `src/pages/PatientProfilePage.tsx`

5. Verify navigation works between all routes.
</description>
<files>
- src/App.tsx
- src/components/Header.tsx
- src/pages/HomePage.tsx
- src/pages/RegisterPatientPage.tsx
- src/pages/PatientProfilePage.tsx
</files>
<automated>
npm run build && echo "ROUTING OK"
</automated>
</task>

<task id="2-03">
<title>Patient registration form</title>
<description>
Build the registration page where the doctor enters patient details.

1. Implement `src/pages/RegisterPatientPage.tsx`:
   - Patient ID preview at top (read-only, grayed out, shows "Will be assigned on save" or next ID preview).
   - Duplicate-check search bar at top of form: as doctor types first/last name, show matching existing patients below the search. If match found, show "Patient already exists" with link to their profile.
   - Form fields in priority order (top to bottom):
     - First Name (required, text input, large)
     - Last Name (required, text input, large)
     - Gender (required, select/radio: Male, Female, Other)
     - Age (required, number input, years only)
     - Contact Number (optional, text input)
     - CNIC (optional, text input)
   - "Save Patient" button at bottom: large (44px+ tall), primary color, full width on mobile.
   - Validation: required fields must be filled. Age must be positive number. Show inline error messages.
   - On save: call `registerPatient()`, navigate to the new patient's profile page.
   - "Cancel" link/button to go back to home.
   - All text 16px+ body, 18-20px labels. High contrast.

2. Create reusable form components if needed (text input, select, etc.) in `src/components/`.

3. Write component tests (`src/__tests__/registration.test.tsx`):
   - Form renders all fields.
   - Required field validation prevents save when fields empty.
   - Submitting valid data calls registerPatient and navigates to profile.
   - Duplicate check shows existing patient when name matches.
   - Patient ID is not editable.
</description>
<files>
- src/pages/RegisterPatientPage.tsx
- src/components/FormInput.tsx
- src/__tests__/registration.test.tsx
</files>
<automated>
npx vitest run registration --reporter=verbose
</automated>
</task>

<task id="2-04">
<title>Search functionality with type-ahead</title>
<description>
Build the search hook and search bar component used on home page and header.

1. Create `src/hooks/usePatientSearch.ts`:
   - Custom hook that takes a query string and returns search results.
   - Uses Dexie's `useLiveQuery` for reactive results.
   - Debounces input by 200-300ms.
   - Minimum 2 characters before searching.
   - Calls `searchPatients()` from the data layer.
   - Returns: `{ results: Patient[], isSearching: boolean }`.

2. Create `src/components/SearchBar.tsx`:
   - Text input with search icon, placeholder "Search patients by name, ID, or contact..."
   - Dropdown results list below input (absolute positioned).
   - Each result shows: patient ID, full name, contact (if exists).
   - Clicking a result navigates to `/patient/:id`.
   - Empty query: hide dropdown.
   - No results: show "No patients found" with "Register New Patient" button.
   - Two variants via props: `variant="prominent"` (large, for home page) and `variant="compact"` (smaller, for header).
   - Close dropdown on click outside or Escape key.

3. Create `src/components/PatientCard.tsx`:
   - Small card component for displaying a patient in search results or recent list.
   - Shows: patient ID badge, full name, age/gender, contact.
   - Clickable, navigates to profile.

4. Write component tests (`src/__tests__/search.test.tsx`):
   - Typing a name shows matching results.
   - Typing a patient ID shows matching results.
   - Typing a contact number shows matching results.
   - Less than 2 characters shows no results.
   - No match shows "No patients found" message.
   - Clicking a result navigates to patient profile.
   - Search completes within 1 second (performance assertion with seeded data).
</description>
<files>
- src/hooks/usePatientSearch.ts
- src/components/SearchBar.tsx
- src/components/PatientCard.tsx
- src/__tests__/search.test.tsx
</files>
<automated>
npx vitest run search --reporter=verbose
</automated>
</task>

<task id="2-05">
<title>Patient profile view with edit capability</title>
<description>
Build the patient profile page showing patient info and (empty) history.

1. Implement `src/pages/PatientProfilePage.tsx`:
   - Read patient ID from route params, fetch patient from database.
   - Add patient to recent patients list on view.
   - If patient not found: show "Patient not found" message with link to home.

2. Create `src/components/PatientInfoCard.tsx`:
   - Displays at top of profile: patient ID (prominent badge), full name (large text), age and gender, contact number, CNIC if present.
   - "Edit" button in card corner.
   - Edit mode: fields become editable (same as registration form but patient ID is locked/read-only). "Save" and "Cancel" buttons replace "Edit".
   - On save: call `updatePatient()`, exit edit mode, show updated data.
   - Validation same as registration (required fields, positive age).

3. History section below info card:
   - Empty state: "No visits yet" message with friendly text. This section will be populated in Phase 2.
   - Section header: "Visit History" (not "Encounter History").

4. Write component tests (`src/__tests__/profile.test.tsx`):
   - Profile displays patient info correctly (ID, name, age, gender, contact).
   - Edit button toggles edit mode.
   - Patient ID field is not editable in edit mode.
   - Saving changes updates the displayed data.
   - Empty history shows "No visits yet" message.
   - Non-existent patient shows error state.
</description>
<files>
- src/pages/PatientProfilePage.tsx
- src/components/PatientInfoCard.tsx
- src/__tests__/profile.test.tsx
</files>
<automated>
npx vitest run profile --reporter=verbose
</automated>
</task>

<task id="2-06">
<title>Home page with search and recent patients, plus E2E tests</title>
<description>
Build the home page and write end-to-end tests covering the full patient flow.

1. Implement `src/pages/HomePage.tsx`:
   - Prominent search bar at top center (variant="prominent").
   - "Register New Patient" button below search (large, secondary style).
   - Recent patients section: "Recent Patients" heading, list of 5-10 most recently viewed/registered patients using PatientCard components.
   - If no recent patients: "No recent patients" message.

2. Create `src/hooks/useRecentPatients.ts`:
   - Hook that returns recent patients using `getRecentPatients()` from data layer.
   - Uses `useLiveQuery` for reactivity (auto-updates when a new patient is registered or viewed).

3. Create `src/components/RecentPatients.tsx`:
   - Renders a list of PatientCard components.
   - Each card clickable, navigates to profile.

4. Update header search (from task 2-04) to be fully functional with navigation.

5. Write E2E test (`e2e/patient-flow.spec.ts`) covering the critical path:
   - Log in with default password.
   - Navigate to register patient.
   - Fill out form with test data, save.
   - Verify redirect to patient profile with correct data.
   - Navigate to home, verify patient appears in recent patients.
   - Use search bar to find the patient by name.
   - Use search bar to find the patient by ID.
   - Use search bar to find the patient by contact.
   - Edit patient from profile (change contact number), verify update persists.
   - Refresh page, verify data survives (IndexedDB persistence).
   - Register a second patient, verify both appear in search and recent list.
</description>
<files>
- src/pages/HomePage.tsx
- src/hooks/useRecentPatients.ts
- src/components/RecentPatients.tsx
- e2e/patient-flow.spec.ts
</files>
<automated>
npx vitest run --reporter=verbose && npx playwright test patient-flow
</automated>
</task>

## Verification

- [ ] `npx vitest run --reporter=verbose` passes all unit and component tests
- [ ] `npx playwright test` passes all E2E tests including patient flow
- [ ] Doctor can register a patient with all required fields and see the auto-generated 2026-XXXX ID
- [ ] Required field validation prevents saving incomplete forms
- [ ] Duplicate check on registration page shows existing patients when name matches
- [ ] Search returns results for name, patient ID, and contact queries
- [ ] Search results appear in under 1 second
- [ ] Patient profile displays all patient info with correct formatting
- [ ] Edit mode on profile allows changing all fields except patient ID
- [ ] Home page shows search bar and recently viewed patients
- [ ] Header search works from any page and navigates to selected patient
- [ ] All data persists after page refresh
- [ ] "No patients found" search state shows register button
- [ ] "No visits yet" shown on patient profile history section

---
*Phase: 01-foundation-and-patient-management*
*Plan created: 2026-03-05*
