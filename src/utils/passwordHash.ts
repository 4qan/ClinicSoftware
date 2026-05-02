/**
 * PBKDF2 password hashing via Web Crypto API.
 * Per Phase 22.1 D-05: SHA-256, 100k iterations (floor), 16-byte random salt.
 */
import type { SoloCredentialEnvelope } from '@/db/soloCredentials'

export const PBKDF2_ITERATIONS = 100_000 // floor per D-05
const KEY_LENGTH_BITS = 256
const SALT_BYTES = 16

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function deriveBitsBase64(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_LENGTH_BITS,
  )
  return bytesToBase64(new Uint8Array(bits))
}

export async function hashPassword(
  password: string,
  username: string,
): Promise<SoloCredentialEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveBitsBase64(password, salt, PBKDF2_ITERATIONS)
  return {
    username,
    salt: bytesToBase64(salt),
    hash,
    iterations: PBKDF2_ITERATIONS,
  }
}

export async function verifyPassword(
  password: string,
  envelope: SoloCredentialEnvelope,
): Promise<boolean> {
  const salt = base64ToBytes(envelope.salt)
  // Use the envelope's stored iterations so old hashes keep verifying after a future iteration bump.
  const candidate = await deriveBitsBase64(password, salt, envelope.iterations)
  // Constant-time string compare (cheap, no real risk on single-machine PWA but trivially safe):
  if (candidate.length !== envelope.hash.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ envelope.hash.charCodeAt(i)
  }
  return diff === 0
}
