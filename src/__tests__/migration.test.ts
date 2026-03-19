import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LegacyClinicDatabase } from '@/db/legacy'
import { pouchDb, resetPouchDb } from '@/db/pouchdb'
import { runMigrationIfNeeded, MIGRATION_FLAG } from '@/db/migration'
import { buildSeedId } from '@/db/seedDrugs'
import type { Patient, Visit, VisitMedication, Drug, AppSettings, RecentPatient } from '@/db/index'

// Seed data helpers
function makePatient(n: number): Patient {
  return {
    id: `patient-${n}`,
    patientId: `2026-000${n}`,
    firstName: `First${n}`,
    lastName: `Last${n}`,
    firstNameLower: `first${n}`,
    lastNameLower: `last${n}`,
    age: 30 + n,
    gender: 'male',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeVisit(n: number, patientId: string): Visit {
  return {
    id: `visit-${n}`,
    patientId,
    clinicalNotes: `Notes for visit ${n}`,
    rxNotes: `Rx notes ${n}`,
    rxNotesLang: 'en',
    temperature: 37.0,
    systolic: 120,
    diastolic: 80,
    weight: 70,
    spo2: 98,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeVisitMed(n: number, visitId: string): VisitMedication {
  return {
    id: `visitmed-${n}`,
    visitId,
    brandName: `Drug${n}`,
    saltName: `Salt${n}`,
    form: 'Tablet',
    strength: '500mg',
    quantity: '1',
    frequency: 'TDS',
    duration: '5 days',
    sortOrder: n,
    slipType: 'dispensary',
  }
}

function makeSeedDrug(): Drug {
  const entry = { brandName: 'Amoxil', saltName: 'Amoxicillin', form: 'Capsule', strength: '500mg' }
  const id = buildSeedId(entry)
  return {
    id,
    brandName: entry.brandName,
    brandNameLower: entry.brandName.toLowerCase(),
    saltName: entry.saltName,
    saltNameLower: entry.saltName.toLowerCase(),
    form: entry.form,
    strength: entry.strength,
    isCustom: false,
    isActive: true,
    isOverridden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeCustomDrug(): Drug {
  return {
    id: 'custom-uuid-1234',
    brandName: 'CustomDrug',
    brandNameLower: 'customdrug',
    saltName: 'CustomSalt',
    saltNameLower: 'customsalt',
    form: 'Tablet',
    strength: '100mg',
    isCustom: true,
    isActive: true,
    isOverridden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

let legacyDb: LegacyClinicDatabase

async function populateLegacyDb(): Promise<void> {
  const patients = [makePatient(1), makePatient(2)]
  const visits = [makeVisit(1, 'patient-1'), makeVisit(2, 'patient-1')]
  const visitMeds: VisitMedication[] = [
    makeVisitMed(1, 'visit-1'),
    makeVisitMed(2, 'visit-1'),
    makeVisitMed(3, 'visit-2'),
  ]
  const drugs: Drug[] = [makeSeedDrug(), makeCustomDrug()]
  const settings: AppSettings[] = [
    { key: 'auth', value: { pin: 'hashed' } },
    { key: 'patientCounter', value: 2 },
  ]
  const recents: RecentPatient[] = [{ id: 'patient-1', viewedAt: '2026-01-01T00:00:00.000Z' }]

  await legacyDb.patients.bulkPut(patients)
  await legacyDb.visits.bulkPut(visits)
  await legacyDb.visitMedications.bulkPut(visitMeds)
  await legacyDb.drugs.bulkPut(drugs)
  await legacyDb.settings.bulkPut(settings)
  await legacyDb.recentPatients.bulkPut(recents)
}

beforeEach(async () => {
  localStorage.clear()
  await resetPouchDb()
  legacyDb = new LegacyClinicDatabase()
  await populateLegacyDb()
})

afterEach(async () => {
  legacyDb.close()
})

describe('MIGR-01: migrates all 6 tables to PouchDB without data loss', () => {
  it('migrates all tables to PouchDB without data loss', async () => {
    await runMigrationIfNeeded()

    // Patients
    const p1 = await pouchDb.get('patient:patient-1') as { firstName: string; type: string }
    expect(p1.firstName).toBe('First1')
    expect(p1.type).toBe('patient')

    const p2 = await pouchDb.get('patient:patient-2') as { firstName: string }
    expect(p2.firstName).toBe('First2')

    // Visits (with vitals)
    const v1 = await pouchDb.get('visit:visit-1') as { clinicalNotes: string; type: string; temperature: number }
    expect(v1.clinicalNotes).toBe('Notes for visit 1')
    expect(v1.type).toBe('visit')
    expect(v1.temperature).toBe(37.0)

    // VisitMedications
    const vm1 = await pouchDb.get('visitmed:visitmed-1') as { brandName: string; type: string }
    expect(vm1.brandName).toBe('Drug1')
    expect(vm1.type).toBe('visitmed')

    // Drugs
    const seedDrug = makeSeedDrug()
    const d1 = await pouchDb.get(`drug:${seedDrug.id}`) as { brandName: string; type: string }
    expect(d1.brandName).toBe('Amoxil')
    expect(d1.type).toBe('drug')

    // Settings
    const s1 = await pouchDb.get('settings:auth') as { key: string; type: string }
    expect(s1.key).toBe('auth')
    expect(s1.type).toBe('settings')

    const s2 = await pouchDb.get('settings:patientCounter') as { value: number }
    expect(s2.value).toBe(2)

    // RecentPatients
    const r1 = await pouchDb.get('recent:patient-1') as { id: string; type: string; viewedAt: string }
    expect(r1.id).toBe('patient-1')
    expect(r1.type).toBe('recent')
    expect(r1.viewedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('migrated data is queryable by type prefix', async () => {
    await runMigrationIfNeeded()

    const result = await pouchDb.allDocs({
      startkey: 'patient:',
      endkey: 'patient:\uffff',
      include_docs: true,
    })

    expect(result.rows).toHaveLength(2)
    const names = result.rows.map(r => (r.doc as unknown as { firstName: string }).firstName).sort()
    expect(names).toEqual(['First1', 'First2'])
  })
})

describe('MIGR-02: drug seeds use deterministic _id', () => {
  it('seed drugs use deterministic _id matching buildSeedId output', async () => {
    await runMigrationIfNeeded()

    const entry = { brandName: 'Amoxil', saltName: 'Amoxicillin', form: 'Capsule', strength: '500mg' }
    const expectedId = `drug:${buildSeedId(entry)}`
    const doc = await pouchDb.get(expectedId)
    expect(doc._id).toBe(expectedId)
  })

  it('inserting same seed drug again via bulkDocs returns 409 conflict', async () => {
    await runMigrationIfNeeded()

    const entry = { brandName: 'Amoxil', saltName: 'Amoxicillin', form: 'Capsule', strength: '500mg' }
    const id = `drug:${buildSeedId(entry)}`
    const results = await pouchDb.bulkDocs([{ _id: id, type: 'drug', brandName: 'Amoxil' } as PouchDB.Core.PutDocument<object>])
    const result = results[0] as PouchDB.Core.Error
    // PouchDB returns conflict status 409 when a doc with the same _id exists without _rev
    expect(result.status).toBe(409)
  })
})

describe('MIGR-03: migration runs once', () => {
  it('sets localStorage flag after completion', async () => {
    expect(localStorage.getItem(MIGRATION_FLAG)).toBeNull()
    await runMigrationIfNeeded()
    expect(localStorage.getItem(MIGRATION_FLAG)).toBe('done')
  })

  it('second call is a no-op after flag is set', async () => {
    await runMigrationIfNeeded()

    const countAfterFirst = (await pouchDb.allDocs()).rows.length
    await runMigrationIfNeeded()
    const countAfterSecond = (await pouchDb.allDocs()).rows.length

    expect(countAfterSecond).toBe(countAfterFirst)
  })

  it('handles empty Dexie gracefully', async () => {
    // Close and replace with an empty legacy db
    legacyDb.close()
    legacyDb = new LegacyClinicDatabase()
    // Don't populate -- empty DB

    await expect(runMigrationIfNeeded()).resolves.toBeUndefined()
    expect(localStorage.getItem(MIGRATION_FLAG)).toBe('done')
  })
})
