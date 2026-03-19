import { pouchDb } from '@/db/pouchdb'

declare const __APP_VERSION__: string

// v2 = PouchDB era. Distinguishes from old Dexie backups (schemaVersion 1-7).
const SCHEMA_VERSION = 2

// Map from old Dexie table names to new PouchDB type names
const LEGACY_TABLE_MAP: Record<string, string> = {
  patients: 'patient',
  visits: 'visit',
  visitMedications: 'visitmed',
  drugs: 'drug',
  settings: 'settings',
  recentPatients: 'recent',
}

// Map from PouchDB type name to _id prefix
const TYPE_TO_PREFIX: Record<string, string> = {
  patient: 'patient',
  visit: 'visit',
  visitmed: 'visitmed',
  drug: 'drug',
  settings: 'settings',
  recent: 'recent',
}

export interface BackupMetadata {
  appName: string
  exportDate: string
  appVersion: string
  schemaVersion: number
  tables: Record<string, number>
}

export interface BackupFile {
  metadata: BackupMetadata
  data: Record<string, unknown[]>
}

export type ValidationResult =
  | { valid: true; metadata: BackupMetadata }
  | { valid: false; error: 'invalid_format' | 'newer_schema' }

export async function exportDatabase(): Promise<BackupFile> {
  const result = await pouchDb.allDocs({ include_docs: true })
  const data: Record<string, unknown[]> = {}
  const tables: Record<string, number> = {}

  for (const row of result.rows) {
    if (!row.doc || row.id.startsWith('_design/')) continue
    const doc = row.doc as Record<string, unknown>
    const typeName = doc.type as string
    if (!typeName) continue

    // Strip PouchDB internal fields for clean export
    const { _id, _rev, type, ...cleanDoc } = doc
    void _id; void _rev; void type
    if (!data[typeName]) data[typeName] = []
    data[typeName].push(cleanDoc)
  }

  // Count per type
  for (const [typeName, docs] of Object.entries(data)) {
    tables[typeName] = docs.length
  }

  return {
    metadata: {
      appName: 'ClinicSoftware',
      exportDate: new Date().toISOString(),
      appVersion: __APP_VERSION__,
      schemaVersion: SCHEMA_VERSION,
      tables,
    },
    data,
  }
}

export function downloadBackup(backup: BackupFile): string {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const filename = `ClinicSoftware-backup-${dateStr}-${hours}-${minutes}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)

  return filename
}

export function validateBackupFile(data: unknown): ValidationResult {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'invalid_format' }
  }

  const obj = data as Record<string, unknown>

  if (
    !obj.metadata ||
    typeof obj.metadata !== 'object' ||
    Array.isArray(obj.metadata)
  ) {
    return { valid: false, error: 'invalid_format' }
  }

  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { valid: false, error: 'invalid_format' }
  }

  const metadata = obj.metadata as Record<string, unknown>

  if (metadata.appName !== 'ClinicSoftware') {
    return { valid: false, error: 'invalid_format' }
  }

  if (typeof metadata.schemaVersion !== 'number') {
    return { valid: false, error: 'invalid_format' }
  }

  if (typeof metadata.exportDate !== 'string') {
    return { valid: false, error: 'invalid_format' }
  }

  if (metadata.schemaVersion > SCHEMA_VERSION) {
    return { valid: false, error: 'newer_schema' }
  }

  return {
    valid: true,
    metadata: metadata as unknown as BackupMetadata,
  }
}

export async function restoreDatabase(backup: BackupFile): Promise<void> {
  // 1. Delete all existing docs
  const existing = await pouchDb.allDocs()
  const deletes = existing.rows
    .filter(r => !r.id.startsWith('_design/'))
    .map(r => ({ _id: r.id, _rev: r.value.rev, _deleted: true as const }))
  if (deletes.length > 0) {
    await pouchDb.bulkDocs(deletes)
  }

  // 2. Determine if this is an old Dexie backup (schemaVersion <= 1) or new PouchDB backup
  const isLegacyBackup = backup.metadata.schemaVersion <= 1

  // 3. Insert backup data with prefixed _ids
  const allDocs: Record<string, unknown>[] = []

  for (const [tableName, rows] of Object.entries(backup.data)) {
    // Map table name to type name
    const typeName = isLegacyBackup
      ? (LEGACY_TABLE_MAP[tableName] ?? tableName)
      : tableName

    const prefix = TYPE_TO_PREFIX[typeName] ?? typeName

    for (const row of rows as Record<string, unknown>[]) {
      // Determine the id field to use for _id construction
      const idField = typeName === 'settings' ? (row.key as string) : (row.id as string)
      if (!idField) continue

      allDocs.push({
        ...row,
        _id: `${prefix}:${idField}`,
        type: typeName,
      })
    }
  }

  if (allDocs.length > 0) {
    const results = await pouchDb.bulkDocs(allDocs)
    const errors = results.filter(r => 'error' in r && (r as PouchDB.Core.Error).error)
    if (errors.length > 0) {
      throw new Error(`Restore failed with ${errors.length} error(s): ${JSON.stringify(errors[0])}`)
    }
  }
}
