import Dexie, { type Table } from 'dexie'

export interface Patient {
  id: string
  patientId: string
  firstName: string
  lastName: string
  firstNameLower: string
  lastNameLower: string
  age: number
  gender: 'male' | 'female' | 'other'
  contact?: string
  cnic?: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  key: string
  value: unknown
}

export interface RecentPatient {
  id: string
  viewedAt: string
}

export class ClinicDatabase extends Dexie {
  patients!: Table<Patient, string>
  settings!: Table<AppSettings, string>
  recentPatients!: Table<RecentPatient, string>

  constructor() {
    super('ClinicSoftware')

    this.version(1).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
    })
  }
}

export let db = new ClinicDatabase()

/** Reset the database instance (for testing). Deletes all data and re-creates. */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  db = new ClinicDatabase()
}
