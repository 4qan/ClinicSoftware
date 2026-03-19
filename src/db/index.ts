import Dexie, { type Table } from 'dexie'

export interface Patient {
  id: string
  patientId: string
  firstName: string
  lastName: string
  firstNameLower: string
  lastNameLower: string
  age: number
  gender: 'male' | 'female'
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

export interface Drug {
  id: string
  brandName: string
  brandNameLower: string
  saltName: string
  saltNameLower: string
  form: string
  strength: string
  isCustom: boolean
  isActive: boolean
  isOverridden?: boolean
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id: string
  patientId: string
  clinicalNotes: string
  rxNotes: string
  rxNotesLang?: 'en' | 'ur'
  createdAt: string
  updatedAt: string
}

export interface VisitMedication {
  id: string
  visitId: string
  drugId?: string
  brandName: string
  saltName: string
  form: string
  strength: string
  quantity: string
  frequency: string
  duration: string
  sortOrder: number
  slipType?: 'dispensary' | 'prescription'
}

export class ClinicDatabase extends Dexie {
  patients!: Table<Patient, string>
  settings!: Table<AppSettings, string>
  recentPatients!: Table<RecentPatient, string>
  drugs!: Table<Drug, string>
  visits!: Table<Visit, string>
  visitMedications!: Table<VisitMedication, string>

  constructor() {
    super('ClinicSoftware')

    this.version(1).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
    })

    this.version(2).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
      drugs: 'id, brandNameLower, saltNameLower, isCustom',
      visits: 'id, patientId, createdAt',
      visitMedications: 'id, visitId',
    })

    this.version(3).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
      drugs: 'id, brandNameLower, saltNameLower, isCustom',
      visits: 'id, patientId, createdAt',
      visitMedications: 'id, visitId',
    }).upgrade(tx => {
      return tx.table('visitMedications').toCollection().modify(med => {
        if ('dosage' in med && !('quantity' in med)) {
          med.quantity = med.dosage
          delete med.dosage
        }
      })
    })

    this.version(4).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
      drugs: 'id, brandNameLower, saltNameLower, isCustom',
      visits: 'id, patientId, createdAt',
      visitMedications: 'id, visitId',
    }).upgrade(tx => {
      return tx.table('visits').toCollection().modify(visit => {
        if (!visit.rxNotesLang) {
          visit.rxNotesLang = 'en'
        }
      })
    })

    // v5: adds slipType field to VisitMedication (no new indexes needed)
    // Missing slipType is treated as 'dispensary' by convention at read time
    this.version(5).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
      drugs: 'id, brandNameLower, saltNameLower, isCustom',
      visits: 'id, patientId, createdAt',
      visitMedications: 'id, visitId',
    })

    // v6: adds isOverridden field to Drug (no new indexes needed)
    // Existing records without isOverridden are treated as false
    this.version(6).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
      drugs: 'id, brandNameLower, saltNameLower, isCustom',
      visits: 'id, patientId, createdAt',
      visitMedications: 'id, visitId',
    }).upgrade(tx => {
      return tx.table('drugs').toCollection().modify(drug => {
        if (drug.isOverridden === undefined) {
          drug.isOverridden = false
        }
      })
    })
  }
}

export let db = new ClinicDatabase()

/** Reset the database instance (for testing). Deletes all data and re-creates. */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  db = new ClinicDatabase()
}
