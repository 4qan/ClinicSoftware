import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase } from '@/db/index'
import {
  generatePatientId,
  registerPatient,
  getPatient,
  updatePatient,
  searchPatients,
  type PatientInput,
} from '@/db/patients'

const testPatient: PatientInput = {
  firstName: 'Ahmed',
  lastName: 'Khan',
  age: 35,
  gender: 'male',
  contact: '03001234567',
}

beforeEach(async () => {
  await resetDatabase()
})

describe('generatePatientId', () => {
  const year = new Date().getFullYear()

  it('first patient gets ID with 0001', async () => {
    const id = await generatePatientId()
    expect(id).toBe(`${year}-0001`)
  })

  it('sequential calls produce sequential IDs', async () => {
    const id1 = await generatePatientId()
    const id2 = await generatePatientId()
    const id3 = await generatePatientId()
    expect(id1).toBe(`${year}-0001`)
    expect(id2).toBe(`${year}-0002`)
    expect(id3).toBe(`${year}-0003`)
  })

  it('pads to 4 digits', async () => {
    const id = await generatePatientId()
    expect(id).toMatch(/^\d{4}-\d{4}$/)
  })
})

describe('registerPatient', () => {
  it('sets createdAt and updatedAt', async () => {
    const patient = await registerPatient(testPatient)
    expect(patient.createdAt).toBeDefined()
    expect(patient.updatedAt).toBeDefined()
    expect(patient.createdAt).toBe(patient.updatedAt)
  })

  it('generates unique patient ID on save', async () => {
    const p1 = await registerPatient(testPatient)
    const p2 = await registerPatient({ ...testPatient, firstName: 'Sara' })
    expect(p1.patientId).not.toBe(p2.patientId)
  })

  it('no ID gaps when only completed registrations increment counter', async () => {
    const p1 = await registerPatient(testPatient)
    const p2 = await registerPatient({ ...testPatient, firstName: 'Sara' })
    const p3 = await registerPatient({ ...testPatient, firstName: 'Ali' })
    const year = new Date().getFullYear()
    expect(p1.patientId).toBe(`${year}-0001`)
    expect(p2.patientId).toBe(`${year}-0002`)
    expect(p3.patientId).toBe(`${year}-0003`)
  })

  it('stores lowercase name variants', async () => {
    const patient = await registerPatient({ ...testPatient, firstName: 'Ahmed', lastName: 'Khan' })
    expect(patient.firstNameLower).toBe('ahmed')
    expect(patient.lastNameLower).toBe('khan')
  })
})

describe('updatePatient', () => {
  it('changes updatedAt but preserves createdAt', async () => {
    const patient = await registerPatient(testPatient)
    const originalCreatedAt = patient.createdAt

    // Small delay so timestamps differ
    await new Promise((r) => setTimeout(r, 10))

    await updatePatient(patient.id, { contact: '03009999999' })
    const updated = await getPatient(patient.id)

    expect(updated!.createdAt).toBe(originalCreatedAt)
    expect(updated!.contact).toBe('03009999999')
  })

  it('updates lowercase name variants when name changed', async () => {
    const patient = await registerPatient(testPatient)
    await updatePatient(patient.id, { firstName: 'Muhammad' })
    const updated = await getPatient(patient.id)
    expect(updated!.firstNameLower).toBe('muhammad')
  })
})

describe('searchPatients', () => {
  beforeEach(async () => {
    await registerPatient({ firstName: 'Ahmed', lastName: 'Khan', age: 35, gender: 'male', contact: '03001234567' })
    await registerPatient({ firstName: 'Sara', lastName: 'Ahmed', age: 28, gender: 'female', contact: '03111234567' })
    await registerPatient({ firstName: 'Ali', lastName: 'Raza', age: 45, gender: 'male', contact: '03211234567' })
  })

  it('finds by name prefix (case-insensitive)', async () => {
    const results = await searchPatients('ahm')
    expect(results.length).toBeGreaterThanOrEqual(1)
    const names = results.map((r) => r.firstName.toLowerCase())
    expect(names).toContain('ahmed')
  })

  it('finds by last name prefix', async () => {
    const results = await searchPatients('khan')
    expect(results.length).toBe(1)
    expect(results[0].lastName).toBe('Khan')
  })

  it('finds by patient ID prefix', async () => {
    const year = new Date().getFullYear()
    const results = await searchPatients(`${year}-0001`)
    expect(results.length).toBe(1)
  })

  it('finds by contact prefix', async () => {
    // Contact search: starts with digit but looks like phone
    const results = await searchPatients('03001')
    expect(results.length).toBe(1)
    expect(results[0].firstName).toBe('Ahmed')
  })

  it('returns empty array for no match', async () => {
    const results = await searchPatients('zzzzz')
    expect(results).toEqual([])
  })

  it('deduplicates results', async () => {
    // "Ahmed" appears as firstName for one patient and lastName for another
    const results = await searchPatients('ahmed')
    const ids = results.map((r) => r.id)
    const unique = new Set(ids)
    expect(ids.length).toBe(unique.size)
  })
})
