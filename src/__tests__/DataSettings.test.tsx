import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataSettings } from '@/components/DataSettings'
import type { BackupFile } from '@/utils/backup'

// Mock backup utilities
const mockExportDatabase = vi.fn()
const mockDownloadBackup = vi.fn()
vi.mock('@/utils/backup', () => ({
  exportDatabase: (...args: unknown[]) => mockExportDatabase(...args),
  downloadBackup: (...args: unknown[]) => mockDownloadBackup(...args),
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
})
