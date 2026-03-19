import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase } from '@/db/index'
import { pouchDb, putSetting, getSetting } from '@/db/pouchdb'
import type { Patient } from '@/db/index'

function makePatient(overrides: Partial<Patient> = {}): Patient & { _id: string; type: 'patient' } {
  return {
    _id: 'patient:test-uuid-1',
    id: 'test-uuid-1',
    patientId: '2026-0001',
    firstName: 'Ahmed',
    lastName: 'Khan',
    firstNameLower: 'ahmed',
    lastNameLower: 'khan',
    age: 35,
    gender: 'male',
    contact: '03001234567',
    createdAt: '2026-03-05T10:00:00.000Z',
    updatedAt: '2026-03-05T10:00:00.000Z',
    type: 'patient',
    ...overrides,
  }
}

describe('PouchDB connectivity', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('can add and retrieve a patient document', async () => {
    const patient = makePatient()
    await pouchDb.put(patient)

    const retrieved = await pouchDb.get('patient:test-uuid-1') as any
    expect(retrieved.firstName).toBe('Ahmed')
    expect(retrieved.age).toBe(35)
  })

  it('can query by prefix using allDocs', async () => {
    await pouchDb.put(makePatient())
    const result = await pouchDb.allDocs({
      startkey: 'patient:',
      endkey: 'patient:\uffff',
      include_docs: true,
    })
    expect(result.rows).toHaveLength(1)
    expect((result.rows[0].doc as any).firstName).toBe('Ahmed')
  })

  it('settings roundtrip via putSetting/getSetting', async () => {
    await putSetting('testKey', 'testValue')
    const value = await getSetting('testKey')
    expect(value).toBe('testValue')
  })

  it('getSetting returns undefined for missing key', async () => {
    const value = await getSetting('nonexistent')
    expect(value).toBeUndefined()
  })
})
