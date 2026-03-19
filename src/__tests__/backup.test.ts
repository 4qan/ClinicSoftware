import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { resetDatabase } from '@/db/index'
import { pouchDb } from '@/db/pouchdb'

import {
  exportDatabase,
  downloadBackup,
  validateBackupFile,
  restoreDatabase,
  type BackupFile,
} from '@/utils/backup'

// SCHEMA_VERSION = 2 in the new PouchDB-based backup.ts
const CURRENT_SCHEMA_VERSION = 2

describe('exportDatabase', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('returns data with keys for PouchDB type names', async () => {
    const backup = await exportDatabase()
    // Empty DB returns empty data object (no entries, so no type keys)
    expect(backup.data).toBeDefined()
    expect(typeof backup.data).toBe('object')
  })

  it('metadata has correct fields', async () => {
    const backup = await exportDatabase()
    expect(backup.metadata.appName).toBe('ClinicSoftware')
    expect(typeof backup.metadata.exportDate).toBe('string')
    expect(typeof backup.metadata.schemaVersion).toBe('number')
    expect(typeof backup.metadata.appVersion).toBe('string')
  })

  it('metadata schemaVersion is 2 (PouchDB era)', async () => {
    const backup = await exportDatabase()
    expect(backup.metadata.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('metadata tables has correct counts after inserting patients', async () => {
    await pouchDb.bulkDocs([
      {
        _id: 'patient:p1',
        id: 'p1',
        patientId: 'P-001',
        firstName: 'Ali',
        lastName: 'Khan',
        firstNameLower: 'ali',
        lastNameLower: 'khan',
        age: 30,
        gender: 'male',
        type: 'patient',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'patient:p2',
        id: 'p2',
        patientId: 'P-002',
        firstName: 'Sara',
        lastName: 'Ahmed',
        firstNameLower: 'sara',
        lastNameLower: 'ahmed',
        age: 25,
        gender: 'female',
        type: 'patient',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    const backup = await exportDatabase()
    expect(backup.metadata.tables.patient).toBe(2)
  })

  it('exports seeded data correctly', async () => {
    await pouchDb.put({
      _id: 'patient:p1',
      id: 'p1',
      patientId: 'P-001',
      firstName: 'Test',
      lastName: 'Patient',
      firstNameLower: 'test',
      lastNameLower: 'patient',
      age: 40,
      gender: 'male',
      type: 'patient',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await pouchDb.put({
      _id: 'visit:v1',
      id: 'v1',
      patientId: 'p1',
      clinicalNotes: 'Fever',
      rxNotes: '',
      type: 'visit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const backup = await exportDatabase()
    expect(backup.data.patient).toHaveLength(1)
    expect(backup.data.visit).toHaveLength(1)
    expect((backup.data.patient[0] as any).firstName).toBe('Test')
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
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tables: { patient: 0 },
      },
      data: { patient: [] },
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
        schemaVersion: CURRENT_SCHEMA_VERSION,
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
        schemaVersion: CURRENT_SCHEMA_VERSION,
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
        schemaVersion: CURRENT_SCHEMA_VERSION + 1,
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
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tables: { patient: 5 },
      },
      data: { patient: [] },
    })
    expect(result).toEqual({
      valid: true,
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.1.0',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tables: { patient: 5 },
      },
    })
  })

  it('accepts backup from older schema version (Dexie era)', () => {
    const result = validateBackupFile({
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-01-01T00:00:00Z',
        appVersion: '1.0.0',
        schemaVersion: 1,
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

  it('restores patient and visit data from PouchDB backup', async () => {
    // Seed existing data
    await pouchDb.put({
      _id: 'patient:existing-p',
      id: 'existing-p',
      patientId: 'P-999',
      firstName: 'Old',
      lastName: 'Data',
      firstNameLower: 'old',
      lastNameLower: 'data',
      age: 50,
      gender: 'male',
      type: 'patient',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const backup: BackupFile = {
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-03-10T12:00:00Z',
        appVersion: '2.0.0',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tables: { patient: 2, visit: 1 },
      },
      data: {
        patient: [
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
        visit: [
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

    // Old data replaced, new data present
    const allDocs = await pouchDb.allDocs({
      startkey: 'patient:',
      endkey: 'patient:\uffff',
      include_docs: true,
    })
    expect(allDocs.rows).toHaveLength(2)
    const names = allDocs.rows.map((r: any) => r.doc.firstName).sort()
    expect(names).toEqual(['Ali', 'Sara'])

    const visitDocs = await pouchDb.allDocs({
      startkey: 'visit:',
      endkey: 'visit:\uffff',
      include_docs: true,
    })
    expect(visitDocs.rows).toHaveLength(1)
    expect((visitDocs.rows[0].doc as any).clinicalNotes).toBe('Restored visit')
  })

  it('clears all existing docs when backup has no matching type', async () => {
    // Seed a drug
    await pouchDb.put({
      _id: 'drug:d1',
      id: 'd1',
      brandName: 'TestDrug',
      brandNameLower: 'testdrug',
      saltName: 'Salt',
      saltNameLower: 'salt',
      form: 'Tablet',
      strength: '500mg',
      isCustom: false,
      isActive: true,
      type: 'drug',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const backup: BackupFile = {
      metadata: {
        appName: 'ClinicSoftware',
        exportDate: '2026-03-10T12:00:00Z',
        appVersion: '2.0.0',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tables: { patient: 0 },
      },
      data: {
        patient: [],
      },
    }

    await restoreDatabase(backup)

    // Drugs should be gone (cleared in step 1, not re-added since not in backup)
    const drugDocs = await pouchDb.allDocs({
      startkey: 'drug:',
      endkey: 'drug:\uffff',
    })
    expect(drugDocs.rows).toHaveLength(0)
  })
})
