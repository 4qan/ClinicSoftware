---
phase: 1
plan: 7
name: "UAT Gap Closure (Round 3)"
wave: 7
depends_on: [6]
requirements: []
files_modified:
  - src/pages/HomePage.tsx
  - src/pages/PatientsPage.tsx
autonomous: true
estimated_tasks: 1
gap_closure: true
---

# Plan 7: UAT Gap Closure (Round 3)

## Context

UAT Round 2 (01-UAT-R2.md) diagnosed 1 gap: the sticky header CTA in AppLayout is now the single entry point for patient registration, making the standalone Register Patient buttons on HomePage and PatientsPage redundant. The empty-state "Register First Patient" link in PatientsPage is contextual guidance and must be preserved.

## Task 1: Remove redundant Register Patient CTAs

### HomePage (`src/pages/HomePage.tsx`)

**Remove lines 10-18** (the entire register button div):

```tsx
// DELETE this block (lines 10-18):
      {/* Register button */}
      <div className="mb-8">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
        >
          Register New Patient
        </Link>
      </div>
```

After removal, the `Link` import from `react-router-dom` is no longer used. Remove it from the import statement on line 1.

**Expected result:** HomePage renders only the "Recent Patients" section (when patients exist) or an empty div (when none).

### PatientsPage (`src/pages/PatientsPage.tsx`)

**Remove lines 15-20** (the Register New Patient button in the header) and simplify the header div:

```tsx
// REPLACE lines 13-21:
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <Link
          to="/register"
          className="px-4 py-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
        >
          Register New Patient
        </Link>
      </div>

// WITH:
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patients</h2>
```

**Keep** the empty-state "Register First Patient" link (lines 23-32). This is contextual guidance for first-time users, not a duplicate CTA.

The `Link` import must remain because the empty-state still uses it.

**Expected result:** PatientsPage header shows only the "Patients" title. Empty state still shows "Register First Patient" link. Patient table renders normally when patients exist.

### Verification

1. Navigate to Home: no register button visible, recent patients table still works.
2. Navigate to Patients (with data): header shows only "Patients" title, table renders.
3. Navigate to Patients (empty): "Register First Patient" link still appears and navigates to `/register`.
4. Sticky header "Register Patient" button remains functional across all pages.
