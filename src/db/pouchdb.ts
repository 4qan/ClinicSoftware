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
