import { useState, useEffect } from 'react'
import { db } from '@/db/index'
import { exportDatabase, downloadBackup } from '@/utils/backup'
import { useToast } from '@/components/ToastProvider'

export function DataSettings() {
  const [isExporting, setIsExporting] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    db.settings.get('lastBackupDate').then((entry) => {
      if (entry) {
        setLastBackup(entry.value as string)
      }
    })
  }, [])

  async function handleExport() {
    setIsExporting(true)
    try {
      const backup = await exportDatabase()
      const filename = downloadBackup(backup)

      const now = new Date().toISOString()
      await db.settings.put({ key: 'lastBackupDate', value: now })
      setLastBackup(now)

      const patients = backup.metadata.tables.patients ?? 0
      const visits = backup.metadata.tables.visits ?? 0
      showToast('success', `Backup saved: ${filename} (${patients} patients, ${visits} visits)`)
    } catch {
      showToast('error', 'Backup failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  function formatLastBackup(): string {
    if (!lastBackup) return 'Never'
    return new Date(lastBackup).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Backup & Restore</h3>
      <p className="text-sm text-gray-600 mb-4">
        Export your clinic data to a backup file. You can restore from this file if you ever need to recover your data.
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer"
      >
        {isExporting ? 'Exporting...' : 'Export Backup'}
      </button>

      {isExporting && (
        <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-full" />
        </div>
      )}

      <p className="mt-3 text-sm text-gray-500">
        Last backup: {formatLastBackup()}
      </p>
    </div>
  )
}
