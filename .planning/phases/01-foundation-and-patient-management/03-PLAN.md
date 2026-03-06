---
phase: 1
plan: 3
name: "UAT Gap Closure"
wave: 3
depends_on: [2]
requirements: [FOUND-04, PAT-01]
files_modified:
  - src/auth/LoginPage.tsx
  - src/pages/HomePage.tsx
  - src/pages/RegisterPatientPage.tsx
  - src/pages/SettingsPage.tsx
  - src/components/PatientInfoCard.tsx
  - src/components/RecentPatients.tsx
  - src/App.tsx
autonomous: true
estimated_tasks: 4
---

# Plan 3: UAT Gap Closure

## Objective

Fix 6 diagnosed UAT gaps from Phase 01 testing: password visibility toggle, duplicate search bars, floating heading, registration form density, form styling mismatch, and missing settings/change-password page.

## Tasks

<task id="3-01">
<title>Wire settings page with ChangePassword component</title>
<description>
Fixes UAT gaps 6 (tests 11 and 12): settings page is a placeholder, ChangePassword is built but unreachable.

1. Create `src/pages/SettingsPage.tsx`:
   - Import `ChangePassword` from `@/auth/ChangePassword`
   - Render a page wrapper with `max-w-2xl mx-auto p-6`
   - Page heading: `<h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>`
   - Render `<ChangePassword />` below the heading
   - Export as named export `SettingsPage`

2. Update `src/App.tsx`:
   - Add import: `import { SettingsPage } from './pages/SettingsPage'`
   - Replace the inline placeholder div on the `/settings` route with: `<Route path="/settings" element={<SettingsPage />} />`

Verification: navigate to /settings after login and confirm the Change Password form renders with current password, new password, and confirm fields.
</description>
<files>
- src/pages/SettingsPage.tsx (NEW)
- src/App.tsx
</files>
<automated>
npm run build && echo "SETTINGS OK"
</automated>
</task>

<task id="3-02">
<title>Add password visibility toggles to LoginPage</title>
<description>
Fixes UAT gap 1 (test 2): no show/hide toggle on password fields.

Edit `src/auth/LoginPage.tsx`:

1. Add state variables at the top of the component (after existing state declarations):
   ```
   const [showPassword, setShowPassword] = useState(false)
   const [showNewPassword, setShowNewPassword] = useState(false)
   ```

2. For the login password field, wrap the input in a `relative` div and add a toggle button:
   - Change the input `type` from `'password'` to `{showPassword ? 'text' : 'password'}`
   - After the input, add a button inside the relative wrapper:
     ```tsx
     <button
       type="button"
       onClick={() => setShowPassword(!showPassword)}
       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
       aria-label={showPassword ? 'Hide password' : 'Show password'}
     >
       {showPassword ? 'Hide' : 'Show'}
     </button>
     ```
   - Add `pr-16` to the input className to prevent text overlap with the button

3. For the recovery new-password field, apply the same pattern:
   - Wrap in relative div
   - Change type to `{showNewPassword ? 'text' : 'password'}`
   - Add toggle button using `showNewPassword` / `setShowNewPassword`
   - Add `pr-16` to input className

Use text labels ("Show"/"Hide") rather than SVG icons for simplicity.
</description>
<files>
- src/auth/LoginPage.tsx
</files>
<automated>
npm run build && echo "LOGIN TOGGLE OK"
</automated>
</task>

<task id="3-03">
<title>Fix HomePage: remove duplicate search, fix floating heading</title>
<description>
Fixes UAT gaps 2 and 3 (test 4): duplicate search bars and unconditional "Recent Patients" heading.

1. Edit `src/pages/HomePage.tsx`:
   - Remove the SearchBar import
   - Remove the SearchBar rendering (the prominent variant div)
   - Conditionally render the Recent Patients section:
     ```tsx
     {recentPatients.length > 0 && (
       <div>
         <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Patients</h3>
         <RecentPatients patients={recentPatients} />
       </div>
     )}
     ```
   This means: when there are no patients, nothing renders below the Register button. The Header search (always visible) handles all search needs.

2. Adjust spacing around Register button since the search bar above it is gone.

The result: one search bar (in Header), Register button, and Recent Patients only when there are patients.
</description>
<files>
- src/pages/HomePage.tsx
</files>
<automated>
npm run build && echo "HOMEPAGE OK"
</automated>
</task>

<task id="3-04">
<title>Align registration form layout and styling with edit form</title>
<description>
Fixes UAT gaps 4 and 5 (tests 4 and 9): registration form too long/scrolly, and styling mismatch between register and edit forms.

The canonical style is the PatientInfoCard edit mode (compact, grid layout, `text-base`, `py-2`, `px-3`). Registration form must match.

Edit `src/pages/RegisterPatientPage.tsx`:

1. Change form layout from `space-y-5` to a 2-column grid:
   ```tsx
   <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
   ```

2. Update ALL input field styles to match PatientInfoCard edit mode:
   - Labels: change `text-lg` to `text-base`
   - Inputs: change `px-4 py-3 text-lg` to `px-3 py-2 text-base`
   - This applies to firstName, lastName, age, contact, and CNIC inputs

3. Make firstName and lastName each occupy one grid column (natural in 2-col grid).

4. Gender radio group: span full width with `sm:col-span-2`.

5. Contact and CNIC: each one column (side by side on desktop).

6. Submit button: span full width:
   ```tsx
   <button className="sm:col-span-2 w-full py-2 text-base font-semibold ..." style={{ minHeight: '44px' }}>
   ```

7. Reduce padding on Patient ID preview and duplicate check sections.

8. Reduce page heading margin from `mb-6` to `mb-4`.

The resulting form fits in a single viewport on most screens: 2 columns on desktop/tablet, 1 column on mobile. Styling matches PatientInfoCard edit mode exactly.
</description>
<files>
- src/pages/RegisterPatientPage.tsx
</files>
<automated>
npm run build && echo "FORM OK"
</automated>
</task>

## Verification

- [ ] `npm run build` succeeds with no errors
- [ ] /settings route renders the Change Password form
- [ ] Password change works: enter current password, set new one, recovery code displayed
- [ ] Recovery code flow works from login page "Forgot password?" link
- [ ] Login page password field has Show/Hide toggle
- [ ] Home page has exactly one search bar (in the Header)
- [ ] Home page shows no "Recent Patients" heading when patient list is empty
- [ ] Registration form fits in a single viewport without scrolling (desktop)
- [ ] Registration form uses same input sizes and spacing as edit mode
- [ ] All existing tests still pass: `npx vitest run --reporter=verbose`

---
*Phase: 01-foundation-and-patient-management*
*Plan created: 2026-03-06*
