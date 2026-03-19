import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import type { Patient, Drug, Visit, VisitMedication, AppSettings, RecentPatient } from './index'

PouchDB.plugin(PouchDBFind)

// Register memory adapter in test environment to avoid LevelDB lock contention
if (import.meta.env.VITEST) {
  // Dynamic import is not available at module level; use require-style approach
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const memoryAdapter = require('pouchdb-adapter-memory')
  PouchDB.plugin(memoryAdapter)
}

export interface PouchPatient extends Patient {
  _id: string
  _rev?: string
  type: 'patient'
}

export interface PouchVisit extends Visit {
  _id: string
  _rev?: string
  type: 'visit'
}

export interface PouchDrug extends Drug {
  _id: string
  _rev?: string
  type: 'drug'
}

export interface PouchVisitMedication extends VisitMedication {
  _id: string
  _rev?: string
  type: 'visitmed'
}

export interface PouchSettings extends AppSettings {
  _id: string
  _rev?: string
  type: 'settings'
}

export interface PouchRecentPatient extends RecentPatient {
  _id: string
  _rev?: string
  type: 'recent'
}

const DB_NAME = 'clinicsoftware_v2'
const OLD_DB_NAME = 'ClinicSoftware_v2'
const RENAME_FLAG = 'clinic_db_renamed_v2'

function createDb(): PouchDB.Database {
  if (import.meta.env.VITEST) {
    return new PouchDB(DB_NAME, { adapter: 'memory' })
  }
  return new PouchDB(DB_NAME)
}

export let pouchDb: PouchDB.Database = createDb()

/**
 * One-time migration: copy data from old uppercase DB name to new lowercase name.
 * CouchDB requires lowercase database names, so PouchDB must match.
 * IndexedDB names are case-sensitive, so the old data sits in a different store.
 * Runs once, guarded by localStorage flag.
 */
export async function migrateDbName(): Promise<void> {
  if (import.meta.env.VITEST) return
  if (localStorage.getItem(RENAME_FLAG)) return

  const oldDb = new PouchDB(OLD_DB_NAME)
  try {
    const info = await oldDb.info()
    if (info.doc_count === 0) {
      localStorage.setItem(RENAME_FLAG, 'true')
      await oldDb.close()
      return
    }

    await oldDb.replicate.to(pouchDb)
    await oldDb.destroy()
    localStorage.setItem(RENAME_FLAG, 'true')
  } catch {
    // Old DB doesn't exist or is empty, nothing to migrate
    localStorage.setItem(RENAME_FLAG, 'true')
    await oldDb.close()
  }
}

export async function ensureIndexes(): Promise<void> {
  await pouchDb.createIndex({ index: { fields: ['type', 'patientId'] } })
  await pouchDb.createIndex({ index: { fields: ['type', 'firstNameLower'] } })
  await pouchDb.createIndex({ index: { fields: ['type', 'lastNameLower'] } })
  await pouchDb.createIndex({ index: { fields: ['type', 'visitId'] } })
  await pouchDb.createIndex({ index: { fields: ['type', 'brandNameLower'] } })
  await pouchDb.createIndex({ index: { fields: ['type', 'saltNameLower'] } })
  await pouchDb.createIndex({ index: { fields: ['type', 'createdAt'] } })
}

/** Destroy and recreate the PouchDB instance (for testing only). */
export async function resetPouchDb(): Promise<void> {
  await pouchDb.destroy()
  pouchDb = createDb()
}

/** Upsert a settings document by key. */
export async function putSetting(key: string, value: unknown): Promise<void> {
  const _id = `settings:${key}`
  try {
    const existing = await pouchDb.get(_id)
    await pouchDb.put({
      ...(existing as unknown as Record<string, unknown>),
      value,
      type: 'settings',
      key,
    } as PouchDB.Core.PutDocument<Record<string, unknown>>)
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) {
      await pouchDb.put({ _id, type: 'settings', key, value } as PouchDB.Core.PutDocument<Record<string, unknown>>)
    } else throw err
  }
}

/** Get a settings value by key. Returns undefined if not found. */
export async function getSetting(key: string): Promise<unknown> {
  try {
    const doc = await pouchDb.get(`settings:${key}`)
    return (doc as unknown as Record<string, unknown>).value
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return undefined
    throw err
  }
}
