---
phase: 1
plan: 5
name: "Form UX Fixes and Recovery Code Relocation"
wave: 5
depends_on: [4]
requirements: [FOUND-04, PAT-01, PAT-02]
files_modified:
  - src/auth/ChangePassword.tsx
  - src/auth/useAuth.ts
  - src/auth/AuthProvider.tsx
  - src/pages/SettingsPage.tsx
  - src/components/Breadcrumbs.tsx
  - src/pages/RegisterPatientPage.tsx
  - src/pages/PatientProfilePage.tsx
  - src/pages/PatientsPage.tsx
  - src/components/PatientInfoCard.tsx
  - src/db/index.ts
autonomous: true
estimated_tasks: 5
---

# Plan 5: Form UX Fixes and Recovery Code Relocation

## Objective

Fix 5 UX gaps: relocate recovery code from post-password-change to Settings (viewable/regeneratable), add breadcrumb navigation, restrict gender to Male/Female only, show patient ID clearly on save, and add CNIC auto-formatting. This addresses Gaps 1, 2, 4, 5, and 6 from VERIFICATION.md.

## Tasks

<task id="5-01">
<title>Relocate recovery code to Settings and fix generation timing</title>
<description>
Gap 1: Recovery code is shown after password change, which is confusing. It should be accessible from Settings independently and shown during initial setup.

1. Edit `src/pages/SettingsPage.tsx`:
   - Add a new section ABOVE the Change Password section: "Security Code".
   - This section shows:
     - If a recovery code has been set: a message "Recovery code is configured. You can regenerate it below."
     - A "View/Regenerate Recovery Code" button.
     - When clicked, prompt for current password (inline form: password input + "Confirm" button).
     - On successful password verification, generate a new recovery code, store its hash, and display the plaintext code in the same green box format currently used in ChangePassword.tsx.
   - Add a new method to the auth hook: `regenerateRecoveryCode(currentPassword: string): Promise<{ success: boolean; recoveryCode?: string; error?: string }>`.

2. Edit `src/auth/useAuth.ts`:
   - Add `regenerateRecoveryCode` method:
     ```typescript
     const regenerateRecoveryCode = useCallback(async (currentPassword: string) => {
       const auth = await getAuthRecord()
       if (!auth) return { success: false, error: 'No auth record found' }
       const salt = base64ToSalt(auth.salt)
       const valid = await verifyPassword(currentPassword, salt, auth.hash)
       if (!valid) return { success: false, error: 'Incorrect password' }
       const code = generateRecoveryCode()
       const recoverySalt = generateSalt()
       const recoveryHash = await hashPassword(code, recoverySalt)
       await setAuthRecord({
         ...auth,
         recoveryHash,
         recoverySalt: saltToBase64(recoverySalt),
       })
       return { success: true, recoveryCode: code }
     }, [])
     ```
   - Add `hasRecoveryCode` method or state: check if `auth.recoveryHash` exists. This can be a simple async function:
     ```typescript
     const checkRecoveryCodeExists = useCallback(async (): Promise<boolean> => {
       const auth = await getAuthRecord()
       return !!(auth?.recoveryHash && auth?.recoverySalt)
     }, [])
     ```
   - Return both new methods from the hook.

3. Edit `src/auth/ChangePassword.tsx`:
   - Remove the recovery code display after password change. The `changePassword` function still generates a recovery code internally (this is fine for security), but the UI should NOT display it here.
   - After successful password change, show a simple success message: "Password changed successfully." with a green check. No recovery code shown.
   - The `changePassword` method in useAuth.ts still generates and stores the recovery code (keep that logic). Just don't surface it in ChangePassword UI.

4. Update `src/auth/AuthProvider.tsx`:
   - Add `regenerateRecoveryCode` and `checkRecoveryCodeExists` to the AuthContext type.
   - Pass them through the context provider value so they are accessible via `useAuthContext()`.
   - SettingsPage should use `useAuthContext()` (consistent with existing pattern) to access these methods.

5. On first login (when user logs in with default password "clinic123"), the system already creates an auth record without a recovery code. The user will see "Recovery code is not configured" in Settings, prompting them to generate one. This is the correct UX: the doctor sets it up when they are ready.
</description>
<files>
- src/pages/SettingsPage.tsx
- src/auth/useAuth.ts
- src/auth/ChangePassword.tsx
</files>
<automated>
npm run build && echo "RECOVERY OK"
</automated>
</task>

<task id="5-02">
<title>Add breadcrumb navigation</title>
<description>
Gap 2: User has no sense of where they are in the app hierarchy. Add breadcrumbs to every page.

1. Create `src/components/Breadcrumbs.tsx`:
   - A simple breadcrumb component that accepts an array of crumbs:
     ```typescript
     interface Crumb {
       label: string
       path?: string  // if undefined, it's the current page (no link)
     }
     interface BreadcrumbsProps {
       crumbs: Crumb[]
     }
     ```
   - Renders crumbs separated by "/" or ">" character.
   - Each crumb with a `path` is a `<Link>` (blue, underlined on hover). The last crumb (current page) is plain text, bold.
   - Styling: `text-sm text-gray-500` for separators and links, `text-sm font-semibold text-gray-900` for current page.
   - Example output: `Home / Patients / Ahmed Khan`

2. Add breadcrumbs to each page. If Plan 4 created an `AppLayout` with a sticky header, breadcrumbs go inside the main content area just above the page content (not in the sticky header). Each page renders its own `<Breadcrumbs>` at the top.

   Pages and their breadcrumbs:
   - **HomePage**: No breadcrumbs (it's the root).
   - **PatientsPage**: `Home > Patients`
   - **RegisterPatientPage**: `Home > Register Patient`
   - **PatientProfilePage**: `Home > Patients > {patient.firstName} {patient.lastName}`
   - **SettingsPage**: `Home > Settings`

3. Edit each page to add the breadcrumb component at the top:
   - `src/pages/PatientsPage.tsx` (if it exists from Plan 4, otherwise this applies when Plan 4 creates it):
     ```tsx
     <Breadcrumbs crumbs={[
       { label: 'Home', path: '/' },
       { label: 'Patients' }
     ]} />
     ```
   - `src/pages/RegisterPatientPage.tsx`:
     ```tsx
     <Breadcrumbs crumbs={[
       { label: 'Home', path: '/' },
       { label: 'Register Patient' }
     ]} />
     ```
   - `src/pages/PatientProfilePage.tsx`:
     ```tsx
     <Breadcrumbs crumbs={[
       { label: 'Home', path: '/' },
       { label: 'Patients', path: '/patients' },
       { label: `${patient.firstName} ${patient.lastName}` }
     ]} />
     ```
     (Only render after patient is loaded, not during loading state.)
   - `src/pages/SettingsPage.tsx`:
     ```tsx
     <Breadcrumbs crumbs={[
       { label: 'Home', path: '/' },
       { label: 'Settings' }
     ]} />
     ```

4. The breadcrumbs should render with `mb-4` margin below them to separate from page content.
</description>
<files>
- src/components/Breadcrumbs.tsx (NEW)
- src/pages/PatientsPage.tsx
- src/pages/RegisterPatientPage.tsx
- src/pages/PatientProfilePage.tsx
- src/pages/SettingsPage.tsx
</files>
<automated>
npm run build && echo "BREADCRUMBS OK"
</automated>
</task>

<task id="5-03">
<title>Restrict gender options to Male and Female only</title>
<description>
Gap 4: The registration and edit forms offer "Other" as a gender option. For this clinic context, only Male and Female are needed.

1. Edit `src/db/index.ts`:
   - Change the Patient interface gender type from `'male' | 'female' | 'other'` to `'male' | 'female'`.

2. Edit `src/pages/RegisterPatientPage.tsx`:
   - Change the gender radio group from `(['male', 'female', 'other'] as const)` to `(['male', 'female'] as const)`.
   - Default gender value in initial form state stays `'male'` (already is).

3. Edit `src/components/PatientInfoCard.tsx`:
   - Change the gender radio group in edit mode from `(['male', 'female', 'other'] as const)` to `(['male', 'female'] as const)`.

4. No database migration needed. Existing records with `gender: 'other'` will still display correctly (the `capitalize` CSS class handles it). New registrations simply won't offer the option.
</description>
<files>
- src/db/index.ts
- src/pages/RegisterPatientPage.tsx
- src/components/PatientInfoCard.tsx
</files>
<automated>
npm run build && echo "GENDER OK"
</automated>
</task>

<task id="5-04">
<title>Show patient ID clearly after save</title>
<description>
Gap 5: Patient ID is not shown before save, and the "Will be assigned on save" message needs clearer UX.

The current behavior (ID assigned on save, not before) is correct by design (prevents gaps from abandoned forms). But the gap report says the ID visibility/assignment flow needs clarity.

1. Edit `src/pages/RegisterPatientPage.tsx`:
   - Keep the "Will be assigned on save" preview but make it more prominent and reassuring:
     ```tsx
     <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
       <label className="block text-sm font-medium text-blue-700 mb-1">Patient ID</label>
       <p className="text-base text-blue-600 font-medium">
         Assigned automatically when you save
       </p>
     </div>
     ```
     Change from gray (looks broken/disabled) to blue (looks intentional/informational).

2. After save, the user is navigated to the patient profile page where the ID is prominently displayed in the `PatientInfoCard`. Ensure the ID is the FIRST thing visible on the profile:
   - Edit `src/components/PatientInfoCard.tsx` (view mode):
     - Make the patient ID badge larger and more prominent: change from `text-sm font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-full` to `text-base font-mono font-bold bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full`.
     - This makes it immediately obvious what the patient's ID is when redirected after registration.

3. On the RegisterPatientPage, after successful save, optionally show a brief toast/flash indicating "Patient registered: 2026-XXXX" before navigating. However, since the navigation to the profile is immediate and the profile shows the ID prominently, this is optional. Skip the toast to keep it simple; the profile page is sufficient.
</description>
<files>
- src/pages/RegisterPatientPage.tsx
- src/components/PatientInfoCard.tsx
</files>
<automated>
npm run build && echo "PATIENT ID OK"
</automated>
</task>

<task id="5-05">
<title>Add CNIC auto-formatting (XXXXX-XXXXXXX-X)</title>
<description>
Gap 6: CNIC field should auto-format to Pakistani CNIC pattern: XXXXX-XXXXXXX-X (13 digits with dashes, e.g., 35202-8337552-7).

1. Create a CNIC formatting utility. Add to RegisterPatientPage.tsx (or create a small utility if preferred):
   ```typescript
   function formatCNIC(value: string): string {
     // Strip everything except digits
     const digits = value.replace(/\D/g, '').slice(0, 13)

     if (digits.length <= 5) return digits
     if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
     return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
   }
   ```

2. Edit `src/pages/RegisterPatientPage.tsx`:
   - Replace the CNIC input `onChange` handler:
     ```tsx
     onChange={(e) => updateField('cnic', formatCNIC(e.target.value))}
     ```
   - Add `maxLength={15}` to the CNIC input (13 digits + 2 dashes).
   - Update placeholder to show the format: `placeholder="XXXXX-XXXXXXX-X"`.
   - Add a help text below the CNIC input:
     ```tsx
     <p className="mt-1 text-xs text-gray-400">Format: XXXXX-XXXXXXX-X</p>
     ```

3. Edit `src/components/PatientInfoCard.tsx` (edit mode):
   - Apply the same `formatCNIC` function to the CNIC input in edit mode.
   - Add the same formatting on change and placeholder.
   - Import or duplicate the `formatCNIC` utility. If duplicating feels wrong, extract it to `src/utils/formatCNIC.ts` and import in both places.

4. For storage: store the formatted value (with dashes) in the database. This is fine since CNIC is display-only and not searched against.

5. Validation: CNIC is optional. If provided, it should have exactly 13 digits (when stripped). Add validation in the register form's `validate()` function:
   ```typescript
   if (form.cnic) {
     const cnicDigits = form.cnic.replace(/\D/g, '')
     if (cnicDigits.length > 0 && cnicDigits.length !== 13) {
       newErrors.cnic = 'CNIC must be 13 digits'
     }
   }
   ```
   Same validation in PatientInfoCard's `validate()`.
</description>
<files>
- src/utils/formatCNIC.ts (NEW)
- src/pages/RegisterPatientPage.tsx
- src/components/PatientInfoCard.tsx
</files>
<automated>
npm run build && echo "CNIC OK"
</automated>
</task>

## Verification

- [ ] `npm run build` succeeds with no errors
- [ ] Recovery code section appears in Settings page, separate from Change Password
- [ ] Clicking "View/Regenerate Recovery Code" prompts for current password
- [ ] Correct password shows the recovery code; incorrect password shows error
- [ ] Change Password form no longer shows recovery code after success
- [ ] Breadcrumbs appear on Patients, Register, Patient Profile, and Settings pages
- [ ] Breadcrumb links navigate correctly
- [ ] Gender options are only Male and Female on registration and edit forms
- [ ] Patient ID preview on registration form is styled as informational (blue), not broken (gray)
- [ ] Patient ID badge on profile page is large and prominent
- [ ] CNIC field auto-formats as user types: XXXXX-XXXXXXX-X
- [ ] CNIC field prevents entering more than 13 digits
- [ ] Partial CNIC (less than 13 digits) shows validation error on save attempt
- [ ] Empty CNIC passes validation (it's optional)
- [ ] All existing vitest tests still pass: `npx vitest run`

## must_haves

- Recovery code accessible from Settings (not shown after password change)
- Breadcrumb navigation on all inner pages
- Gender restricted to Male/Female only
- Patient ID preview clearly styled as intentional on registration form
- CNIC auto-formatting to XXXXX-XXXXXXX-X pattern
