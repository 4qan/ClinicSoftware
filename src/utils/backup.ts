import { db } from '@/db/index'

declare const __APP_VERSION__: string

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
  const data: Record<string, unknown[]> = {}
  const tables: Record<string, number> = {}

  for (const table of db.tables) {
    const rows = await table.toArray()
    data[table.name] = rows
    tables[table.name] = rows.length
  }

  return {
    metadata: {
      appName: 'ClinicSoftware',
      exportDate: new Date().toISOString(),
      appVersion: __APP_VERSION__,
      schemaVersion: db.verno,
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

  if (metadata.schemaVersion > db.verno) {
    return { valid: false, error: 'newer_schema' }
  }

  return {
    valid: true,
    metadata: metadata as unknown as BackupMetadata,
  }
}

export async function restoreDatabase(backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    // Clear all tables
    for (const table of db.tables) {
      await table.clear()
    }

    // Repopulate from backup data
    for (const table of db.tables) {
      const rows = backup.data[table.name]
      if (rows && rows.length > 0) {
        await table.bulkPut(rows)
      }
    }
  })
}
