---
status: diagnosed
phase: 01-foundation-and-patient-management
source: 01-SUMMARY.md, 02-SUMMARY.md, 03-SUMMARY.md, 04-SUMMARY.md, 05-SUMMARY.md
started: 2026-03-06T10:00:00Z
updated: 2026-03-06T10:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `npm run dev` from scratch. Server boots without errors, app loads in browser at localhost, and you see the login page.
result: pass

### 2. Login with Default Password
expected: Enter password "clinic123" on the login page. Password field has a Show/Hide toggle. You are logged in and see the home page with a sidebar, sticky search bar, and recent patients area.
result: pass

### 3. Sidebar Navigation
expected: Sidebar shows Home, Patients, Register Patient, Settings links. Clicking each navigates to the correct page. Active page is visually highlighted.
result: issue
reported: "why is Register Patient a navigation element? its a CTA! think of a better design pattern...maybe its a sticky CTA along with the sticky search bar. But we should not confuse CTAs with navigation pages or sections in the sidebar."
severity: major

### 4. Register a New Patient
expected: Navigate to Register Patient. Breadcrumbs show path. Form is a compact 2-column grid (all fields visible without scrolling). Gender dropdown has only Male/Female. CNIC auto-formats to XXXXX-XXXXXXX-X as you type. A blue patient ID preview (2026-0001) is shown. Submit creates the patient and navigates to their profile.
result: issue
reported: "no patient id preview is shown. it just says Assigned automatically when you save"
severity: minor

### 5. Patient Profile View and Edit
expected: On the patient profile page, see a large bold patient ID badge, name, gender, contact, CNIC. Breadcrumbs show Home > Patients > Patient Name. Click edit, modify a field, save. Edit form styling matches registration form styling. Changes persist.
result: pass

### 6. Search by Name
expected: Type a patient name (2+ chars) in the sticky search bar. Results appear as you type with a short delay. Click a result to navigate to their profile.
result: pass

### 7. Search by Contact Number
expected: Type a phone number starting with 0 or + in the search bar. Matching patients appear in results.
result: pass

### 8. Patients Page with Table
expected: Navigate to Patients via sidebar. Breadcrumbs visible. See a table listing all registered patients with clickable rows. A "Register New Patient" button/CTA is visible. Click a row to go to that patient's profile.
result: pass

### 9. Recent Patients on Home Page
expected: After visiting a patient profile, go to Home. That patient appears in the recent patients table. If no patients visited yet, the "Recent Patients" heading does not appear (no floating heading).
result: pass

### 10. Change Password
expected: Go to Settings via sidebar. Breadcrumbs visible. Use the Change Password form: enter current password, new password, confirm. Password fields have Show/Hide toggles. After changing, logout and login with the new password.
result: issue
reported: "1. password fields do not have the show/hide toggle within settings. 2. visual alignment of elements is not right between the recovery code, and the reset password fields"
severity: minor

### 11. Recovery Code in Settings
expected: On the Settings page, there is a Security Code section. Enter your current password to reveal the recovery code. The code is 8 characters with no ambiguous chars (0/O/1/l/I excluded).
result: pass

### 12. Password Recovery Flow
expected: On the login page, use the recovery option. Enter a valid recovery code and set a new password. Password field has Show/Hide toggle. After recovery, the old recovery code is invalidated (single-use).
result: pass

### 13. Logout
expected: Click Logout in the sidebar. You are returned to the login page. Refreshing after logout keeps you on login page (no bypass).
result: pass

## Summary

total: 13
passed: 10
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Sidebar navigation only contains pages/sections, not CTAs like Register Patient"
  status: failed
  reason: "User reported: why is Register Patient a navigation element? its a CTA! think of a better design pattern...maybe its a sticky CTA along with the sticky search bar. But we should not confuse CTAs with navigation pages or sections in the sidebar."
  severity: major
  test: 3
  root_cause: "Register Patient is modeled as a standard nav item in Sidebar.tsx navItems array (lines 24-31), rendered identically to Home/Patients/Settings. It should be a CTA button in the sticky search bar area instead."
  artifacts:
    - path: "src/components/Sidebar.tsx"
      issue: "Lines 24-31: Register Patient in navItems array as standard nav link"
    - path: "src/components/AppLayout.tsx"
      issue: "Lines 14-16: Sticky search bar div is the ideal location for Register Patient CTA"
  missing:
    - "Remove Register Patient from Sidebar navItems"
    - "Add a Register Patient CTA button next to SearchBar in AppLayout sticky header"

- truth: "Registration form shows a blue patient ID preview before saving"
  status: failed
  reason: "User reported: no patient id preview is shown. it just says Assigned automatically when you save"
  severity: minor
  test: 4
  root_cause: "RegisterPatientPage lines 101-107 show static text 'Assigned automatically when you save'. No getNextPatientId() peek function exists in db/patients.ts. generatePatientId() increments counter as side effect, so cannot be used for preview."
  artifacts:
    - path: "src/pages/RegisterPatientPage.tsx"
      issue: "Lines 101-107: Static text instead of ID preview"
    - path: "src/db/patients.ts"
      issue: "Lines 16-24: generatePatientId() has no read-only peek counterpart"
  missing:
    - "Add getNextPatientId() function to db/patients.ts that reads counter without incrementing"
    - "Call getNextPatientId() in RegisterPatientPage useEffect and display result"

- truth: "Settings page password fields have Show/Hide toggles and visual layout is consistent between Security Code and Change Password sections"
  status: failed
  reason: "User reported: 1. password fields do not have the show/hide toggle within settings. 2. visual alignment of elements is not right between the recovery code, and the reset password fields"
  severity: minor
  test: 10
  root_cause: "ChangePassword.tsx has bare <input type='password'> with no toggle logic (no showPassword state, no toggle button). Layout mismatch: Security Code card uses full-width bg-white card with p-6, but ChangePassword has max-w-sm mx-auto making it narrower and centered."
  artifacts:
    - path: "src/auth/ChangePassword.tsx"
      issue: "Lines 71, 88, 105: three password inputs without Show/Hide toggles"
    - path: "src/auth/ChangePassword.tsx"
      issue: "Line 46: max-w-sm mx-auto causes narrower centered layout"
    - path: "src/auth/LoginPage.tsx"
      issue: "Reference: lines 9-10, 155-174 show working toggle pattern"
  missing:
    - "Add showPassword/showNewPassword/showConfirm state to ChangePassword.tsx"
    - "Apply same toggle pattern from LoginPage (relative wrapper, absolute button, pr-16)"
    - "Remove max-w-sm mx-auto from ChangePassword, wrap in matching card style"
