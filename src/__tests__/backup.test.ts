import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { resetDatabase, db } from '@/db/index'

// Will be created in GREEN step
import { exportDatabase, downloadBackup, type BackupFile } from '@/utils/backup'

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

  it('triggers anchor click download with correct filename pattern', () => {
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
    expect(filename).toMatch(/^ClinicSoftware-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(mockClick).toHaveBeenCalled()
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  })
})
