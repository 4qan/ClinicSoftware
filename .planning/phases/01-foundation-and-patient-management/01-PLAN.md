---
phase: 1
plan: 1
name: "Project Setup, PWA Foundation, Data Layer, and Authentication"
wave: 1
depends_on: []
requirements: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05]
files_modified:
  - package.json
  - tsconfig.json
  - vite.config.ts
  - vitest.config.ts
  - playwright.config.ts
  - tailwind.config.ts
  - index.html
  - public/manifest.webmanifest
  - public/icon-192.png
  - public/icon-512.png
  - src/main.tsx
  - src/App.tsx
  - src/index.css
  - src/db/index.ts
  - src/db/timestamps.ts
  - src/auth/hash.ts
  - src/auth/useAuth.ts
  - src/auth/AuthProvider.tsx
  - src/auth/LoginPage.tsx
  - src/auth/ChangePassword.tsx
  - src/__tests__/setup.ts
  - src/__tests__/db.test.ts
  - src/__tests__/timestamps.test.ts
  - src/__tests__/auth.test.ts
  - src/__tests__/login.test.tsx
  - e2e/pwa.spec.ts
  - e2e/offline.spec.ts
autonomous: true
estimated_tasks: 7
---

# Plan 1: Project Setup, PWA Foundation, Data Layer, and Authentication

## Objective

Scaffold the Vite + React + TypeScript + Tailwind project with PWA installability, IndexedDB persistence via Dexie.js, audit trail timestamps, password-based authentication, and the full test infrastructure (Vitest, Testing Library, Playwright).

## must_haves

- Project builds and runs with `npm run dev` and `npm run build`
- App is installable as a PWA (valid manifest, service worker registers, icons present)
- Service worker precaches all app assets for offline use
- IndexedDB database initializes with patients, settings, and recentPatients tables
- Every create/update operation auto-sets createdAt/updatedAt timestamps
- Doctor can log in with default password, change password, and stay logged in across sessions
- Recovery code generated on password change, usable to reset password
- Wrong password shows error, no lockout
- All unauthenticated access redirected to login
- Test infrastructure (Vitest + fake-indexeddb + Testing Library + Playwright) is operational

## Tasks

<task id="1-01">
<title>Scaffold Vite + React + TypeScript + Tailwind project</title>
<description>
Initialize the project with Vite, React 19, TypeScript, and Tailwind CSS 4.x.

1. Run `npm create vite@latest . -- --template react-ts` (or equivalent manual setup).
2. Install Tailwind CSS 4.x and configure it.
3. Set up `index.html` with proper meta tags (viewport, theme-color, charset).
4. Create `src/main.tsx` rendering `<App />` into `#root`.
5. Create `src/App.tsx` with a placeholder "Clinic Software" heading.
6. Create `src/index.css` with Tailwind directives and base styles (large text defaults, high contrast).
7. Configure `tsconfig.json` with strict mode, path aliases (`@/` pointing to `src/`).
8. Verify `npm run dev` starts and `npm run build` produces output in `dist/`.
</description>
<files>
- package.json
- tsconfig.json
- tsconfig.app.json
- vite.config.ts
- tailwind.config.ts
- index.html
- src/main.tsx
- src/App.tsx
- src/index.css
</files>
<automated>
npm run build && echo "BUILD OK"
</automated>
</task>

<task id="1-02">
<title>Set up test infrastructure (Wave 0)</title>
<description>
Install and configure all test tooling so subsequent tasks can write tests immediately.

1. Install Vitest 3.x, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, fake-indexeddb.
2. Install Playwright and @playwright/test. Run `npx playwright install chromium`.
3. Create `vitest.config.ts` with jsdom environment, setup file reference, path aliases matching tsconfig.
4. Create `playwright.config.ts` targeting localhost dev server, Chromium only.
5. Create `src/__tests__/setup.ts` that imports `fake-indexeddb/auto` and any Testing Library matchers.
6. Add npm scripts: `"test"`, `"test:unit"`, `"test:e2e"`.
7. Write a trivial smoke test (`src/__tests__/smoke.test.ts`) that asserts `1 + 1 === 2` to verify Vitest runs.
8. Write a trivial Playwright test (`e2e/smoke.spec.ts`) that loads the app and checks the heading exists.
</description>
<files>
- vitest.config.ts
- playwright.config.ts
- src/__tests__/setup.ts
- src/__tests__/smoke.test.ts
- e2e/smoke.spec.ts
- package.json
</files>
<automated>
npx vitest run --reporter=verbose 2>&1 | tail -5
</automated>
</task>

<task id="1-03">
<title>PWA manifest and service worker setup</title>
<description>
Make the app installable as a PWA and cache all assets for offline use.

1. Install `vite-plugin-pwa`.
2. Configure `vite-plugin-pwa` in `vite.config.ts` with:
   - `registerType: 'autoUpdate'`
   - `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`
   - Manifest: name "Clinic Software", short_name "Clinic", display "standalone", theme_color, background_color, start_url "/", icons array.
3. Create placeholder PWA icons: `public/icon-192.png` (192x192) and `public/icon-512.png` (512x512). Simple solid-color squares with a "C" letter are sufficient for now.
4. Add `<link rel="manifest">` if not auto-injected.
5. Verify the production build includes the service worker file and manifest.
</description>
<files>
- vite.config.ts
- public/icon-192.png
- public/icon-512.png
</files>
<automated>
npm run build && ls dist/sw.js dist/manifest.webmanifest 2>/dev/null && echo "PWA assets present" || (ls dist/*.js dist/*.webmanifest 2>/dev/null; echo "Check PWA output")
</automated>
</task>

<task id="1-04">
<title>IndexedDB setup with Dexie.js and patient schema</title>
<description>
Set up the local database that all features depend on.

1. Install `dexie` and `dexie-react-hooks`.
2. Create `src/db/index.ts`:
   - Define TypeScript interfaces: `Patient`, `AppSettings`, `RecentPatient`.
   - Patient fields: id (string, UUID), patientId (string, "2026-XXXX"), firstName, lastName, firstNameLower, lastNameLower, age (number), gender ('male' | 'female' | 'other'), contact (optional string), cnic (optional string), createdAt (string, ISO 8601), updatedAt (string, ISO 8601).
   - AppSettings fields: key (string), value (any).
   - RecentPatient fields: id (string, patient UUID), viewedAt (string, ISO 8601).
   - Create Dexie instance named 'ClinicSoftware'.
   - Define version(1) stores with indexes: patients on `id, patientId, firstNameLower, lastNameLower, contact, createdAt`; settings on `key`; recentPatients on `id, viewedAt`.
3. Export the db instance and all interfaces.
4. Write unit tests (`src/__tests__/db.test.ts`) using fake-indexeddb:
   - Database initializes without error.
   - Can add and retrieve a patient record.
   - Indexes work (query by patientId, firstNameLower, contact).
</description>
<files>
- src/db/index.ts
- src/__tests__/db.test.ts
</files>
<automated>
npx vitest run db --reporter=verbose
</automated>
</task>

<task id="1-05">
<title>Audit trail timestamp middleware</title>
<description>
Ensure every database write automatically sets createdAt/updatedAt for compliance.

1. Create `src/db/timestamps.ts`:
   - Export a `withTimestamps<T>(data: T, isNew: boolean): T` function that sets `createdAt` (if new) and `updatedAt` to `new Date().toISOString()`.
   - Export helper functions `createPatient(data)` and `updatePatient(id, changes)` that wrap Dexie operations with timestamp injection. These are the only functions the app should use to write patient data.
2. Write unit tests (`src/__tests__/timestamps.test.ts`):
   - `withTimestamps` sets both fields on new records.
   - `withTimestamps` sets only updatedAt on existing records, preserving createdAt.
   - `createPatient` stores a patient with both timestamps set.
   - `updatePatient` updates a patient and changes only updatedAt.
   - Timestamps are valid ISO 8601 strings.
</description>
<files>
- src/db/timestamps.ts
- src/__tests__/timestamps.test.ts
</files>
<automated>
npx vitest run timestamps --reporter=verbose
</automated>
</task>

<task id="1-06">
<title>Authentication system with password hashing</title>
<description>
Implement offline-only single-user auth using Web Crypto API PBKDF2.

1. Create `src/auth/hash.ts`:
   - `generateSalt(): Uint8Array` (32 bytes from crypto.getRandomValues).
   - `hashPassword(password: string, salt: Uint8Array): Promise<string>` using PBKDF2 with 100,000 iterations, SHA-256, returning hex string.
   - `verifyPassword(password: string, salt: Uint8Array, expectedHash: string): Promise<boolean>`.
   - `generateRecoveryCode(): string` (8-char alphanumeric).

2. Create `src/auth/useAuth.ts` (or integrate into AuthProvider):
   - On first run: no `auth` key in settings table. Default password is "clinic123".
   - `login(password)`: hash input with stored salt, compare to stored hash. If no auth record exists, compare plaintext to default, then create the auth record with hashed default.
   - `changePassword(currentPassword, newPassword)`: verify current, generate new salt+hash, generate recovery code, store all, return recovery code for display.
   - `recoverWithCode(code, newPassword)`: verify code hash, set new password.
   - `logout()`: clear localStorage flag and auth state.
   - `isAuthenticated`: boolean state. Persist via localStorage flag ("clinic_auth_session"). On app load, if flag present, auto-authenticate.

3. Create `src/auth/AuthProvider.tsx`:
   - React context providing auth state and methods to the component tree.
   - Wraps the app: if not authenticated, render LoginPage; otherwise render children.

4. Write unit tests (`src/__tests__/auth.test.ts`):
   - Password hashing produces consistent results with same salt.
   - Different passwords produce different hashes.
   - `verifyPassword` returns true for correct password, false for wrong.
   - Recovery code is 8 characters, alphanumeric.
</description>
<files>
- src/auth/hash.ts
- src/auth/useAuth.ts
- src/auth/AuthProvider.tsx
- src/__tests__/auth.test.ts
</files>
<automated>
npx vitest run auth --reporter=verbose
</automated>
</task>

<task id="1-07">
<title>Login page UI and auth integration</title>
<description>
Build the login screen and wire authentication into the app shell.

1. Create `src/auth/LoginPage.tsx`:
   - Simple centered form: password input field (large, 18px+), "Log In" button (large, 44px+ tall, primary color).
   - On wrong password: show red error message "Incorrect password. Please try again."
   - "Forgot password?" link below the form that reveals recovery code input + new password fields.
   - No username field (single user).
   - Friendly, clean design. Large text, high contrast.

2. Create `src/auth/ChangePassword.tsx`:
   - Form with current password, new password, confirm new password fields.
   - On success: display the generated recovery code with instructions to write it down on paper.
   - This component will be used in settings (future), but build it standalone for now.

3. Update `src/App.tsx`:
   - Wrap app content with `<AuthProvider>`.
   - When authenticated, show a placeholder "Home" view with a "Log Out" button.
   - When not authenticated, LoginPage is shown (handled by AuthProvider).

4. Write component tests (`src/__tests__/login.test.tsx`):
   - Login form renders with password input and submit button.
   - Submitting wrong password shows error message.
   - Submitting correct password (default "clinic123" on first run) transitions past login.
   - Logout returns to login screen.

5. Write E2E tests:
   - `e2e/pwa.spec.ts`: Production build serves manifest and registers service worker (FOUND-01, FOUND-03).
   - `e2e/offline.spec.ts`: App loads, login works, basic interaction works with network disabled (FOUND-02).
</description>
<files>
- src/auth/LoginPage.tsx
- src/auth/ChangePassword.tsx
- src/App.tsx
- src/__tests__/login.test.tsx
- e2e/pwa.spec.ts
- e2e/offline.spec.ts
</files>
<automated>
npx vitest run login --reporter=verbose
</automated>
</task>

## Verification

- [ ] `npm run build` succeeds with no errors
- [ ] `npx vitest run --reporter=verbose` passes all unit and component tests
- [ ] `npx playwright test` passes PWA and offline E2E tests
- [ ] App opens in browser, shows login screen
- [ ] Default password "clinic123" logs in successfully
- [ ] Wrong password shows error message without lockout
- [ ] Logged-in state persists after page refresh (localStorage flag)
- [ ] Logout returns to login screen and clears session
- [ ] Production build includes service worker and manifest files
- [ ] IndexedDB "ClinicSoftware" database creates with patients, settings, recentPatients tables
- [ ] All create/update operations auto-set ISO 8601 timestamps

---
*Phase: 01-foundation-and-patient-management*
*Plan created: 2026-03-05*
