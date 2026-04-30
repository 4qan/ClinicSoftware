# Phase 22.1 Deferred Items

Out-of-scope issues discovered during execution; not introduced by 22.1 plans.

## Pre-existing TypeScript build errors (blocks `npm run build`)

Discovered during: Plan 04 (executor verified baseline `git stash && npm run build` reproduces both errors before any 22.1-04 changes).

1. **`src/__tests__/setup.ts:12` -- TS2578 unused `@ts-expect-error` directive.**
   - Root cause: a previously-broken type assertion is now valid in the current TS version, leaving the `@ts-expect-error` orphaned.
   - Fix: delete the directive line (one-line change).

2. **`src/utils/passwordHash.ts:37` -- TS2322 `Uint8Array<ArrayBufferLike>` not assignable to `BufferSource` (`SharedArrayBuffer` not assignable to `ArrayBuffer`).**
   - Root cause: TypeScript 5.6+ tightened `Uint8Array` typing. The PBKDF2 salt derivation passes a `Uint8Array` whose backing buffer type is now `ArrayBufferLike` (the union including `SharedArrayBuffer`).
   - Fix candidates: cast salt to `Uint8Array<ArrayBuffer>` at the call site, or copy into a fresh `ArrayBuffer`. Either is a one-line change in `hashPassword`.

Both are blockers for `npm run build` only; `npx tsc --noEmit` (no project refs) ignores them. All vitest tests pass (385/385). Recommend fixing both as a small `chore(types)` PR before Plan 07.
