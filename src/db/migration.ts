import { pouchDb } from './pouchdb'
import { LegacyClinicDatabase } from './legacy'

export const MIGRATION_FLAG = 'clinic_migrated_v2'

/**
 * One-time migration from Dexie (ClinicSoftware) to PouchDB (ClinicSoftware_v2).
 * Reads all 6 Dexie tables and writes them to PouchDB with type-prefixed _id fields.
 * Guarded by a localStorage flag so it never runs more than once.
 * On crash recovery, 409 conflicts from a partial previous run are treated as success.
 */
export async function runMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG) === 'done') return

  const legacyDb = new LegacyClinicDatabase()

  try {
    const [patients, visits, visitMeds, drugs, settings, recents] = await Promise.all([
      legacyDb.patients.toArray(),
      legacyDb.visits.toArray(),
      legacyDb.visitMedications.toArray(),
      legacyDb.drugs.toArray(),
      legacyDb.settings.toArray(),
      legacyDb.recentPatients.toArray(),
    ])

    const docs: PouchDB.Core.PutDocument<object>[] = [
      ...patients.map(p => ({ ...p, _id: `patient:${p.id}`, type: 'patient' as const })),
      ...visits.map(v => ({ ...v, _id: `visit:${v.id}`, type: 'visit' as const })),
      ...visitMeds.map(m => ({ ...m, _id: `visitmed:${m.id}`, type: 'visitmed' as const })),
      ...drugs.map(d => ({ ...d, _id: `drug:${d.id}`, type: 'drug' as const })),
      ...settings.map(s => ({ ...s, _id: `settings:${s.key}`, type: 'settings' as const })),
      ...recents.map(r => ({ ...r, _id: `recent:${r.id}`, type: 'recent' as const })),
    ]

    if (docs.length > 0) {
      const results = await pouchDb.bulkDocs(docs)

      const fatalErrors = results.filter(
        r => 'error' in r && (r as PouchDB.Core.Error).error !== 'conflict'
      )
      if (fatalErrors.length > 0) {
        throw new Error(
          `Migration failed with ${fatalErrors.length} non-conflict error(s): ${JSON.stringify(fatalErrors[0])}`
        )
      }
    }

    localStorage.setItem(MIGRATION_FLAG, 'done')
  } finally {
    legacyDb.close()
  }
}
