# Phase 8: Backup Restore - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Build database restore functionality in the Settings Data tab. User can select a backup file, see when it was created, confirm, and restore the full database. This phase does NOT include auto-snapshots (Phase 9) or any scheduled/automatic backup logic.

**Requirements:** BKUP-02 (restore from file), BKUP-04 (validate + confirm before overwrite)

**BKUP-05 (auto-safety-backup) deliberately dropped:** The export button is right above the restore section. If the doctor wants to save current data before restoring, they export manually. An automatic silent download would confuse a non-tech-savvy user.

</domain>

<decisions>
## Implementation Decisions

### Restore UI placement
- Restore section lives below the export section in the existing "Backup & Restore" card in DataSettings
- Same card, not a separate card
- "Restore from Backup" sub-heading with brief description
- "Select Backup File" button triggers native file picker

### Confirmation flow
- After file selection, inline confirmation box appears below the button (no modal)
- Shows backup date only (no record counts, no version info, no schema details)
- Warning text: "This will replace all your current data."
- Cancel and Restore buttons; Restore button styled red/destructive
- No extra friction (no "type RESTORE" to confirm). Red button + warning is enough for a single-user clinic.

### Validation & error messaging
- Invalid file (wrong format, not a backup): inline red error text + error toast. Message: "This file is not a valid backup. Please select a ClinicSoftware backup file."
- Newer schema version: block restore entirely. Message: "This backup is from a newer version. Please update the app first."
- Restore failure mid-operation: error toast with "Restore failed. Your previous data is unchanged. Please try again." (Dexie transaction guarantees all-or-nothing)

### Post-restore behavior
- Success toast: "Data restored from [date] backup"
- Page reload after short delay to ensure all components pick up new data
- Smart re-login: compare hashed password before and after restore. If different, force logout. If same, stay logged in. Single string comparison, no complexity.

### Export filename change (applies to existing export too)
- Include datetime in filename, not just date: `ClinicSoftware-backup-YYYY-MM-DD-HH-MM.json`
- Ensures multiple exports on the same day are distinguishable

### Claude's Discretion
- Exact inline confirmation box styling and animation
- File validation implementation details (what fields to check, parsing approach)
- Dexie transaction strategy for all-or-nothing restore
- Reload delay timing
- How to handle older schema backups (migration approach)

</decisions>

<specifics>
## Specific Ideas

- Doctor is non-tech-savvy on older Windows hardware. No technical jargon in any messaging.
- Metadata preview deliberately minimal: just the backup date. Record counts, schema version, app version are irrelevant to the doctor.
- No auto-safety-backup. Export button is right there if they want to save current data first. Fewer surprises = better UX.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataSettings.tsx`: Existing component with export button, progress bar, last backup display. Restore UI adds below export.
- `backup.ts`: exportDatabase(), downloadBackup(), BackupFile, BackupMetadata types. restoreDatabase() will be added here.
- `ToastProvider` + `useToast()`: App-wide toast system for success/error/info messages.
- `db/index.ts`: Dexie v4 with 6 tables, `db.verno` for schema version comparison.

### Established Patterns
- Settings tab extension: `SettingsCategory` union + `TABS` array + conditional render per tab
- Key-value settings storage in `db.settings` table (used for lastBackupDate, auth hash)
- Toast pattern: `showToast('success' | 'error' | 'info', message)`

### Integration Points
- `DataSettings.tsx`: Add restore section below export, add file input, confirmation state, restore handler
- `backup.ts`: Add restoreDatabase() function, add file validation logic
- `downloadBackup()`: Update filename format to include time (YYYY-MM-DD-HH-MM)

</code_context>

<deferred>
## Deferred Ideas

- BKUP-05 (auto-safety-backup before restore): Deliberately dropped for this phase. Doctor can manually export if needed. Could revisit if data loss incidents occur.

</deferred>

---

*Phase: 08-backup-restore*
*Context gathered: 2026-03-11*
