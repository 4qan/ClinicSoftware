# Phase 3: Printing and Visit Completion - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Print prescription slips and dispensary slips from any visit, and streamline the new visit flow with inline patient creation. This completes the full visit workflow (find/create patient, log encounter, write Rx, print slips) in under 2 minutes. Cloud sync, prescription templates, and immutability are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Prescription slip layout
- Dedicated prescription view page (`/visit/:id/print` or similar) with formatted preview and print buttons
- Print buttons are NOT inside VisitCard; doctor navigates to a separate page to see the formatted slip and print
- Clinic/doctor header at top: doctor name, clinic name, address, phone (configurable in Settings)
- Footer with electronic signature disclaimer text (e.g., "This is a computer-generated prescription and does not require a signature"), doctor name, phone, clinic address
- Patient info section: name, patient ID, age/gender, date of visit
- Medication table: brand name, salt name, strength, form, dosage, frequency, duration
- Clinical notes and Rx notes included on prescription slip
- Default paper size: A5 (half A4, 148mm x 210mm), adjustable via CSS later

### Dispensary slip layout
- Patient name + patient ID + visit date for identification
- Full medication details: brand name, salt name, strength, form, dosage, frequency, duration
- No clinical notes, no Rx notes, no clinic header/footer
- Compact format, optimized for quick reading by dispenser

### Paper size and print setup
- Default to A5 (most common Rx pad size in Pakistan)
- This is a two-way door: changing paper size later is just CSS tweaks
- Print via browser's native `window.print()` with `@media print` CSS
- Must work correctly in Chrome/Edge print dialog
- Orientation and margins: Claude's discretion based on content fit

### Settings page redesign
- Settings page gets category-based layout with sub-sections
- Categories: Account (password/PIN), Medications (drug management), Clinic Info (print header/footer)
- Doctor selects a category first, then sees that section's controls
- No more monolithic settings dump

### Inline patient creation
- When doctor searches and no match found, show "Create [name] as new patient" option in search results (VISIT-03)
- Inline form includes ALL registration fields (name, age, gender, contact, CNIC), same as full registration
- Exact UX pattern (modal vs expandable section vs dropdown form): Claude's discretion after research
- After creation, patient is auto-selected and visit form continues seamlessly
- No page navigation away from the visit form (VISIT-01)

### Visit form layout change
- All form sections (clinical notes, prescription, Rx notes) always visible from the start
- Sections are greyed out / disabled until a patient is selected
- No layout shift when patient is picked (VISIT-02)
- This changes current behavior where sections are conditionally rendered

### Claude's Discretion
- Inline patient creation UX pattern (research best practices for usability and edge cases)
- Print page visual design and typography
- A5 layout specifics (margins, font sizes, spacing)
- Print orientation (portrait vs landscape)
- Settings category navigation pattern (tabs, cards, sidebar)
- How to link from VisitCard to the dedicated print page

</decisions>

<specifics>
## Specific Ideas

- Footer should include disclaimer like "This is a computer-generated prescription and does not require a signature" (or similar electronic signature language)
- Doctor's father is the user: not tech-savvy, needs extremely simple UI
- Clinic info (header/footer) should be a one-time setup in Settings that persists
- Settings page is getting cluttered: needs categorical organization before adding more settings
- Paper size is a two-way door, start with A5, adjust after father's feedback

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VisitCard` component: already displays visit with medications table, clinical notes, Rx notes. Print page can reuse this data structure
- `MedicationList` component: medication table with desktop/mobile variants, print layout can adapt the table format
- `CollapsibleSection` component: used in NewVisitPage, relevant for settings redesign categories
- `PatientInfoCard` component: patient display card, reusable for print header patient section
- `usePatientSearch` hook: already used in NewVisitPage, inline creation triggers from this search
- Visit data model: `Visit` + `VisitMedication` types in `@/db/index`, medication snapshots with full drug details

### Established Patterns
- Dexie.js with typed tables and indexed fields
- React functional components with hooks
- Tailwind CSS v4 for styling
- react-router-dom v7 with BrowserRouter
- Settings stored in Dexie `settings` table (key-value pattern, used for password hash, drug seed version, etc.)

### Integration Points
- VisitCard needs a "View/Print" link to the new dedicated print page
- NewVisitPage needs inline patient creation (currently links to `/register`)
- NewVisitPage needs form sections always visible but disabled
- SettingsPage needs category-based redesign before adding Clinic Info section
- New route needed: `/visit/:id/print` or similar for the prescription view page
- Settings `settings` table in Dexie needs clinic info entries (doctorName, clinicName, address, phone, footerText)

</code_context>

<deferred>
## Deferred Ideas

- Prescription immutability / audit trail (RX-05): still deferred from Phase 2
- Voice-to-text for clinical notes: still deferred
- Patient complaint/feedback logging: still deferred from Phase 1
- Cloud sync: v2 requirement

</deferred>

---

*Phase: 03-printing-and-visit-completion*
*Context gathered: 2026-03-06*
