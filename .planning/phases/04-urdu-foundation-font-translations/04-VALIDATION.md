---
phase: 4
slug: urdu-foundation-font-translations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or vite.config.ts vitest section) |
| **Quick run command** | `npx vitest run src/constants/translations.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/constants/translations.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | URDU-01 | build | `npm run build && ls dist/assets/*.woff2` | N/A | pending |
| 04-01-02 | 01 | 1 | URDU-01 | css-check | `grep 'urdu-cell' src/index.css` | N/A | pending |
| 04-02-01 | 02 | 1 | URDU-03 | unit | `npx vitest run src/constants/translations.test.ts` | W0 | pending |
| 04-02-02 | 02 | 1 | URDU-03 | unit | `npx vitest run src/constants/translations.test.ts` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/constants/translations.test.ts` — tests for toUrdu() completeness, correctness, and fallback
- [ ] Vitest already configured in project (verify, install if missing)

*If vitest is already set up, Wave 0 only needs the test file stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nastaliq diacritics render without clipping in print | URDU-01 | Visual rendering requires browser print preview | Build app, navigate to a visit with prescriptions, open print preview (Ctrl+P), verify Urdu text diacritics are fully visible |
| Font available offline after first load | URDU-01 | Requires browser DevTools inspection | Open DevTools > Application > Cache Storage, verify woff2 in workbox cache; toggle offline mode, reload, verify font still renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
