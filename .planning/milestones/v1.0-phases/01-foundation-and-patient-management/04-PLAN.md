---
phase: 1
plan: 4
name: "UI Overhaul: Sidebar Navigation and Table-Based Patient List"
wave: 4
depends_on: [3]
requirements: [PAT-01, PAT-03, PAT-04]
files_modified:
  - src/App.tsx
  - src/components/Sidebar.tsx
  - src/components/AppLayout.tsx
  - src/components/Header.tsx
  - src/pages/HomePage.tsx
  - src/pages/PatientsPage.tsx
  - src/components/PatientTable.tsx
  - src/components/RecentPatients.tsx
  - src/components/PatientCard.tsx
  - src/pages/PatientProfilePage.tsx
  - src/pages/RegisterPatientPage.tsx
  - src/pages/SettingsPage.tsx
  - src/auth/LoginPage.tsx
  - src/index.css
autonomous: true
estimated_tasks: 6
---

# Plan 4: UI Overhaul: Sidebar Navigation and Table-Based Patient List

## Objective

Replace the current top-header-only navigation with a persistent sidebar layout, convert patient listings from cards to a data table, add a dedicated Patients page with search and "Create New Patient" CTA, make patient rows clickable, and ensure consistent cursor/hover behavior across all interactive elements. This addresses Gaps 3, 7, 8, 9, and 10 from VERIFICATION.md.

## Tasks

<task id="4-01">
<title>Create persistent Sidebar component</title>
<description>
Build a sidebar navigation component that persists across all authenticated pages.

1. Create `src/components/Sidebar.tsx`:
   - Fixed-position sidebar on the left, 240px wide, full viewport height.
   - Background: white (`bg-white`), right border (`border-r border-gray-200`).
   - Top section: app name "Clinic Software" in bold, 20px, with a subtle medical cross or stethoscope emoji-free icon (just text is fine). Link to `/`.
   - Navigation items as vertical list with icons (use simple inline SVGs or text-only labels). Each item:
     - `Home` linking to `/`
     - `Patients` linking to `/patients`
     - `Register Patient` linking to `/register`
     - `Settings` linking to `/settings`
   - Active route highlighted with `bg-blue-50 text-blue-700 font-semibold` and a left border accent (`border-l-4 border-blue-600`).
   - Inactive items: `text-gray-700 hover:bg-gray-50 hover:text-gray-900`.
   - Each nav item should have `cursor-pointer` and minimum height of 44px for accessibility.
   - Use `useLocation()` from react-router-dom to determine active state. For `/patient/:id` routes, highlight "Patients" as active.
   - Bottom section: "Log Out" button, styled as a text link, `text-gray-500 hover:text-gray-900`, positioned at the bottom of the sidebar with `mt-auto`.
   - Font size for nav items: `text-base` (16px).

2. Use simple SVG icons for each nav item (home, users/people, plus-circle, gear). Keep them inline, no icon library needed. Each icon should be 20x20.

The sidebar should be a clean, professional left nav. Not flashy, just clear and functional for a non-tech-savvy user.
</description>
<files>
- src/components/Sidebar.tsx (NEW)
</files>
<automated>
npm run build && echo "SIDEBAR OK"
</automated>
</task>

<task id="4-02">
<title>Create AppLayout wrapper and restructure App.tsx</title>
<description>
Replace the current Header-based layout with a sidebar + main content layout.

1. Create `src/components/AppLayout.tsx`:
   - Renders a flex container: sidebar on the left, main content on the right.
   - Structure:
     ```tsx
     <div className="flex min-h-screen bg-gray-50">
       <Sidebar />
       <main className="flex-1 ml-60">
         {/* ml-60 = 240px to account for fixed sidebar */}
         <div className="p-6">
           {children}
         </div>
       </main>
     </div>
     ```
   - The `children` prop renders the route content.

2. Update `src/App.tsx`:
   - Remove the `<Header />` import and rendering.
   - Wrap the `<Routes>` block with `<AppLayout>`.
   - Add new route: `<Route path="/patients" element={<PatientsPage />} />`.
   - Import `PatientsPage` (will be created in task 4-03).
   - The structure becomes:
     ```tsx
     <AppLayout>
       <Routes>
         <Route path="/" element={<HomePage />} />
         <Route path="/patients" element={<PatientsPage />} />
         <Route path="/register" element={<RegisterPatientPage />} />
         <Route path="/patient/:id" element={<PatientProfilePage />} />
         <Route path="/settings" element={<SettingsPage />} />
       </Routes>
     </AppLayout>
     ```

3. Update `src/components/Header.tsx`:
   - Convert it to a lightweight page-level header (not a global nav bar). Remove the app name link, remove the settings link, remove the logout button (all now in sidebar).
   - Keep ONLY the search bar functionality. Rename it or simplify it to just be a search input that lives at the top of the main content area.
   - Actually, since the sidebar handles navigation, the Header component should be repurposed into a top bar within the main content area that only contains the search bar. It should be rendered inside `AppLayout` above `{children}`:
     ```tsx
     <main className="flex-1 ml-60">
       <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
         {/* Search bar from current Header, but stripped to just search */}
       </div>
       <div className="p-6">
         {children}
       </div>
     </main>
     ```
   - Remove the "Clinic Software" link, settings icon, and logout button from the header. Only the search input and its dropdown remain.
   - Make the search bar wider now that it has more space: `max-w-xl` instead of `max-w-md`.

4. Remove unused imports from `App.tsx` (old Header component if it was directly imported for the nav bar purpose).
</description>
<files>
- src/components/AppLayout.tsx (NEW)
- src/App.tsx
- src/components/Header.tsx
</files>
<automated>
npm run build && echo "LAYOUT OK"
</automated>
</task>

<task id="4-03">
<title>Create Patients page with table-based listing and CTA</title>
<description>
Build a new dedicated Patients page that shows all patients in a table with a "Register New Patient" button.

1. Create `src/pages/PatientsPage.tsx`:
   - Page heading: "Patients" (`text-2xl font-bold text-gray-900`).
   - Top bar below heading: a "Register New Patient" button on the right side. Style: `px-4 py-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer`. Links to `/register`.
   - Below the top bar: render `<PatientTable />` component (created in task 4-04).
   - The page fetches all patients from the database using `useLiveQuery` from dexie-react-hooks:
     ```tsx
     import { useLiveQuery } from 'dexie-react-hooks'
     import { db } from '@/db/index'
     const patients = useLiveQuery(() => db.patients.orderBy('createdAt').reverse().toArray()) ?? []
     ```
   - Pass patients to `<PatientTable patients={patients} />`.
   - Empty state: when no patients exist, show centered message "No patients registered yet" with a "Register First Patient" link to `/register`.

2. This page addresses Gap 7 (missing CTA on patients listing) directly.
</description>
<files>
- src/pages/PatientsPage.tsx (NEW)
</files>
<automated>
npm run build && echo "PATIENTS PAGE OK"
</automated>
</task>

<task id="4-04">
<title>Build PatientTable component with clickable rows</title>
<description>
Replace card-based patient display with a proper HTML table.

1. Create `src/components/PatientTable.tsx`:
   - Accepts `patients: Patient[]` as prop.
   - Renders an HTML `<table>` with the following columns:
     - **Patient ID** (font-mono, small blue badge style inline)
     - **Name** (firstName + lastName, bold)
     - **Age** (number + "y")
     - **Gender** (capitalized)
     - **Contact** (or "-" if empty)
   - Table styling:
     - `w-full` width.
     - Header row: `bg-gray-50 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide`. Header cells: `px-4 py-3`.
     - Body rows: `bg-white border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors`. Body cells: `px-4 py-3 text-base`.
     - Alternating row colors are NOT needed (hover highlight is sufficient).
   - Each row is clickable. Use `useNavigate` and `onClick={() => navigate(`/patient/${patient.id}`)}` on the `<tr>`.
   - This addresses Gap 9 (row click navigates to detail) and Gap 10 (consistent cursor-pointer on hover).

2. The table must be responsive: on narrow screens, add `overflow-x-auto` wrapper around the table so it scrolls horizontally if needed. But since the primary target is desktop, this is secondary.

3. If there are many patients, the table should show all of them (no pagination needed for v1, a typical clinic has a few thousand at most).
</description>
<files>
- src/components/PatientTable.tsx (NEW)
</files>
<automated>
npm run build && echo "TABLE OK"
</automated>
</task>

<task id="4-05">
<title>Update HomePage to use new layout</title>
<description>
Simplify the HomePage for the new sidebar-based layout.

1. Edit `src/pages/HomePage.tsx`:
   - Remove the `max-w-3xl mx-auto` wrapper (the AppLayout handles padding now).
   - Keep the "Register New Patient" button but style it as a prominent card/button at the top. Change from the centered link to a more integrated look:
     ```tsx
     <Link
       to="/register"
       className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
     >
       Register New Patient
     </Link>
     ```
   - Keep the Recent Patients section. But change `RecentPatients` to use `PatientTable` instead of `PatientCard` list for consistency:
     ```tsx
     {recentPatients.length > 0 && (
       <div className="mt-6">
         <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Patients</h3>
         <PatientTable patients={recentPatients} />
       </div>
     )}
     ```
   - This gives a consistent table-based look throughout the app.

2. The `RecentPatients` component and `PatientCard` component may become unused after this change. Do NOT delete them yet (they might be useful elsewhere or could be cleaned up later). Just stop importing them in HomePage.

3. Remove the `max-w-3xl` constraint. The table should use available width within the main content area.
</description>
<files>
- src/pages/HomePage.tsx
</files>
<automated>
npm run build && echo "HOMEPAGE OK"
</automated>
</task>

<task id="4-06">
<title>Global cursor-pointer fix and visual polish</title>
<description>
Ensure consistent hover/cursor behavior across the entire app and apply general visual polish.

1. Edit `src/index.css` to add a global rule that ensures all interactive elements show pointer cursor:
   ```css
   button, a, [role="button"], input[type="radio"], input[type="checkbox"], select {
     cursor: pointer;
   }
   ```
   This addresses Gap 10 globally without having to add `cursor-pointer` to every individual element.

2. Audit and fix specific components for hover states:
   - `src/components/PatientInfoCard.tsx`: Ensure the "Edit" button has `cursor-pointer` (should be covered by global rule but verify the class is not overridden).
   - `src/auth/LoginPage.tsx`: Ensure "Forgot password?" button has `cursor-pointer`.
   - `src/pages/RegisterPatientPage.tsx`: Ensure the "Cancel" link and "Save Patient" button have `cursor-pointer`.
   - `src/pages/SettingsPage.tsx`: No changes needed.

3. Remove `max-w-2xl mx-auto` from `RegisterPatientPage.tsx` outer wrapper, replace with just `max-w-2xl` (the AppLayout provides overall padding). Same for `SettingsPage.tsx` and `PatientProfilePage.tsx`: remove `mx-auto p-6` since `AppLayout` now provides padding.
   - `RegisterPatientPage.tsx`: change `<div className="max-w-2xl mx-auto p-6">` to `<div className="max-w-2xl">`
   - `SettingsPage.tsx`: change `<div className="max-w-2xl mx-auto p-6">` to `<div className="max-w-2xl">`
   - `PatientProfilePage.tsx`: change `<div className="max-w-4xl mx-auto p-6">` to `<div className="max-w-4xl">` (and same for loading/not-found states)

4. Verify the entire app with `npm run build` to ensure no dead imports or broken references.
</description>
<files>
- src/index.css
- src/components/PatientInfoCard.tsx
- src/pages/RegisterPatientPage.tsx
- src/pages/SettingsPage.tsx
- src/pages/PatientProfilePage.tsx
</files>
<automated>
npm run build && echo "POLISH OK"
</automated>
</task>

## Verification

- [ ] `npm run build` succeeds with no errors
- [ ] Sidebar is visible on the left side of every authenticated page
- [ ] Sidebar highlights the current page (Home, Patients, Register, Settings)
- [ ] Clicking sidebar items navigates to the correct page
- [ ] `/patients` route shows a table of all registered patients
- [ ] "Register New Patient" button is visible on the Patients page
- [ ] Clicking a patient row in the table navigates to `/patient/:id`
- [ ] Table rows show `cursor-pointer` on hover and highlight with blue background
- [ ] All interactive elements (buttons, links, radio buttons) show pointer cursor on hover
- [ ] HomePage shows recent patients in a table (not cards)
- [ ] Search bar is accessible from the top of every page (in the sticky header area)
- [ ] Logout button works from the sidebar
- [ ] Layout does not break on narrow screens (content scrolls, sidebar stays fixed)
- [ ] All existing vitest tests still pass: `npx vitest run`

## must_haves

- Persistent sidebar navigation with Home, Patients, Register Patient, Settings
- Table-based patient listing on `/patients` with clickable rows
- "Register New Patient" CTA on the Patients page
- Patient row click navigates to patient detail page
- Consistent cursor-pointer on all interactive elements
- Search bar accessible from every page
