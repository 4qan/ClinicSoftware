import { describe, it, expect, beforeEach } from 'vitest'
import { withTimestamps, createPatient, updatePatient } from '@/db/timestamps'
import { db, resetDatabase } from '@/db/index'

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function makePatientData() {
  return {
    id: 'test-uuid-1',
    patientId: '2026-0001',
    firstName: 'Ahmed',
    lastName: 'Khan',
    firstNameLower: 'ahmed',
    lastNameLower: 'khan',
    age: 35,
    gender: 'male' as const,
    contact: '03001234567',
  }
}

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

describe('createPatient', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('stores a patient with both timestamps set', async () => {
    const data = makePatientData()
    await createPatient(data)

    const { db: currentDb } = await import('@/db/index')
    const stored = await currentDb.patients.get('test-uuid-1')
    expect(stored).toBeDefined()
    expect(stored!.createdAt).toMatch(ISO_REGEX)
    expect(stored!.updatedAt).toMatch(ISO_REGEX)
    expect(stored!.firstName).toBe('Ahmed')
  })
})

describe('updatePatient', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('updates a patient and changes only updatedAt', async () => {
    const data = makePatientData()
    await createPatient(data)

    const { db: currentDb } = await import('@/db/index')
    const beforeUpdate = await currentDb.patients.get('test-uuid-1')
    const originalCreatedAt = beforeUpdate!.createdAt

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 10))

    await updatePatient('test-uuid-1', { age: 36 })

    const afterUpdate = await currentDb.patients.get('test-uuid-1')
    expect(afterUpdate!.age).toBe(36)
    expect(afterUpdate!.createdAt).toBe(originalCreatedAt)
    expect(afterUpdate!.updatedAt).not.toBe(originalCreatedAt)
    expect(afterUpdate!.updatedAt).toMatch(ISO_REGEX)
  })
})
