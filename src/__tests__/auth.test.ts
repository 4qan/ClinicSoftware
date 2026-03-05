import { describe, it, expect } from 'vitest'
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateRecoveryCode,
} from '@/auth/hash'

describe('password hashing', () => {
  it('produces consistent results with the same salt', async () => {
    const salt = generateSalt()
    const hash1 = await hashPassword('testpassword', salt)
    const hash2 = await hashPassword('testpassword', salt)
    expect(hash1).toBe(hash2)
  })

  it('different passwords produce different hashes', async () => {
    const salt = generateSalt()
    const hash1 = await hashPassword('password1', salt)
    const hash2 = await hashPassword('password2', salt)
    expect(hash1).not.toBe(hash2)
  })

  it('different salts produce different hashes', async () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    const hash1 = await hashPassword('samepassword', salt1)
    const hash2 = await hashPassword('samepassword', salt2)
    expect(hash1).not.toBe(hash2)
  })

  it('hash is a hex string of expected length', async () => {
    const salt = generateSalt()
    const hash = await hashPassword('test', salt)
    expect(hash).toMatch(/^[0-9a-f]+$/)
    // SHA-256 produces 256 bits = 64 hex chars
    expect(hash).toHaveLength(64)
  })
})

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const salt = generateSalt()
    const hash = await hashPassword('clinic123', salt)
    const result = await verifyPassword('clinic123', salt, hash)
    expect(result).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const salt = generateSalt()
    const hash = await hashPassword('clinic123', salt)
    const result = await verifyPassword('wrongpassword', salt, hash)
    expect(result).toBe(false)
  })
})

describe('generateRecoveryCode', () => {
  it('is 8 characters long', () => {
    const code = generateRecoveryCode()
    expect(code).toHaveLength(8)
  })

  it('is alphanumeric', () => {
    const code = generateRecoveryCode()
    expect(code).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('generates different codes each time', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateRecoveryCode()))
    // With 8 chars from 55-char alphabet, collisions are extremely unlikely
    expect(codes.size).toBeGreaterThan(5)
  })
})

describe('generateSalt', () => {
  it('returns a Uint8Array of 32 bytes', () => {
    const salt = generateSalt()
    expect(salt).toBeInstanceOf(Uint8Array)
    expect(salt.length).toBe(32)
  })
})
