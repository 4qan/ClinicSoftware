---
status: diagnosed
phase: 02-clinical-workflow-encounters-prescriptions-drug-database
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-03-06T11:00:00Z
updated: 2026-03-06T11:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start the application fresh with `npm run dev`. Server boots without errors, the app loads in the browser, and you can navigate to the login/main page without console errors.
result: pass

### 2. Drug Search Autocomplete
expected: In a New Visit form, click the drug name field in the prescription section. Type 2-3 characters of a drug name (e.g., "amo" for Amoxicillin). A dropdown appears within ~200ms showing matching drugs from the seeded database. Selecting a drug populates the drug name field.
result: issue
reported: "I see duplicate entries"
severity: major

### 3. Drug Management in Settings
expected: Navigate to Settings page. A "Drug Management" section is visible. You can add a custom drug (brand name, salt name, form), see it in the list, inline-edit it, disable/enable it, and delete it with a confirmation prompt.
result: issue
reported: "adding a drug does nothing. nothing shown in the custom drugs area below"
severity: major

### 4. Create New Visit
expected: Click "New Visit" in the sidebar. Search and select a patient. Fill in clinical notes (chief complaint, examination, diagnosis). Add one or more medications using drug autocomplete with dosage, frequency, and duration fields. Click Save. Visit is saved and you're navigated away or shown success.
result: pass

### 5. Edit Existing Visit
expected: From a patient's profile, click Edit on an existing visit. The form loads pre-populated with all previously saved data (notes, medications). Make changes and save. Changes persist when you return to the visit.
result: pass

### 6. Delete Visit
expected: From a patient's profile or edit page, click Delete on a visit. A confirmation dialog appears. Confirming deletes the visit, and it no longer appears in the patient's visit history.
result: pass

### 7. Visit History on Patient Profile
expected: Navigate to a patient who has visits. The profile page shows a "Visit History" section with visits in reverse chronological order. The most recent visit is auto-expanded showing details (date, notes, medications). Older visits are collapsed but expandable.
result: pass

### 8. New Visit from Patient Profile
expected: On a patient's profile page, click the "New Visit" button in the visit history section. You're taken to the New Visit page with that patient already pre-selected (no need to search again).
result: pass

## Summary

total: 8
passed: 6
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Drug search returns unique results without duplicates"
  status: failed
  reason: "User reported: I see duplicate entries"
  severity: major
  test: 2
  root_cause: "seedDrugDatabase() bulkAdd and settings.put are not in a transaction. If interrupted between these two calls, the version flag is never set and next load re-seeds all drugs with new UUIDs. Dedup in searchDrugs uses d.id which doesn't catch duplicate data rows with different UUIDs."
  artifacts:
    - path: "src/db/seedDrugs.ts"
      issue: "bulkAdd + settings.put not atomic; crypto.randomUUID() means re-seeds create duplicates"
    - path: "src/db/drugs.ts"
      issue: "searchDrugs dedup by id doesn't catch duplicate data rows"
  missing:
    - "Wrap seed operations in a Dexie transaction, or use deterministic IDs (e.g., brandName+saltName+form+strength) with bulkPut for idempotent seeding"
    - "Add a one-time dedup migration to clean existing duplicate data"

- truth: "Adding a custom drug in Settings saves it and shows it in the custom drugs list"
  status: failed
  reason: "User reported: adding a drug does nothing. nothing shown in the custom drugs area below"
  severity: major
  test: 3
  root_cause: "Type mismatch: addCustomDrug writes isCustom: true (boolean), but getCustomDrugs queries .where('isCustom').equals(1) (number). IndexedDB uses strict type comparison, so query always returns empty."
  artifacts:
    - path: "src/db/drugs.ts"
      issue: "Line 91: .equals(1) should be .equals(true) to match boolean index value"
  missing:
    - "Change getCustomDrugs to use .equals(true) instead of .equals(1)"

- truth: "Settings page has clear separation between password management and drug management sections"
  status: failed
  reason: "User reported: settings page is cluttered with password management stuff and drug management. these should be separate sections"
  severity: minor
  test: 3
  artifacts: []
  missing: []

- truth: "New Visit should not be a top-level sidebar item alongside Home, Patients, Settings"
  status: failed
  reason: "User reported: New Visit in the side panel does not make logical sense compared to other options"
  severity: minor
  test: 4
  artifacts: []
  missing: []

- truth: "Patient name should always be visible in the visit form even when patient section is collapsed"
  status: failed
  reason: "User reported: at least the Patient Name should be visible always"
  severity: minor
  test: 4
  artifacts: []
  missing: []

- truth: "Sidebar should be collapsible to maximize screen real estate"
  status: failed
  reason: "User reported: we can have the overall app side panel collapsable so as to maximise the real estate"
  severity: minor
  test: 4
  artifacts: []
  missing: []
