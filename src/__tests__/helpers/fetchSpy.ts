/**
 * Solo-mode fetch spy helper (Phase 22.1 / D-17).
 * Solo tests MUST assert that NO outbound CouchDB requests are made across
 * login, session restore, password change, and the full clinical workflow.
 *
 * Usage:
 *   beforeEach(() => { installFetchSpy() })
 *   afterEach(() => { restoreFetch() })
 *   it('does not call CouchDB', () => { ...; assertZeroCouchFetch() })
 */
import { vi, expect } from 'vitest'

let originalFetch: typeof globalThis.fetch | undefined
let spy: ReturnType<typeof vi.fn> | null = null

/**
 * Heuristics for identifying a CouchDB-bound request URL.
 * Per Phase 22 / Phase 20 patterns: CouchDB lives at `${LAN_IP}:5984` and the
 * Phase 21 auth surfaces hit `/_session` and `/_users/...` endpoints.
 */
const COUCH_URL_PATTERNS = [
  ':5984',
  '/_session',
  '/_users',
  'http://192.168.',
  'http://10.',
  'https://192.168.',
  'https://10.',
]

function isCouchUrl(url: unknown): boolean {
  const s = String(url ?? '')
  return COUCH_URL_PATTERNS.some((p) => s.includes(p))
}

export function installFetchSpy(): ReturnType<typeof vi.fn> {
  if (spy) return spy
  originalFetch = globalThis.fetch
  spy = vi.fn(() =>
    Promise.reject(new Error('fetch should not be called in solo mode (Phase 22.1 D-17)')),
  )
  globalThis.fetch = spy as unknown as typeof globalThis.fetch
  return spy
}

export function restoreFetch(): void {
  if (originalFetch !== undefined) {
    globalThis.fetch = originalFetch
    originalFetch = undefined
  }
  spy = null
}

export function getFetchCalls(): unknown[][] {
  return spy ? (spy.mock.calls as unknown[][]) : []
}

export function assertZeroCouchFetch(): void {
  const calls = getFetchCalls()
  const offending = calls.filter(([url]) => isCouchUrl(url))
  // If any CouchDB-bound call sneaks through, surface the URLs in the failure message.
  expect(
    offending,
    `Expected zero CouchDB-bound fetch calls, but found ${offending.length}: ${JSON.stringify(
      offending.map(([u]) => String(u)),
    )}`,
  ).toEqual([])
}
