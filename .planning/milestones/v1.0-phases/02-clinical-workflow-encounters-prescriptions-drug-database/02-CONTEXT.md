# Phase 2: Clinical Workflow (Encounters, Prescriptions, Drug Database) - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The doctor can log visits, write prescriptions with medication autocomplete from a pre-seeded drug database, and manage custom medications. This completes the core clinical data loop. Printing is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Visit flow
- Two entry points: "New Visit" button on patient profile, AND a standalone "New Visit" page accessible from navigation
- Standalone "New Visit" page has inline patient search at top: type to find existing patient, or register a new patient inline (basic fields expand if no match)
- For existing patients, their visit history loads on the same page so the doctor can reference past visits
- A visit is ONE unit: clinical notes + medications + Rx notes, all together (no separate "prescription" entity)
- Single free-text field for clinical notes with placeholder template (Complaint: ..., Diagnosis: ..., etc.) instead of separate structured fields
- Collapsible sections: patient info collapses after selection, visit history is collapsible, prescription area gets the most screen space
- Goal: minimize clicks and scrolling for a non-tech-savvy user on an old Windows machine

### Prescription writing
- Add medications one at a time: autocomplete search field, select drug, fill dosage/frequency/duration, click "Add", medication appears in list below
- Autocomplete displays combined single-line format: "Panadol (Paracetamol 500mg Tablet)"
- Autocomplete matches on both brand name and salt/generic name
- Dosage, frequency, duration: use standard clinical software dropdown patterns (research needed for exact values)
- Single notes field for the entire prescription (not per-medication notes)
- Autocomplete must perform under 300ms on older hardware

### Drug database
- Pre-seed with 100-200 commonly prescribed medications in the Pakistani market (local brand names mapped to salt/generic names)
- Drug data structure: salt name, brand name, form (tablet/syrup/injection/etc.), strength (e.g., 500mg)
- Settings screen: simple form to add/edit custom medications with brand name, salt name, form dropdown, strength
- Searchable list of all custom meds with edit buttons; pre-seeded drugs are read-only
- Custom medications: can be disabled (hidden from autocomplete) or fully deleted
- Custom meds appear alongside pre-seeded drugs in autocomplete

### Editability
- Prescriptions/visits are fully editable (no immutability constraint for now, RX-05 deferred)
- Doctor can edit any part of a visit: clinical notes, medications, general Rx notes
- Doctor can delete an entire visit (and its medications)
- Doctor can delete individual medications from a visit

### Claude's Discretion
- Exact collapsible section implementation and transitions
- Dexie schema design for visits/encounters and drugs tables
- Drug autocomplete implementation (debouncing, indexing strategy)
- Standard clinical software dropdown values for dosage/frequency/duration (informed by research)
- Visit history display format on patient profile
- Empty state designs
- Loading states

</decisions>

<specifics>
## Specific Ideas

- Doctor is Furqan's father, not tech-savvy: UI must be extremely simple with large text and obvious actions
- "It should not be like the doctor has to first create a patient and go in the patient, then create a prescription. That's just too many steps."
- Patient info should collapse after selection to give prescription area maximum screen space
- Research standard clinical software patterns for dosage/frequency/duration dropdowns
- Research typical clinical workflow patterns for the visit page design

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SearchBar` component: compact variant already used in header, can inform drug search UI
- `usePatientSearch` hook: search pattern (Dexie queries) can be adapted for drug autocomplete
- `PatientInfoCard` component: patient display card, reusable in visit page collapsed section
- `PatientProfilePage`: has "Visit History" placeholder section ready to connect
- `AppLayout` with `Sidebar`: navigation structure for adding "New Visit" entry point
- `formatCNIC` utility: example of shared utility pattern

### Established Patterns
- Dexie.js with typed tables and indexed fields for fast lookups
- React functional components with hooks
- Tailwind CSS v4 for styling
- react-router-dom v7 with BrowserRouter
- Breadcrumbs for navigation context

### Integration Points
- `ClinicDatabase` class needs new tables: visits/encounters, drugs
- Patient profile page needs visit history populated and "New Visit" button
- Sidebar needs "New Visit" navigation item
- Settings page needs drug management section added
- Drug database needs seed data loaded on first run (similar to how default password is set up)

</code_context>

<deferred>
## Deferred Ideas

- Voice-to-text for clinical notes field (Web Speech API, feasible, low complexity): future enhancement
- Prescription immutability / audit trail (RX-05): deferred from this phase, can be added later when compliance is needed
- Patient complaint/feedback logging (from Phase 1 deferred): still deferred

</deferred>

---

*Phase: 02-clinical-workflow-encounters-prescriptions-drug-database*
*Context gathered: 2026-03-06*
