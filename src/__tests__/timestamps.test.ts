import { describe, it, expect } from 'vitest'
import { withTimestamps } from '@/db/timestamps'

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('withTimestamps', () => {
  it('sets both createdAt and updatedAt on new records', () => {
    const result = withTimestamps({ name: 'test' }, true)
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
    expect(result.createdAt).toBe(result.updatedAt)
  })

  it('sets only updatedAt on existing records, preserving createdAt', () => {
    const original = { name: 'test', createdAt: '2026-01-01T00:00:00.000Z' }
    const result = withTimestamps(original, false)
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(result.updatedAt).toBeDefined()
    expect(result.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
  })

  it('produces valid ISO 8601 timestamps', () => {
    const result = withTimestamps({}, true)
    expect(result.createdAt).toMatch(ISO_REGEX)
    expect(result.updatedAt).toMatch(ISO_REGEX)
  })
})
