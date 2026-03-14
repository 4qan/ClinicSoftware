# Security Model

ClinicSoftware is designed with a **zero-transmission architecture**. Patient data never leaves the user's device.

## Data Storage

- All patient records, prescriptions, and settings are stored in **IndexedDB** (browser-local storage).
- No cloud database, no server-side storage, no external API calls.
- Data persists across sessions but is scoped to the browser profile on that device.

## Authentication

- Local password protection using **PBKDF2** with SHA-256 and **100,000 iterations**.
- Passwords are never stored in plaintext. Only the derived hash and a cryptographically random salt are persisted.
- Recovery codes are hashed separately with their own salt.
- Authentication is entirely client-side; there is no server to authenticate against.

## Backup & Restore

- Database exports are JSON files saved to the user's local filesystem.
- No automatic cloud sync or remote backup.
- The user controls when and where backups are stored.

## What This Means

- **No network vectors**: There are no API endpoints, webhooks, or data pipelines to exploit.
- **No data in transit**: Patient data cannot be intercepted because it is never transmitted.
- **Device-scoped risk**: Security depends on physical access to the device and browser profile. Standard device security practices (screen lock, user accounts) apply.

## Reporting Issues

If you find a security concern, please open an issue on the [GitHub repository](https://github.com/4qan/ClinicSoftware/issues).
