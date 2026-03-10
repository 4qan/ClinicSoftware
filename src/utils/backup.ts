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

  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `ClinicSoftware-backup-${dateStr}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)

  return filename
}
