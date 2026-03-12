# Phase 10: Print Infrastructure & Settings - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

User can select independent paper sizes for prescription and dispensary slips, and the browser print dialog uses the correct page dimensions. Layout scaling and preview are Phase 11.

</domain>

<decisions>
## Implementation Decisions

### Paper size options
- Four sizes: A6, A5, A4, Letter
- Order: smallest to largest (A6, A5, A4, Letter)
- Labels include dimensions: "A5 (148 x 210 mm)", "Letter (216 x 279 mm)", etc.
- Same options available for both prescription and dispensary slips (no restrictions)

### Settings UI presentation
- New "Print" pill tab added to Settings page (5th tab alongside Account, Medications, Clinic Info, Data)
- Two stacked cards: "Prescription Slip" card with paper size dropdown, then "Dispensary Slip" card with dropdown
- Auto-save on dropdown change (no Save button)
- Brief subtitle under tab heading: "Set paper sizes for each slip type. Changes apply to all future prints."

### Print button experience
- Size badge displayed near the Print button on PrintVisitPage: "Paper: A5 (148 x 210 mm)"
- Badge is informational only, not a control (no inline dropdown on print page)
- Paper size changes only from Settings > Print tab
- No paper mismatch warning (Chrome print dialog shows page size)
- Auto-print flow unchanged: still fires immediately, no pause for size confirmation

### Migration & defaults
- No upgrade notices or migration UX (app has no active users yet)
- Fallback at read time: missing key in IndexedDB = A5 (no DB seeding on first load)
- Only write to DB when user explicitly changes a paper size

### Claude's Discretion
- Dynamic @page CSS injection approach
- Conditional rendering implementation for slip isolation (PRENG-03)
- Proportional margin calculation formula
- Settings key naming convention in IndexedDB

</decisions>

<specifics>
## Specific Ideas

No specific references or "I want it like X" moments. Standard Settings UI patterns.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SettingsPage.tsx`: Pill-tab pattern with `SettingsCategory` type union and `TABS` array. New "Print" tab follows same pattern.
- `ClinicInfoSettings.tsx`: Reference for building a settings component that reads/writes to `db.settings` key-value store.
- `db/settings.ts`: `getClinicInfo()`/`saveClinicInfo()` pattern for settings persistence via `db.settings.put()`.

### Established Patterns
- Settings stored as key-value pairs in `db.settings` table (Dexie)
- Print CSS in `index.css` with `@media print` block, currently hardcoded `@page { size: A5 portrait; margin: 8mm; }`
- Both slips set `maxWidth: '148mm'` (A5 width) inline
- Slip visibility uses CSS class toggling (`print-hidden`, `hidden`) -- PRENG-03 requires switching to conditional rendering

### Integration Points
- `SettingsPage.tsx`: Add 'print' to `SettingsCategory` type and `TABS` array
- `index.css`: Replace hardcoded `@page` with dynamic injection at print time
- `PrintVisitPage.tsx`: Read paper size from DB, inject correct @page CSS, add size badge, switch from CSS hiding to conditional rendering
- `db/settings.ts`: Add `getPrintSettings()`/`savePrintSettings()` functions

</code_context>

<deferred>
## Deferred Ideas

- Custom paper dimensions input (width/height in mm) for non-standard paper -- PRSET-05, future requirement
- Continuous scaling formula needed if custom sizes are added (affects Phase 11 approach)

</deferred>

---

*Phase: 10-print-infrastructure-settings*
*Context gathered: 2026-03-11*
