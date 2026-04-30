import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, PBKDF2_ITERATIONS } from '@/utils/passwordHash'

describe('passwordHash -- hashPassword', () => {
  it('returns an envelope with username, base64 salt, base64 hash, iterations', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    expect(env.username).toBe('doctor')
    expect(typeof env.salt).toBe('string')
    expect(env.salt.length).toBeGreaterThan(0)
    expect(typeof env.hash).toBe('string')
    expect(env.hash.length).toBeGreaterThan(0)
    expect(env.iterations).toBe(PBKDF2_ITERATIONS)
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100_000)
  })

  it('produces a different salt and hash on each call (random salt)', async () => {
    const a = await hashPassword('doctor123', 'doctor')
    const b = await hashPassword('doctor123', 'doctor')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })

  it('uses a 16-byte salt (decoded from base64)', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    const saltBytes = atob(env.salt)
    expect(saltBytes.length).toBe(16)
  })

  it('preserves username verbatim', async () => {
    const env = await hashPassword('xyz', 'someone')
    expect(env.username).toBe('someone')
  })
})

describe('passwordHash -- verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    await expect(verifyPassword('doctor123', env)).resolves.toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    await expect(verifyPassword('wrong', env)).resolves.toBe(false)
  })

  it('returns false for an empty password', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    await expect(verifyPassword('', env)).resolves.toBe(false)
  })

  it('uses envelope.iterations (not a constant) for verification', async () => {
    // Build an envelope with a non-default iteration count by hashing then mutating
    // is unsafe (hash will not match). Instead: hash with default, then verify works.
    // Then prove that verifying with a tampered iterations field FAILS, confirming
    // verify reads from the envelope.
    const env = await hashPassword('doctor123', 'doctor')
    const tampered = { ...env, iterations: env.iterations + 1 }
    await expect(verifyPassword('doctor123', tampered)).resolves.toBe(false)
  })
})
