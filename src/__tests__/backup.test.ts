import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { resetDatabase, db } from '@/db/index'

import {
  exportDatabase,
  downloadBackup,
  validateBackupFile,
  restoreDatabase,
  type BackupFile,
} from '@/utils/backup'

describe('exportDatabase', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('returns data with keys for all 6 tables', async () => {
    const backup = await exportDatabase()
    const expectedTables = [
      'patients',
      'visits',
      'visitMedications',
      'drugs',
      'settings',
      'recentPatients',
    ]
    for (const table of expectedTables) {
      expect(backup.data).toHaveProperty(table)
      expect(Array.isArray(backup.data[table])).toBe(true)
    }
  })

  it('metadata has correct fields', async () => {
    const backup = await exportDatabase()
    expect(backup.metadata.appName).toBe('ClinicSoftware')
    expect(typeof backup.metadata.exportDate).toBe('string')
    expect(typeof backup.metadata.schemaVersion).toBe('number')
    expect(typeof backup.metadata.appVersion).toBe('string')
  })

  it('metadata tables has correct counts', async () => {
    // Seed 2 patients
    await db.patients.bulkAdd([
      {
        id: 'p1',
        patientId: 'P-001',
        firstName: 'Ali',
        lastName: 'Khan',
        firstNameLower: 'ali',
        lastNameLower: 'khan',
        age: 30,
        gender: 'male',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p2',
        patientId: 'P-002',
        firstName: 'Sara',
        lastName: 'Ahmed',
        firstNameLower: 'sara',
        lastNameLower: 'ahmed',
        age: 25,
        gender: 'female',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    const backup = await exportDatabase()
    expect(backup.metadata.tables.patients).toBe(2)
  })

  it('exports seeded data correctly', async () => {
    await db.patients.add({
      id: 'p1',
      patientId: 'P-001',
      firstName: 'Test',
      lastName: 'Patient',
      firstNameLower: 'test',
      lastNameLower: 'patient',
      age: 40,
      gender: 'male',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await db.visits.add({
      id: 'v1',
      patientId: 'p1',
      clinicalNotes: 'Fever',
      rxNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const backup = await exportDatabase()
    expect(backup.data.patients).toHaveLength(1)
    expect(backup.data.visits).toHaveLength(1)
    expect(backup.data.patients[0]).toMatchObject({ firstName: 'Test' })
  })
})

describe('downloadBackup', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>
  let mockClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockClick = vi.fn()
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
    mockRevokeObjectURL = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    })

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
          style: {},
        } as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers anchor click download with datetime filename pattern', () => {
    const backup: BackupFile = {
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-03-10T12:00:00.000Z',
        appVersion: '1.1.0',
        schemaVersion: 4,
        tables: { patients: 0 },
      },
      data: { patients: [] },
    }

    const filename = downloadBackup(backup)
    expect(filename).toMatch(
      /^ClinicSoftware-backup-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/
    )
    expect(mockClick).toHaveBeenCalled()
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  })
})

describe('validateBackupFile', () => {
  it('rejects non-object input (null)', () => {
    const result = validateBackupFile(null)
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects non-object input (string)', () => {
    const result = validateBackupFile('not an object')
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects non-object input (number)', () => {
    const result = validateBackupFile(42)
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects missing metadata key', () => {
    const result = validateBackupFile({ data: {} })
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects missing data key', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.0.0',
        schemaVersion: 4,
        tables: {},
      },
    })
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects wrong appName', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'WrongApp',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.0.0',
        schemaVersion: 4,
        tables: {},
      },
      data: {},
    })
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects non-number schemaVersion', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.0.0',
        schemaVersion: 'four',
        tables: {},
      },
      data: {},
    })
    expect(result).toEqual({ valid: false, error: 'invalid_format' })
  })

  it('rejects newer schema version', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '2.0.0',
        schemaVersion: db.verno + 1,
        tables: {},
      },
      data: {},
    })
    expect(result).toEqual({ valid: false, error: 'newer_schema' })
  })

  it('accepts valid backup with current schema version', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.1.0',
        schemaVersion: db.verno,
        tables: { patients: 5 },
      },
      data: { patients: [] },
    })
    expect(result).toEqual({
      valid: true,
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.1.0',
        schemaVersion: db.verno,
        tables: { patients: 5 },
      },
    })
  })

  it('accepts backup from older schema version', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.0.0',
        schemaVersion: 2,
        tables: { patients: 1 },
      },
      data: { patients: [] },
    })
    expect(result.valid).toBe(true)
  })
})

describe('restoreDatabase', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('restores all tables from backup data', async () => {
    // Seed existing data
    await db.patients.add({
      id: 'existing-p',
      patientId: 'P-999',
      firstName: 'Old',
      lastName: 'Data',
      firstNameLower: 'old',
      lastNameLower: 'data',
      age: 50,
      gender: 'male',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const backup: BackupFile = {
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-03-10T12:00:00Z',
        appVersion: '1.1.0',
        schemaVersion: 4,
        tables: { patients: 2, visits: 1 },
      },
      data: {
        patients: [
          {
            id: 'p1',
            patientId: 'P-001',
            firstName: 'Ali',
            lastName: 'Khan',
            firstNameLower: 'ali',
            lastNameLower: 'khan',
            age: 30,
            gender: 'male',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'p2',
            patientId: 'P-002',
            firstName: 'Sara',
            lastName: 'Ahmed',
            firstNameLower: 'sara',
            lastNameLower: 'ahmed',
            age: 25,
            gender: 'female',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        visits: [
          {
            id: 'v1',
            patientId: 'p1',
            clinicalNotes: 'Restored visit',
            rxNotes: '',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      },
    }

    await restoreDatabase(backup)

    // Old data replaced
    const patients = await db.patients.toArray()
    expect(patients).toHaveLength(2)
    expect(patients.map((p) => p.firstName).sort()).toEqual(['Ali', 'Sara'])

    const visits = await db.visits.toArray()
    expect(visits).toHaveLength(1)
    expect(visits[0].clinicalNotes).toBe('Restored visit')
  })

  it('clears tables not present in backup data', async () => {
    // Seed a drug
    await db.drugs.add({
      id: 'd1',
      brandName: 'TestDrug',
      brandNameLower: 'testdrug',
      saltName: 'Salt',
      saltNameLower: 'salt',
      form: 'Tablet',
      strength: '500mg',
      isCustom: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const backup: BackupFile = {
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-03-10T12:00:00Z',
        appVersion: '1.1.0',
        schemaVersion: 4,
        tables: { patients: 0 },
      },
      data: {
        patients: [],
      },
    }

    await restoreDatabase(backup)

    // drugs table should be empty since it wasn't in backup
    const drugs = await db.drugs.toArray()
    expect(drugs).toHaveLength(0)
  })

  it('throws on invalid data and leaves database unchanged', async () => {
    // Seed known data
    await db.patients.add({
      id: 'p-safe',
      patientId: 'P-SAFE',
      firstName: 'Safe',
      lastName: 'Patient',
      firstNameLower: 'safe',
      lastNameLower: 'patient',
      age: 30,
      gender: 'male',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Create a backup with deliberately bad data that will cause bulkPut to fail
    // Dexie requires the primary key to exist. We'll craft data that triggers a transaction error.
    const badBackup: BackupFile = {
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-03-10T12:00:00Z',
        appVersion: '1.1.0',
        schemaVersion: 4,
        tables: {},
      },
      data: {
        // patients with missing primary key (id) will cause Dexie to fail
        patients: [{ noIdField: true } as unknown as Record<string, unknown>],
      },
    }

    await expect(restoreDatabase(badBackup)).rejects.toThrow()

    // Original data should be intact due to transaction rollback
    const patients = await db.patients.toArray()
    expect(patients).toHaveLength(1)
    expect(patients[0].firstName).toBe('Safe')
  })
})
