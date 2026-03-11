import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataSettings } from '@/components/DataSettings'
import type { BackupFile } from '@/utils/backup'

// Mock backup utilities
const mockExportDatabase = vi.fn()
const mockDownloadBackup = vi.fn()
const mockValidateBackupFile = vi.fn()
const mockRestoreDatabase = vi.fn()
vi.mock('@/utils/backup', () => ({
  exportDatabase: (...args: unknown[]) => mockExportDatabase(...args),
  downloadBackup: (...args: unknown[]) => mockDownloadBackup(...args),
  validateBackupFile: (...args: unknown[]) => mockValidateBackupFile(...args),
  restoreDatabase: (...args: unknown[]) => mockRestoreDatabase(...args),
}))

// Mock useToast
const mockShowToast = vi.fn()
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

// Mock db.settings
const mockSettingsGet = vi.fn()
const mockSettingsPut = vi.fn()
vi.mock('@/db/index', () => ({
  db: {
    settings: {
      get: (...args: unknown[]) => mockSettingsGet(...args),
      put: (...args: unknown[]) => mockSettingsPut(...args),
    },
  },
}))

const fakeBackup: BackupFile = {
  metadata: {
    appName: 'ClinicSoftware',
    exportDate: '2026-03-10T12:00:00.000Z',
    appVersion: '1.1.0',
    schemaVersion: 4,
    tables: { patients: 12, visits: 45, drugs: 100, settings: 3, recentPatients: 5, visitMedications: 80 },
  },
  data: {
    patients: [],
    visits: [],
    drugs: [],
    settings: [],
    recentPatients: [],
    visitMedications: [],
  },
}

describe('DataSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettingsGet.mockResolvedValue(undefined)
    mockExportDatabase.mockResolvedValue(fakeBackup)
    mockDownloadBackup.mockReturnValue('ClinicSoftware-backup-2026-03-10.json')
  })

  it('renders export button', () => {
    render(<DataSettings />)
    expect(screen.getByRole('button', { name: /export backup/i })).toBeInTheDocument()
  })

  it('shows "Last backup: Never" initially', async () => {
    render(<DataSettings />)
    await waitFor(() => {
      expect(screen.getByText(/last backup: never/i)).toBeInTheDocument()
    })
  })

  it('shows Backup & Restore heading', () => {
    render(<DataSettings />)
    expect(screen.getByText('Backup & Restore')).toBeInTheDocument()
  })

  it('calls exportDatabase and downloadBackup on click', async () => {
    const user = userEvent.setup()
    render(<DataSettings />)

    await user.click(screen.getByRole('button', { name: /export backup/i }))

    await waitFor(() => {
      expect(mockExportDatabase).toHaveBeenCalledOnce()
      expect(mockDownloadBackup).toHaveBeenCalledWith(fakeBackup)
    })
  })

  it('shows success toast with filename and counts', async () => {
    const user = userEvent.setup()
    render(<DataSettings />)

    await user.click(screen.getByRole('button', { name: /export backup/i }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('ClinicSoftware-backup-2026-03-10.json')
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('12 patients')
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('45 visits')
      )
    })
  })

  it('shows error toast on failure', async () => {
    mockExportDatabase.mockRejectedValue(new Error('DB error'))
    const user = userEvent.setup()
    render(<DataSettings />)

    await user.click(screen.getByRole('button', { name: /export backup/i }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Backup failed. Please try again.')
    })
  })

  it('disables button during export', async () => {
    // Make export hang until we resolve it
    let resolveExport!: (value: BackupFile) => void
    mockExportDatabase.mockReturnValue(
      new Promise<BackupFile>((resolve) => {
        resolveExport = resolve
      })
    )

    const user = userEvent.setup()
    render(<DataSettings />)

    const button = screen.getByRole('button', { name: /export backup/i })
    await user.click(button)

    // Button should be disabled during export
    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled()

    // Resolve the export
    resolveExport(fakeBackup)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export backup/i })).toBeEnabled()
    })
  })

  it('persists last backup date to settings table', async () => {
    const user = userEvent.setup()
    render(<DataSettings />)

    await user.click(screen.getByRole('button', { name: /export backup/i }))

    await waitFor(() => {
      expect(mockSettingsPut).toHaveBeenCalledWith({
        key: 'lastBackupDate',
        value: expect.any(String),
      })
    })
  })

  it('shows persisted last backup date on mount', async () => {
    mockSettingsGet.mockResolvedValue({
      key: 'lastBackupDate',
      value: '2026-03-09T15:30:00.000Z',
    })

    render(<DataSettings />)

    await waitFor(() => {
      expect(screen.getByText(/last backup:/i)).toBeInTheDocument()
      expect(screen.queryByText(/never/i)).not.toBeInTheDocument()
    })
  })

  // === Restore UI Tests ===

  it('renders "Restore from Backup" heading and "Select Backup File" button', () => {
    render(<DataSettings />)
    expect(screen.getByText('Restore from Backup')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select backup file/i })).toBeInTheDocument()
  })

  it('valid file selection shows confirmation with backup date and warning text', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: true,
      metadata: fakeBackup.metadata,
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify(fakeBackup)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/this will replace all your current data/i)).toBeInTheDocument()
    })
  })

  it('Cancel button in confirmation returns to idle (hides confirmation)', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: true,
      metadata: fakeBackup.metadata,
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify(fakeBackup)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/this will replace all your current data/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText(/this will replace all your current data/i)).not.toBeInTheDocument()
    })
  })

  it('invalid file shows inline error text and calls showToast with error message', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: false,
      error: 'invalid_format',
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify({ random: true })], 'bad.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/this file is not a valid backup/i)).toBeInTheDocument()
      expect(mockShowToast).toHaveBeenCalledWith(
        'error',
        'This file is not a valid backup. Please select a ClinicSoftware backup file.'
      )
    })
  })

  it('newer schema file shows error toast with "newer version" message', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: false,
      error: 'newer_schema',
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify(fakeBackup)], 'newer.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/this backup is from a newer version/i)).toBeInTheDocument()
      expect(mockShowToast).toHaveBeenCalledWith(
        'error',
        'This backup is from a newer version. Please update the app first.'
      )
    })
  })

  it('clicking Restore button calls restoreDatabase and shows success toast', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: true,
      metadata: fakeBackup.metadata,
    })
    mockRestoreDatabase.mockResolvedValue(undefined)
    // Mock db.settings.get for auth hash check (called during restore)
    mockSettingsGet.mockImplementation((key: string) => {
      if (key === 'auth') return Promise.resolve({ key: 'auth', value: { hash: 'abc', salt: 'xyz' } })
      return Promise.resolve(undefined)
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify(fakeBackup)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^restore$/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^restore$/i }))

    await waitFor(() => {
      expect(mockRestoreDatabase).toHaveBeenCalledWith(fakeBackup)
      expect(mockShowToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('Data restored from')
      )
    })
  })

  it('restore failure shows error toast with exact message', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: true,
      metadata: fakeBackup.metadata,
    })
    mockRestoreDatabase.mockRejectedValue(new Error('DB write failed'))
    mockSettingsGet.mockImplementation((key: string) => {
      if (key === 'auth') return Promise.resolve(undefined)
      return Promise.resolve(undefined)
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify(fakeBackup)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^restore$/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^restore$/i }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'error',
        'Restore failed. Your previous data is unchanged. Please try again.'
      )
    })
  })

  it('Restore button is styled with red/destructive classes', async () => {
    mockValidateBackupFile.mockReturnValue({
      valid: true,
      metadata: fakeBackup.metadata,
    })

    const user = userEvent.setup()
    render(<DataSettings />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify(fakeBackup)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      const restoreBtn = screen.getByRole('button', { name: /^restore$/i })
      expect(restoreBtn.className).toMatch(/bg-red-600/)
    })
  })
})
