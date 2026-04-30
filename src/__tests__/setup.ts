import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrollIntoView -- mock it globally
window.HTMLElement.prototype.scrollIntoView = function () {}

// Web Crypto polyfill for jsdom (Phase 22.1 / PBKDF2)
// jsdom does not always expose crypto.subtle; fall back to Node's webcrypto.
// Per pattern-mapper L2: vitest+jsdom historically misses crypto.subtle.
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  const { webcrypto } = await import('node:crypto')
  // @ts-expect-error -- assigning Node's webcrypto to globalThis.crypto for test env
  globalThis.crypto = webcrypto as unknown as Crypto
}
