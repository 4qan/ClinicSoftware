import Dexie, { type Table } from 'dexie'
import type { Patient, AppSettings, RecentPatient, Drug, Visit, VisitMedication } from './index'

/**
 * Read-only copy of the original Dexie database class.
 * Used only by migration.ts to read existing data before writing to PouchDB.
 * Do not use for new writes.
 */
export class LegacyClinicDatabase extends Dexie {
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

    // v7: adds optional vital fields to Visit (temperature, systolic, diastolic, weight, spo2)
    // No new indexes needed; missing fields are treated as "not recorded"
    this.version(7).stores({
      patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
      settings: 'key',
      recentPatients: 'id, viewedAt',
      drugs: 'id, brandNameLower, saltNameLower, isCustom',
      visits: 'id, patientId, createdAt',
      visitMedications: 'id, visitId',
    })
  }
}
