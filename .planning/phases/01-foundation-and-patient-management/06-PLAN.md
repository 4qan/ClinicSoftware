---
phase: 1
plan: 6
name: "UAT Gap Closure (Round 2)"
wave: 6
depends_on: [5]
requirements: [PAT-01, PAT-02, FOUND-04]
files_modified:
  - src/components/Sidebar.tsx
  - src/components/AppLayout.tsx
  - src/db/patients.ts
  - src/pages/RegisterPatientPage.tsx
  - src/auth/ChangePassword.tsx
autonomous: true
estimated_tasks: 3
---

# Plan 6: UAT Gap Closure (Round 2)

## Objective

Fix 3 gaps diagnosed in 01-UAT.md: (1) move Register Patient from sidebar nav to a CTA in the sticky header, (2) show a patient ID preview on the registration form, (3) add show/hide toggles to password fields in ChangePassword and fix its layout alignment with the Security Code card.

## Tasks

Tasks 1, 2, and 3 have no shared files and can all run in parallel.

<task id="6-01">
<title>Move Register Patient from sidebar nav to sticky header CTA</title>
<description>
Gap: Register Patient is a navigation item in the sidebar. It should be a call-to-action button in the sticky header bar, next to the SearchBar.

1. Edit `src/components/Sidebar.tsx`:
   - Remove the Register Patient entry from the `navItems` array (lines 23-31, the object with `label: 'Register Patient'` and `path: '/register'`).
   - The array should contain only Home, Patients, and Settings.

2. Edit `src/components/AppLayout.tsx`:
   - Add `import { Link } from 'react-router-dom'` at the top.
   - Change the sticky header div (line 14) from rendering just `<SearchBar variant="compact" />` to a flex row with the SearchBar and a CTA button:
     ```tsx
     <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
       <div className="flex items-center gap-4">
         <div className="flex-1">
           <SearchBar variant="compact" />
         </div>
         <Link
           to="/register"
           className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
           style={{ minHeight: '40px' }}
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
           </svg>
           Register Patient
         </Link>
       </div>
     </div>
     ```
</description>
<files>
- src/components/Sidebar.tsx
- src/components/AppLayout.tsx
</files>
<automated>
npm run build && echo "CTA OK"
</automated>
</task>

<task id="6-02">
<title>Add patient ID preview on registration form</title>
<description>
Gap: Registration form shows "Assigned automatically when you save" instead of a preview of the next patient ID (e.g., "2026-0003").

1. Edit `src/db/patients.ts`:
   - Add a new exported function `getNextPatientId()` that peeks at the next ID without incrementing the counter:
     ```typescript
     export async function getNextPatientId(): Promise<string> {
       const setting = await db.settings.get('patientCounter')
       const nextCounter = setting ? (setting.value as number) + 1 : 1
       const padded = nextCounter >= 10000 ? String(nextCounter) : String(nextCounter).padStart(4, '0')
       return `${CURRENT_YEAR}-${padded}`
     }
     ```
   - Place it directly after the `generatePatientId()` function.

2. Edit `src/pages/RegisterPatientPage.tsx`:
   - Add `getNextPatientId` to the import from `@/db/patients`.
   - Add state: `const [previewId, setPreviewId] = useState<string>('')`
   - Add useEffect: `useEffect(() => { getNextPatientId().then(setPreviewId) }, [])`
   - Replace the static text Patient ID preview (lines 101-107) with:
     ```tsx
     <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
       <label className="block text-sm font-medium text-blue-700 mb-1">Patient ID</label>
       <p className="text-lg text-blue-800 font-bold font-mono">
         {previewId || '...'}
       </p>
     </div>
     ```
</description>
<files>
- src/db/patients.ts
- src/pages/RegisterPatientPage.tsx
</files>
<automated>
npm run build && echo "PREVIEW OK"
</automated>
</task>

<task id="6-03">
<title>Add show/hide toggles to ChangePassword fields and fix layout</title>
<description>
Gap: (1) Password fields in ChangePassword.tsx lack Show/Hide toggles. (2) ChangePassword uses `max-w-sm mx-auto` making it narrower and misaligned with the Security Code card above it.

Reference pattern: `src/auth/LoginPage.tsx` lines 155-174 show the working toggle pattern.

1. Edit `src/auth/ChangePassword.tsx`:

   **Add toggle state** (after existing useState declarations):
   ```typescript
   const [showCurrentPassword, setShowCurrentPassword] = useState(false)
   const [showNewPassword, setShowNewPassword] = useState(false)
   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
   ```

   **Fix layout**: Change the outer div from `max-w-sm mx-auto` to card style matching RecoveryCodeSection:
   ```tsx
   <div className="bg-white border border-gray-200 rounded-lg p-6">
   ```

   **Update heading** to match Security Code card: `<h3 className="text-lg font-bold text-gray-900 mb-2">Change Password</h3>`

   **Wrap each password input** in a relative div with toggle button. For each of the 3 fields:
   - Add `pr-16` to input className
   - Change `type="password"` to `type={showXxx ? 'text' : 'password'}`
   - Wrap in `<div className="relative">`
   - Add toggle button:
     ```tsx
     <button
       type="button"
       onClick={() => setShowXxx(!showXxx)}
       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
       aria-label={showXxx ? 'Hide password' : 'Show password'}
     >
       {showXxx ? 'Hide' : 'Show'}
     </button>
     ```
</description>
<files>
- src/auth/ChangePassword.tsx
</files>
<automated>
npm run build && echo "TOGGLES OK"
</automated>
</task>

## Verification

- [ ] `npm run build` succeeds with no errors
- [ ] Sidebar shows only Home, Patients, Settings (no Register Patient)
- [ ] Sticky header shows SearchBar on the left and "Register Patient" CTA button on the right
- [ ] Registration form shows next patient ID preview in blue box
- [ ] All 3 password fields in Settings > Change Password have Show/Hide toggles
- [ ] Change Password section has same card styling as Security Code section
- [ ] All existing vitest tests still pass: `npx vitest run`

## must_haves

- Register Patient removed from sidebar, added as CTA in sticky header
- Patient ID preview shown on registration form via read-only peek function
- Show/Hide toggles on all 3 ChangePassword fields
- ChangePassword card layout matches SecurityCode card layout
