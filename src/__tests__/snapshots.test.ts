import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { resetDatabase, db } from '@/db/index'

// We'll import from the module under test once it exists
// For RED phase, these imports will fail until GREEN phase
import {
  snapshotDb,
  checkAndCreateSnapshot,
  rotateSnapshots,
  listSnapshots,
  getSnapshot,
  formatTimeAgo,
  resetSnapshotDatabase,
} from '@/utils/snapshots'

// Mock exportDatabase to avoid needing full DB setup for every test
vi.mock('@/utils/backup', () => ({
  exportDatabase: vi.fn().mockResolvedValue({
    metadata: {
      appName: 'ClinicSoftware',
      exportDate: '2026-03-10T12:00:00.000Z',
      appVersion: '1.1.0',
      schemaVersion: 4,
      tables: { patients: 0 },
    },
    data: { patients: [] },
  }),
}))

import { exportDatabase } from '@/utils/backup'

describe('checkAndCreateSnapshot', () => {
  beforeEach(async () => {
    await resetDatabase()
    await resetSnapshotDatabase()
    vi.restoreAllMocks()
  })

  it('creates snapshot when none exists', async () => {
    // No lastAutoSnapshotDate in settings = first ever load
    await checkAndCreateSnapshot()

    const snapshots = await snapshotDb.snapshots.toArray()
    expect(snapshots).toHaveLength(1)
  })

  it('skips if less than 24 hours', async () => {
    // Set lastAutoSnapshotDate to 12 hours ago
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    await db.settings.put({ key: 'lastAutoSnapshotDate', value: twelveHoursAgo })

    await checkAndCreateSnapshot()

    const snapshots = await snapshotDb.snapshots.toArray()
    expect(snapshots).toHaveLength(0)
  })

  it('creates snapshot after 24 hours', async () => {
    // Set lastAutoSnapshotDate to 25 hours ago
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    await db.settings.put({ key: 'lastAutoSnapshotDate', value: twentyFiveHoursAgo })

    await checkAndCreateSnapshot()

    const snapshots = await snapshotDb.snapshots.toArray()
    expect(snapshots).toHaveLength(1)
  })

  it('updates lastAutoSnapshotDate after creation', async () => {
    const before = Date.now()
    await checkAndCreateSnapshot()
    const after = Date.now()

    const entry = await db.settings.get('lastAutoSnapshotDate')
    expect(entry).toBeDefined()
    const timestamp = new Date(entry!.value as string).getTime()
    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
  })

  it('snapshot format matches BackupFile', async () => {
    await checkAndCreateSnapshot()

    const snapshots = await snapshotDb.snapshots.toArray()
    expect(snapshots[0].data).toHaveProperty('metadata')
    expect(snapshots[0].data).toHaveProperty('data')
    expect(snapshots[0].data.metadata.appName).toBe('ClinicSoftware')
  })

  it('silently handles errors', async () => {
    // Make exportDatabase throw
    vi.mocked(exportDatabase).mockRejectedValueOnce(new Error('DB error'))

    // Should not throw
    await expect(checkAndCreateSnapshot()).resolves.toBeUndefined()

    // No snapshot created
    const snapshots = await snapshotDb.snapshots.toArray()
    expect(snapshots).toHaveLength(0)
  })

  it('stops at hard cap 5', async () => {
    // Manually add 5 snapshots
    for (let i = 0; i < 5; i++) {
      await snapshotDb.snapshots.add({
        createdAt: new Date(Date.now() - (5 - i) * 60 * 60 * 1000).toISOString(),
        data: {
          metadata: {
            appName: 'ClinicSoftware',
            exportDate: '',
            appVersion: '1.1.0',
            schemaVersion: 4,
            tables: {},
          },
          data: {},
        },
      })
    }

    // Try to create another (no lastAutoSnapshotDate, so timer says "go")
    await checkAndCreateSnapshot()

    // Still 5, not 6
    const count = await snapshotDb.snapshots.count()
    expect(count).toBe(5)
  })
})

describe('rotateSnapshots', () => {
  beforeEach(async () => {
    await resetSnapshotDatabase()
  })

  it('rotates to keep 3', async () => {
    // Add 4 snapshots
    for (let i = 0; i < 4; i++) {
      await snapshotDb.snapshots.add({
        createdAt: new Date(Date.now() - (4 - i) * 60 * 60 * 1000).toISOString(),
        data: {
          metadata: {
            appName: 'ClinicSoftware',
            exportDate: '',
            appVersion: '1.1.0',
            schemaVersion: 4,
            tables: {},
          },
          data: {},
        },
      })
    }

    await rotateSnapshots()

    const count = await snapshotDb.snapshots.count()
    expect(count).toBe(3)
  })

  it('deletes oldest by createdAt', async () => {
    const dates = [
      '2026-03-01T00:00:00.000Z', // oldest - should be deleted
      '2026-03-02T00:00:00.000Z',
      '2026-03-03T00:00:00.000Z',
      '2026-03-04T00:00:00.000Z', // newest
    ]

    for (const date of dates) {
      await snapshotDb.snapshots.add({
        createdAt: date,
        data: {
          metadata: {
            appName: 'ClinicSoftware',
            exportDate: '',
            appVersion: '1.1.0',
            schemaVersion: 4,
            tables: {},
          },
          data: {},
        },
      })
    }

    await rotateSnapshots()

    const remaining = await snapshotDb.snapshots.orderBy('createdAt').toArray()
    expect(remaining).toHaveLength(3)
    // Oldest (March 1) should be gone
    expect(remaining[0].createdAt).toBe('2026-03-02T00:00:00.000Z')
    expect(remaining[2].createdAt).toBe('2026-03-04T00:00:00.000Z')
  })

  it('resumes rotation after cleanup', async () => {
    // Add 5 snapshots (simulating stuck rotation)
    for (let i = 0; i < 5; i++) {
      await snapshotDb.snapshots.add({
        createdAt: new Date(Date.now() - (5 - i) * 60 * 60 * 1000).toISOString(),
        data: {
          metadata: {
            appName: 'ClinicSoftware',
            exportDate: '',
            appVersion: '1.1.0',
            schemaVersion: 4,
            tables: {},
          },
          data: {},
        },
      })
    }

    // Delete 2 manually (simulating cleanup succeeding)
    const oldest = await snapshotDb.snapshots.orderBy('createdAt').limit(2).toArray()
    for (const snap of oldest) {
      if (snap.id !== undefined) {
        await snapshotDb.snapshots.delete(snap.id)
      }
    }

    // Now 3 remain. Reset timer and create one more
    await resetDatabase()
    await checkAndCreateSnapshot()

    // Should have 4, then rotate back to 3
    const count = await snapshotDb.snapshots.count()
    expect(count).toBe(3)
  })
})

describe('listSnapshots', () => {
  beforeEach(async () => {
    await resetSnapshotDatabase()
  })

  it('returns newest first', async () => {
    const dates = [
      '2026-03-01T00:00:00.000Z',
      '2026-03-03T00:00:00.000Z',
      '2026-03-02T00:00:00.000Z',
    ]

    for (const date of dates) {
      await snapshotDb.snapshots.add({
        createdAt: date,
        data: {
          metadata: {
            appName: 'ClinicSoftware',
            exportDate: '',
            appVersion: '1.1.0',
            schemaVersion: 4,
            tables: {},
          },
          data: {},
        },
      })
    }

    const result = await listSnapshots()
    expect(result).toHaveLength(3)
    expect(result[0].createdAt).toBe('2026-03-03T00:00:00.000Z')
    expect(result[1].createdAt).toBe('2026-03-02T00:00:00.000Z')
    expect(result[2].createdAt).toBe('2026-03-01T00:00:00.000Z')
  })
})

describe('getSnapshot', () => {
  beforeEach(async () => {
    await resetSnapshotDatabase()
  })

  it('returns by id', async () => {
    const id = await snapshotDb.snapshots.add({
      createdAt: '2026-03-10T12:00:00.000Z',
      data: {
        metadata: {
          appName: 'ClinicSoftware',
          exportDate: '2026-03-10T12:00:00.000Z',
          appVersion: '1.1.0',
          schemaVersion: 4,
          tables: {},
        },
        data: {},
      },
    })

    const snap = await getSnapshot(id)
    expect(snap).toBeDefined()
    expect(snap!.createdAt).toBe('2026-03-10T12:00:00.000Z')
  })

  it('returns undefined for non-existent id', async () => {
    const snap = await getSnapshot(999)
    expect(snap).toBeUndefined()
  })
})

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns relative time for days', () => {
    const result = formatTimeAgo('2026-03-08T12:00:00.000Z') // 2 days ago
    expect(result).toBe('2 days ago')
  })

  it('returns "yesterday" for 1 day ago', () => {
    const result = formatTimeAgo('2026-03-09T12:00:00.000Z') // 1 day ago
    expect(result).toBe('yesterday')
  })

  it('returns hours ago', () => {
    const result = formatTimeAgo('2026-03-10T09:00:00.000Z') // 3 hours ago
    expect(result).toBe('3 hours ago')
  })

  it('returns minutes ago', () => {
    const result = formatTimeAgo('2026-03-10T11:55:00.000Z') // 5 minutes ago
    expect(result).toBe('5 minutes ago')
  })

  it('returns seconds ago for very recent', () => {
    const result = formatTimeAgo('2026-03-10T11:59:30.000Z') // 30 seconds ago
    expect(result).toBe('30 seconds ago')
  })
})
