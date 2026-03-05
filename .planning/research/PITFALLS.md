# Pitfalls: Offline-First Clinic Prescription Software

Domain-specific risks for a PWA-based, offline-first prescription and patient management system targeting a single-doctor clinic with unreliable internet.

---

## 1. Data Loss from IndexedDB Eviction

**The risk:** Browsers can silently evict IndexedDB data. iOS Safari clears storage after ~7 days of inactivity. Even on desktop, if storage isn't marked as "persistent," the browser can purge it under disk pressure. For a clinic with patient records, this is catastrophic.

**Warning signs:**
- No call to `navigator.storage.persist()` at startup
- No storage quota monitoring
- Doctor reports "patients disappeared" after a period of not using the app

**Prevention:**
- Request persistent storage on first launch (`navigator.storage.persist()`)
- Monitor quota usage and warn at 80% capacity
- Implement periodic export/backup to a downloadable file as a safety net (even before cloud sync works)
- On app startup, verify IndexedDB integrity (record count sanity check)

**Phase:** Must be addressed in Phase 1 (core offline architecture). Non-negotiable.

---

## 2. Service Worker Update Traps the Doctor on a Stale Version

**The risk:** Service workers cache the app shell aggressively. If the update flow is wrong, the doctor can be stuck on a broken or outdated version indefinitely, with no way to know or fix it (non-tech-savvy user). Conversely, an aggressive auto-update could reload the page mid-prescription.

**Warning signs:**
- No "new version available" UI
- Using `skipWaiting()` without user consent (causes mid-session reloads)
- Doctor complains about a bug you already fixed weeks ago

**Prevention:**
- Show a simple, persistent banner: "Update available. Tap to refresh." Never force-reload.
- Cache the app shell with a versioned cache name; on install, pre-cache new assets; on activate, delete old caches
- Test the full update cycle (old SW -> new SW activation) as part of QA, not just fresh installs
- Include a visible version number in the settings screen so support can verify what's running

**Phase:** Phase 1 (PWA setup). Revisit in every release.

---

## 3. Sync Conflicts Silently Overwrite Patient Data

**The risk:** With offline-first + cloud sync, the same patient record could be edited on two sessions (e.g., doctor uses phone and desktop). A naive "last-write-wins" strategy silently discards one set of changes. For medical records, lost data is a compliance and safety issue.

**Warning signs:**
- Sync logic uses timestamp comparison with no conflict detection
- No sync log or audit trail
- No UI for "these records were updated on another device"

**Prevention:**
- For this single-doctor system, adopt a "last-write-wins with full history" approach: every change creates an immutable version, so nothing is ever truly lost
- Store a `syncVersion` counter on each record. On sync, if server version > local version AND local has unsaved changes, flag the conflict
- For prescriptions specifically, never overwrite: append-only. A prescription once written is immutable; corrections create a new record linked to the original
- Keep a local sync log the doctor never sees but support can inspect

**Phase:** Phase 2 (cloud sync). Design the data model for this in Phase 1.

---

## 4. Unreliable Online/Offline Detection

**The risk:** `navigator.onLine` only tells you if a network interface exists, not if there's actual internet connectivity. In a clinic with flaky WiFi, the app may think it's online, attempt a sync, fail silently, and leave the doctor thinking data was backed up when it wasn't.

**Warning signs:**
- Using only `navigator.onLine` for connectivity checks
- No visual indicator of sync status
- Sync failures are swallowed in catch blocks

**Prevention:**
- Ping a lightweight health endpoint to confirm actual connectivity before syncing
- Show a persistent, color-coded sync status indicator (green: synced, yellow: pending, red: offline/failed)
- Queue all writes locally first. Sync is always a background process that retries with exponential backoff
- Show "Last synced: [timestamp]" in the UI so the doctor has confidence

**Phase:** Phase 2 (cloud sync). The status indicator UI should be stubbed in Phase 1.

---

## 5. Medication Autocomplete That Slows Down the Doctor

**The risk:** The core value proposition is "prescription in under 2 minutes." A drug database with hundreds of entries, searched naively in IndexedDB, can introduce lag on older hardware. Or worse: the autocomplete UX requires too many taps/clicks, defeating the purpose.

**Warning signs:**
- Autocomplete triggers on every keystroke with no debounce
- Full table scan on each query instead of indexed search
- Doctor abandons autocomplete and types manually (defeating audit trail)
- Results list requires scrolling through 50+ items

**Prevention:**
- Index the drug database on both salt name and brand name in IndexedDB
- Debounce input (200-300ms) and limit results to 5-7 items
- Support "fuzzy-ish" matching: start-of-word matching, not just prefix (e.g., "amox" matches "Amoxicillin" and "Co-Amoxiclav")
- Allow keyboard-only navigation (arrow keys + enter) since the doctor is on a desktop
- Pre-load the drug database into memory on app start if it's small enough (< 2000 entries)

**Phase:** Phase 1 (prescription workflow). Performance-test on target hardware early.

---

## 6. Print Layout Breaks Across Browsers and Printers

**The risk:** CSS `@media print` behaves differently across Chrome and Edge. Small-format prescription slips (not A4) are especially fragile: margins get added by the browser, headers/footers appear, content overflows, or the dispenser slip prints on two pages instead of one.

**Warning signs:**
- Print styles only tested in Chrome's print preview
- Using percentage-based widths that collapse on narrow paper
- No explicit `@page` size declaration
- Doctor has to manually adjust print settings every time

**Prevention:**
- Use `@page { size: [exact dimensions]; margin: 0; }` with the actual paper size
- Set explicit widths in mm/cm, never percentages
- Add a print instruction overlay on first use: "Set margins to None, uncheck Headers/Footers"
- Test on the actual printer + paper the doctor uses, not just screen preview
- Consider generating a PDF blob for printing (more control than `window.print()`)
- Keep prescription content minimal: if it doesn't fit on one slip, the layout is wrong

**Phase:** Phase 1 (prescription printing). Requires testing on real hardware. Cannot be validated in development alone.

---

## 7. Patient ID Collisions in Offline-First Systems

**The risk:** The 2026-XXXX auto-incrementing ID scheme can collide if IDs are generated locally. Two offline sessions (or a re-install after data loss) could generate the same ID for different patients.

**Warning signs:**
- ID generated by `MAX(id) + 1` from local IndexedDB
- No mechanism to detect duplicates on sync
- ID counter resets if IndexedDB is cleared

**Prevention:**
- Use a compound key: local sequence number + device identifier (or a UUID as the internal primary key, with 2026-XXXX as a display ID assigned on first sync)
- Alternatively, pre-allocate ID ranges from the server when online (e.g., "this device gets 2026-0100 through 2026-0199")
- Store the last-used sequence number redundantly (IndexedDB + localStorage) as a fallback against partial data loss
- On sync, server validates uniqueness and rejects conflicts with a clear error

**Phase:** Phase 1 (data model design). This is an architectural decision that's expensive to change later.

---

## 8. Inadequate Audit Trail for Compliance

**The risk:** The compliance team requires full patient records with unique IDs. If the system only stores current state (not history), there's no way to prove what was prescribed, when, or that records haven't been altered. This is a regulatory risk.

**Warning signs:**
- Database schema uses UPDATE on patient/prescription records
- No created_at/updated_at timestamps
- No way to view historical versions of a record
- Deleted records are hard-deleted

**Prevention:**
- Append-only for prescriptions: once saved, a prescription is immutable
- For patient records and encounters, store every version with a timestamp and change reason
- Never hard-delete anything. Use soft-delete with a `deleted_at` field
- Every record gets `created_at`, `created_by`, `updated_at` automatically
- Build a simple "history" view per patient that shows the full timeline

**Phase:** Phase 1 (data model). Retrofitting an audit trail is painful; design it in from day one.

---

## 9. App Shell Caching Failure Leaves a Blank Screen Offline

**The risk:** If the service worker's install event fails to cache even one critical asset (JS bundle, CSS, index.html), the entire app shows a blank white screen when offline. The doctor has no recourse except waiting for internet.

**Warning signs:**
- Service worker install handler doesn't use `waitUntil()` with the cache promise
- No fallback offline page
- Large assets (images, fonts) included in the critical cache list, causing cache failures on slow connections
- Cache list is manually maintained and drifts from the actual build output

**Prevention:**
- Use a build tool (e.g., Workbox) to auto-generate the precache manifest from build output
- Keep the app shell minimal: one HTML file, one CSS bundle, one JS bundle
- Fail the install event if any critical asset fails to cache (so the old SW stays active)
- Include a lightweight offline fallback page as a last resort
- Test by disabling network in DevTools after first load

**Phase:** Phase 1 (PWA setup). Test this before anything else.

---

## 10. Building for Scale the Clinic Doesn't Need

**The risk:** Over-engineering with complex sync protocols (CRDTs), multi-tenant architecture, or microservices for a single-doctor, single-device clinic. This adds development time, debugging complexity, and failure modes, all for problems that don't exist.

**Warning signs:**
- Architecture discussions reference "eventual consistency" and "distributed systems"
- Cloud sync involves more than a simple REST API with retry logic
- More time spent on infrastructure than on the prescription workflow
- Technology choices driven by resume-building rather than the doctor's needs

**Prevention:**
- The user is one doctor on one (maybe two) devices. Design for that.
- Cloud sync can be a simple "push local changes, pull latest" REST API. No real-time sync needed.
- Use a single database table per entity (patients, encounters, prescriptions, medications)
- Defer multi-device conflict resolution until the doctor actually uses multiple devices
- Measure success by "time to complete a prescription," not architectural elegance

**Phase:** All phases. Revisit scope at the start of each phase.

---

## Summary: Phase Mapping

| Pitfall | Phase 1 | Phase 2 | Ongoing |
|---------|---------|---------|---------|
| IndexedDB eviction | Design + implement | | Monitor |
| Service worker updates | Implement | | Every release |
| Sync conflicts | Data model design | Implement | |
| Online/offline detection | Stub UI | Implement | |
| Medication autocomplete perf | Implement + test on real HW | | |
| Print layout | Implement + test on real HW | | |
| Patient ID collisions | Architectural decision | Validate on sync | |
| Audit trail | Data model | | |
| App shell caching | Implement + test | | Every release |
| Over-engineering | Scope check | Scope check | Scope check |

---

*Sources consulted:*
- [Offline-first frontend apps 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Offline sync and conflict resolution patterns (Feb 2026)](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/)
- [Service Worker Bugs: Making Offline Mode Work](https://blog.pixelfreestudio.com/service-worker-bugs-making-offline-mode-work/)
- [Navigating Safari/iOS PWA Limitations](https://vinova.sg/navigating-safari-ios-pwa-limitations/)
- [Data Synchronization in PWAs: Offline-First Strategies](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)
- [Offline data (web.dev)](https://web.dev/learn/pwa/offline-data)
- [EMR: The Good, the Bad and the Ugly (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7043175/)
