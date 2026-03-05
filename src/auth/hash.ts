const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 32

// Use globalThis.crypto to work in both browser and Node.js environments
function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto
  }
  throw new Error('Web Crypto API not available')
}

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH)
  getCrypto().getRandomValues(salt)
  return salt
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function saltToBase64(salt: Uint8Array): string {
  return btoa(String.fromCharCode(...salt))
}

export function base64ToSalt(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function hashPassword(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const crypto = getCrypto()
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  return bufferToHex(derivedBits)
}

export async function verifyPassword(
  password: string,
  salt: Uint8Array,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashPassword(password, salt)
  return hash === expectedHash
}

export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const crypto = getCrypto()
  const values = new Uint8Array(8)
  crypto.getRandomValues(values)
  return Array.from(values)
    .map((v) => chars[v % chars.length])
    .join('')
}
