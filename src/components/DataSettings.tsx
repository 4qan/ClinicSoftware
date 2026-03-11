import { useState, useEffect, useRef } from 'react'
import { db } from '@/db/index'
import {
  exportDatabase,
  downloadBackup,
  validateBackupFile,
  restoreDatabase,
} from '@/utils/backup'
import type { BackupFile } from '@/utils/backup'
import { listSnapshots, formatTimeAgo } from '@/utils/snapshots'
import type { Snapshot } from '@/utils/snapshots'
import { useToast } from '@/components/ToastProvider'

function formatBackupDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function DataSettings() {
  const [isExporting, setIsExporting] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [autoBackupDate, setAutoBackupDate] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null)
  const [pendingSnapshot, setPendingSnapshot] = useState<Snapshot | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    db.settings.get('lastBackupDate').then((entry) => {
      if (entry) {
        setLastBackup(entry.value as string)
      }
    })

    db.settings.get('lastAutoSnapshotDate').then((entry) => {
      if (entry) {
        setAutoBackupDate(entry.value as string)
      }
    })

    listSnapshots().then(setSnapshots)
  }, [])

  async function handleExport() {
    setIsExporting(true)
    try {
      const backup = await exportDatabase()
      const filename = downloadBackup(backup)

      const now = new Date().toISOString()
      await db.settings.put({ key: 'lastBackupDate', value: now })
      await db.settings.put({ key: 'lastAutoSnapshotDate', value: now })
      setLastBackup(now)
      setAutoBackupDate(now)

      const patients = backup.metadata.tables.patients ?? 0
      const visits = backup.metadata.tables.visits ?? 0
      showToast('success', `Backup saved: ${filename} (${patients} patients, ${visits} visits)`)
    } catch {
      showToast('error', 'Backup failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear any pending snapshot when selecting a file
    setPendingSnapshot(null)

    try {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        setRestoreError('This file is not a valid backup. Please select a ClinicSoftware backup file.')
        showToast('error', 'This file is not a valid backup. Please select a ClinicSoftware backup file.')
        setPendingBackup(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      const result = validateBackupFile(parsed)

      if (!result.valid) {
        if (result.error === 'newer_schema') {
          setRestoreError('This backup is from a newer version. Please update the app first.')
          showToast('error', 'This backup is from a newer version. Please update the app first.')
        } else {
          setRestoreError('This file is not a valid backup. Please select a ClinicSoftware backup file.')
          showToast('error', 'This file is not a valid backup. Please select a ClinicSoftware backup file.')
        }
        setPendingBackup(null)
      } else {
        setPendingBackup(parsed as BackupFile)
        setRestoreError(null)
      }
    } catch {
      setRestoreError('This file is not a valid backup. Please select a ClinicSoftware backup file.')
      showToast('error', 'This file is not a valid backup. Please select a ClinicSoftware backup file.')
      setPendingBackup(null)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRestore() {
    if (!pendingBackup) return

    setIsRestoring(true)
    try {
      // Read current auth hash before restore
      const currentAuthEntry = await db.settings.get('auth')
      const currentHash = currentAuthEntry
        ? (currentAuthEntry.value as { hash: string })?.hash
        : null

      await restoreDatabase(pendingBackup)

      // Read new auth hash after restore
      const newAuthEntry = await db.settings.get('auth')
      const newHash = newAuthEntry
        ? (newAuthEntry.value as { hash: string })?.hash
        : null

      // Smart re-login: clear session if auth hash changed or was removed
      if (currentHash !== newHash) {
        localStorage.removeItem('clinic_auth_session')
      }

      showToast('success', `Data restored from ${formatBackupDate(pendingBackup.metadata.exportDate)} backup`)
      setPendingBackup(null)

      setTimeout(() => {
        window.location.reload()
      }, 400)
    } catch {
      showToast('error', 'Restore failed. Your previous data is unchanged. Please try again.')
      setPendingBackup(null)
    } finally {
      setIsRestoring(false)
    }
  }

  async function handleSnapshotRestore() {
    if (!pendingSnapshot) return

    setIsRestoring(true)
    try {
      // Read current auth hash before restore
      const currentAuthEntry = await db.settings.get('auth')
      const currentHash = currentAuthEntry
        ? (currentAuthEntry.value as { hash: string })?.hash
        : null

      await restoreDatabase(pendingSnapshot.data)

      // Read new auth hash after restore
      const newAuthEntry = await db.settings.get('auth')
      const newHash = newAuthEntry
        ? (newAuthEntry.value as { hash: string })?.hash
        : null

      // Smart re-login: clear session if auth hash changed or was removed
      if (currentHash !== newHash) {
        localStorage.removeItem('clinic_auth_session')
      }

      // Reset auto-snapshot timer after restore
      const now = new Date().toISOString()
      await db.settings.put({ key: 'lastAutoSnapshotDate', value: now })

      showToast('success', `Data restored from ${formatBackupDate(pendingSnapshot.createdAt)} auto-backup`)
      setPendingSnapshot(null)

      setTimeout(() => {
        window.location.reload()
      }, 400)
    } catch {
      showToast('error', 'Restore failed. Your previous data is unchanged. Please try again.')
      setPendingSnapshot(null)
    } finally {
      setIsRestoring(false)
    }
  }

  function handleSelectSnapshot(snapshot: Snapshot) {
    setPendingSnapshot(snapshot)
    setPendingBackup(null)
    setRestoreError(null)
  }

  function handleCancel() {
    setPendingBackup(null)
    setPendingSnapshot(null)
    setRestoreError(null)
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
        Last backup: {lastBackup ? formatBackupDate(lastBackup) : 'Never'}
      </p>
      <p className="text-sm text-gray-500">
        Auto-backup: {autoBackupDate ? formatTimeAgo(autoBackupDate) : 'Never'}
      </p>

      {/* Restore Section */}
      <div className="border-t border-gray-200 mt-5 pt-5">
        <h4 className="text-base font-semibold text-gray-900 mb-1">Restore from Backup</h4>
        <p className="text-sm text-gray-600 mb-3">
          Select a backup file to restore your clinic data.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRestoring}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg cursor-pointer border border-gray-300"
        >
          Select Backup File
        </button>

        {restoreError && (
          <p className="mt-2 text-sm text-red-600">{restoreError}</p>
        )}

        {pendingBackup && (
          <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-gray-800">
              Backup from <span className="font-medium">{formatBackupDate(pendingBackup.metadata.exportDate)}</span>
            </p>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              This will replace all your current data.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                Restore
              </button>
            </div>
          </div>
        )}

        {pendingSnapshot && (
          <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-gray-800">
              Auto-backup from <span className="font-medium">{formatBackupDate(pendingSnapshot.createdAt)}</span>
            </p>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              This will replace all your current data.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSnapshotRestore}
                disabled={isRestoring}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                Restore
              </button>
            </div>
          </div>
        )}

        {isRestoring && (
          <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-pulse w-full" />
          </div>
        )}

        {snapshots.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Or restore from auto-backup</h5>
            <div className="space-y-1.5">
              {snapshots.map((snapshot) => (
                <button
                  key={snapshot.id}
                  type="button"
                  onClick={() => handleSelectSnapshot(snapshot)}
                  disabled={isRestoring}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 rounded-lg border border-gray-200 cursor-pointer"
                >
                  {formatBackupDate(snapshot.createdAt)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
