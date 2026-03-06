# Phase 1: Foundation and Patient Management - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

A working offline PWA where the doctor can log in, register patients, search them, view and edit patient profiles. All data persisted locally in IndexedDB. No encounters or prescriptions yet (Phase 2). No printing (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Auth experience
- Password-based login (not PIN)
- Default password ships with app, doctor changes it in settings
- Stay logged in between sessions (persist until explicit logout)
- Wrong password: show error message, unlimited retries, no lockout
- Recovery: generate a one-time recovery code at setup, doctor writes it on paper, enter code to reset password
- First-run experience: doctor sees login with default password, can change in settings later

### Patient registration
- Single-page form, all fields visible, most important at top
- Auto-generated patient ID (2026-XXXX) shown at top of form as preview, only committed to database on save (no gaps if form abandoned)
- Required fields: first name, last name, gender, age
- Optional fields: contact number, CNIC
- Age input: simple number in years (no DOB, no months)
- Separate first name and last name fields
- Duplicate check: search bar at top of registration form, checks existing patients as doctor types name. If match found, doctor can navigate to existing patient instead
- No patient deletion in UI (compliance audit trail). Test data cleared via database reset before go-live

### Patient editing
- Edit button on patient profile opens editable form
- Patient ID (2026-XXXX) is locked, never editable
- All other fields (name, age, gender, contact, CNIC) are editable

### Search behavior
- Type-ahead live search (Claude's discretion on implementation)
- Search lives in two places: primary focus on home page, and persistent search in header across all pages
- Matches against: patient name, patient ID, contact number (not CNIC)
- Home page shows search bar + list of recently viewed/registered patients (5-10)
- No results: friendly message + "Register New Patient" button
- All edge cases handled with clean, simple messaging (non-tech-savvy user)

### Patient profile
- Info card at top: patient ID, full name, age/gender, contact (Claude's discretion on prominence hierarchy)
- History section below (empty in Phase 1, populated in Phase 2)
- Edit button on info card to update patient details
- No "New Visit" button until Phase 2
- UI wording: "Patient Visit" not "Encounter" (simpler for the doctor)

### Claude's Discretion
- Search implementation approach (type-ahead vs debounced, result count)
- Profile info card layout and visual hierarchy
- Empty state designs for profile history
- Loading states and transitions
- Overall visual design system (colors, spacing, typography)
- PWA setup details (service worker strategy, manifest config)
- IndexedDB schema design
- Navigation structure and routing

</decisions>

<specifics>
## Specific Ideas

- Doctor is not tech-savvy (this is Furqan's father), UI must be extremely simple with large text and obvious actions
- Clinic has unreliable internet, can be out for hours or a full day
- Runs on an old Windows machine with Chrome/Edge
- "Keep the experience really clean and simple" (repeated emphasis)
- Search on registration page to prevent duplicate patients
- Recently viewed patients on home page for quick access to same-day follow-ups

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (greenfield project, no source code yet)

### Established Patterns
- None yet. This phase establishes the foundational patterns for the entire app.

### Integration Points
- IndexedDB will be the data layer for all subsequent phases
- Auth state management will gate all app access
- Patient data model will be extended by encounters (Phase 2) and prescriptions (Phase 2)
- Search infrastructure will be reused for drug search in Phase 2

</code_context>

<deferred>
## Deferred Ideas

- Patient complaint/feedback logging feature (patient was unhappy, launched complaint). Suggested for Phase 2 or later.
- Cloud sync (v2 requirement, already tracked in REQUIREMENTS.md)

</deferred>

---

*Phase: 01-foundation-and-patient-management*
*Context gathered: 2026-03-05*
