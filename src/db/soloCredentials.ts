/**
 * Solo-mode credentials envelope (PBKDF2 hash + salt + iterations).
 * Stored in localStorage as JSON under the 'soloCredentials' key.
 * Per D-05: SHA-256, 100k iterations (floor), 16-byte random salt.
 */

const SOLO_CREDENTIALS_KEY = 'soloCredentials'

export interface SoloCredentialEnvelope {
  username: string
  salt: string // base64
  hash: string // base64
  iterations: number
}

/**
 * Returns the stored credential envelope, or null if absent or malformed.
 * Defensive against corrupted JSON (T-22.1-03 mitigation): a parse failure
 * yields null so the login flow degrades to "no credentials on file" rather
 * than throwing.
 */
export function getSoloCredentials(): SoloCredentialEnvelope | null {
  const raw = localStorage.getItem(SOLO_CREDENTIALS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SoloCredentialEnvelope
  } catch {
    return null
  }
}

export function setSoloCredentials(env: SoloCredentialEnvelope): void {
  localStorage.setItem(SOLO_CREDENTIALS_KEY, JSON.stringify(env))
}

export function clearSoloCredentials(): void {
  localStorage.removeItem(SOLO_CREDENTIALS_KEY)
}
