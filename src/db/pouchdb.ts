import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import type { Patient, Drug, Visit, VisitMedication, AppSettings, RecentPatient } from './index'

PouchDB.plugin(PouchDBFind)

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

function createDb(): PouchDB.Database {
  return new PouchDB('ClinicSoftware_v2')
}

export let pouchDb: PouchDB.Database = createDb()

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
      ...(existing as Record<string, unknown>),
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
    return (doc as Record<string, unknown>).value
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return undefined
    throw err
  }
}
