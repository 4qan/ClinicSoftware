import Dexie, { type Table } from 'dexie'
import type { BackupFile } from './backup'
import { exportDatabase } from './backup'
import { db } from '@/db/index'

export interface Snapshot {
  id?: number
  createdAt: string
  data: BackupFile
}

class SnapshotDatabase extends Dexie {
  snapshots!: Table<Snapshot, number>

  constructor() {
    super('ClinicSoftwareSnapshots')
    this.version(1).stores({
      snapshots: '++id, createdAt',
    })
  }
}

export let snapshotDb = new SnapshotDatabase()

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
const MAX_SNAPSHOTS = 3
const HARD_CAP = 5

/** Reset snapshot database (for testing). Deletes all data and re-creates. */
export async function resetSnapshotDatabase(): Promise<void> {
  await snapshotDb.delete()
  snapshotDb = new SnapshotDatabase()
}

/**
 * Check if a snapshot is needed and create one if so.
 * Called on app load (fire-and-forget). Never throws.
 */
export async function checkAndCreateSnapshot(): Promise<void> {
  try {
    // Check hard cap first
    const count = await snapshotDb.snapshots.count()
    if (count >= HARD_CAP) return

    // Check 24h timer
    const entry = await db.settings.get('lastAutoSnapshotDate')
    const lastSnapshot = entry?.value as string | undefined

    if (lastSnapshot) {
      const elapsed = Date.now() - new Date(lastSnapshot).getTime()
      if (elapsed < TWENTY_FOUR_HOURS) return
    }

    // Create snapshot
    await createSnapshot()

    // Rotate
    await rotateSnapshots()
  } catch {
    // Silent fail - retry on next app load
  }
}

/** Create a snapshot from current database state. */
export async function createSnapshot(): Promise<void> {
  const backup = await exportDatabase()
  await snapshotDb.snapshots.add({
    createdAt: new Date().toISOString(),
    data: backup,
  })
  await db.settings.put({
    key: 'lastAutoSnapshotDate',
    value: new Date().toISOString(),
  })
}

/** Rotate snapshots: keep only MAX_SNAPSHOTS, delete oldest by createdAt. */
export async function rotateSnapshots(): Promise<void> {
  const count = await snapshotDb.snapshots.count()
  if (count <= MAX_SNAPSHOTS) return

  const toDelete = count - MAX_SNAPSHOTS
  const oldest = await snapshotDb.snapshots
    .orderBy('createdAt')
    .limit(toDelete)
    .toArray()

  for (const snap of oldest) {
    try {
      if (snap.id !== undefined) {
        await snapshotDb.snapshots.delete(snap.id)
      }
    } catch {
      // Silent fail - keep extra snapshots temporarily
    }
  }
}

/** List all snapshots, newest first. */
export async function listSnapshots(): Promise<Snapshot[]> {
  return snapshotDb.snapshots.orderBy('createdAt').reverse().toArray()
}

/** Get a single snapshot by ID. */
export async function getSnapshot(id: number): Promise<Snapshot | undefined> {
  return snapshotDb.snapshots.get(id)
}

/** Format an ISO date string as a human-readable relative time. */
export function formatTimeAgo(isoDate: string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = Date.now() - new Date(isoDate).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return rtf.format(-days, 'day')
  if (hours > 0) return rtf.format(-hours, 'hour')
  if (minutes > 0) return rtf.format(-minutes, 'minute')
  return rtf.format(-seconds, 'second')
}
