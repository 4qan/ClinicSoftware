import { describe, it, expect, beforeEach } from 'vitest'
import { ClinicDatabase } from '@/db/index'
import type { Patient } from '@/db/index'

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
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
    ...overrides,
  }
}

describe('ClinicDatabase', () => {
  let db: ClinicDatabase

  beforeEach(async () => {
    db = new ClinicDatabase()
    await db.delete()
    db = new ClinicDatabase()
  })

  it('initializes without error', async () => {
    expect(db.isOpen()).toBe(false)
    await db.open()
    expect(db.isOpen()).toBe(true)
  })

  it('can add and retrieve a patient record', async () => {
    const patient = makePatient()
    await db.patients.add(patient)

    const retrieved = await db.patients.get('test-uuid-1')
    expect(retrieved).toEqual(patient)
  })

  it('indexes work: query by patientId', async () => {
    await db.patients.add(makePatient())
    const result = await db.patients.where('patientId').equals('2026-0001').first()
    expect(result?.firstName).toBe('Ahmed')
  })

  it('indexes work: query by firstNameLower', async () => {
    await db.patients.add(makePatient())
    const result = await db.patients.where('firstNameLower').equals('ahmed').first()
    expect(result?.patientId).toBe('2026-0001')
  })

  it('indexes work: query by contact', async () => {
    await db.patients.add(makePatient())
    const result = await db.patients.where('contact').equals('03001234567').first()
    expect(result?.lastName).toBe('Khan')
  })

  it('has patients, settings, and recentPatients tables', async () => {
    await db.open()
    const tableNames = db.tables.map((t) => t.name).sort()
    expect(tableNames).toEqual(['patients', 'recentPatients', 'settings'])
  })
})
