# Phase 14: Print Flow - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

The doctor can trigger printing and return to work using only the keyboard after completing a prescription. Covers: Tab path from last prescription field to print, Enter to fire print dialog, and focus restore after the dialog closes.

</domain>

<decisions>
## Implementation Decisions

### Tab path to Print button
- On NewVisitPage: medication list remove buttons get `tabIndex={-1}` (mouse-only). Tab goes from last prescription field (RxNotes or MedicationEntry) directly to Save & Print
- On PrintVisitPage: Prescription/Dispensary toggle tabs get `tabIndex={-1}` (mouse-only). Tab lands on Print button immediately
- PrintVisitPage breadcrumbs: `tabIndex={-1}` (consistent with Phase 12 decision for all nav chrome)
- Print button gets `autoFocus` so it's focused on page load (covers manual navigation to PrintVisitPage without ?auto param)

### Auto-print on Save & Print
- Save & Print on NewVisitPage navigates with `?auto=prescription` to auto-open the browser print dialog
- Only prescription auto-prints. Dispensary requires manual action (switch tab, click/Enter print)
- The browser print dialog opens automatically (200ms delay, already implemented). Doctor confirms with Enter or cancels with Escape in the browser dialog. Print is NOT sent without confirmation.

### Focus restore after print dialog
- After the `afterprint` event fires, focus returns to the Print button
- Same behavior regardless of whether doctor printed (Enter) or cancelled (Escape) in the browser dialog
- Same behavior for auto-print (Save & Print flow) and manual print
- No auto-navigation after printing. Doctor stays on PrintVisitPage with Print button focused

### Claude's Discretion
- Implementation of focus restore (ref on Print button + focus() in afterprint handler vs other approach)
- Whether autoFocus and afterprint focus restore need coordination to avoid conflicts

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PrintVisitPage.tsx`: Already has `afterprint` event listener (line 114-117), `handleAfterPrint` callback, and auto-print via `?auto` query param (line 87-107)
- `NewVisitPage.tsx`: Save & Print button already first in action bar (line 405-413), navigates to `/visit/${id}/print` (line 201)
- Global focus-visible CSS already applied (Phase 12)

### Established Patterns
- `tabIndex={-1}` for removing elements from tab flow (Phase 12: sidebar, header, breadcrumbs, toast close buttons)
- `autoFocus` used on LoginPage password field
- `afterprint` event already wired up, resets `printMode` state

### Integration Points
- `NewVisitPage.tsx` line 201: Change navigate path to include `?auto=prescription`
- `PrintVisitPage.tsx` line 109-112: Add focus restore in `handleAfterPrint`
- `PrintVisitPage.tsx` line 204: Add ref + autoFocus to Print button
- `PrintVisitPage.tsx` lines 173-195: Add `tabIndex={-1}` to toggle buttons
- `MedicationList.tsx`: Add `tabIndex={-1}` to remove buttons

</code_context>

<specifics>
## Specific Ideas

- The goal is zero extra keystrokes on the happy path: doctor finishes prescription, Tabs to Save & Print, presses Enter, print dialog opens, confirms with Enter. Done.
- Doctor is non-tech-savvy on older Windows hardware. The browser print dialog is the only interruption, and it's unavoidable.

</specifics>

<deferred>
## Deferred Ideas

None. Discussion stayed within phase scope.

</deferred>

---

*Phase: 14-print-flow*
*Context gathered: 2026-03-15*
