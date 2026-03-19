import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from '@/pages/SettingsPage'

// Mock auth context
vi.mock('@/auth/AuthProvider', () => ({
  useAuthContext: () => ({
    regenerateRecoveryCode: vi.fn(),
    checkRecoveryCodeExists: vi.fn().mockResolvedValue(false),
  }),
}))

// Mock ChangePassword to simplify rendering
vi.mock('@/auth/ChangePassword', () => ({
  ChangePassword: () => <div>ChangePassword</div>,
}))

// Mock DrugManagement
vi.mock('@/components/DrugManagement', () => ({
  DrugManagement: () => <div>DrugManagement</div>,
}))

// Mock ClinicInfoSettings
vi.mock('@/components/ClinicInfoSettings', () => ({
  ClinicInfoSettings: () => <div>ClinicInfoSettings</div>,
}))

// Mock DataSettings
vi.mock('@/components/DataSettings', () => ({
  DataSettings: () => <div>DataSettings</div>,
}))

// Mock print settings DB functions
const mockGetPrintSettings = vi.fn()
const mockSavePrintSetting = vi.fn()
const mockSaveAutoPrint = vi.fn()
vi.mock('@/db/printSettings', () => ({
  getPrintSettings: (...args: unknown[]) => mockGetPrintSettings(...args),
  savePrintSetting: (...args: unknown[]) => mockSavePrintSetting(...args),
  saveAutoPrint: (...args: unknown[]) => mockSaveAutoPrint(...args),
  PAPER_SIZE_ORDER: ['A5', 'A4', 'Letter'],
  PAPER_SIZES: {
    A5: { width: 148, height: 210, label: 'A5 (148 x 210 mm)' },
    A4: { width: 210, height: 297, label: 'A4 (210 x 297 mm)' },
    Letter: { width: 216, height: 279, label: 'Letter (216 x 279 mm)' },
  },
}))

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  )
}

describe('SettingsPage - Print tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPrintSettings.mockResolvedValue({ prescriptionSize: 'A5', dispensarySize: 'A5', autoPrint: true })
    mockSavePrintSetting.mockResolvedValue(undefined)
    mockSaveAutoPrint.mockResolvedValue(undefined)
  })

  it('renders a Print pill tab button', () => {
    renderSettings()
    expect(screen.getByRole('button', { name: /^print$/i })).toBeInTheDocument()
  })

  it('clicking Print tab shows PrintSettings component', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('button', { name: /^print$/i }))

    await waitFor(() => {
      expect(screen.getByText(/set paper sizes for each slip type/i)).toBeInTheDocument()
    })
  })
})

describe('PrintSettings component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPrintSettings.mockResolvedValue({ prescriptionSize: 'A5', dispensarySize: 'A5', autoPrint: true })
    mockSavePrintSetting.mockResolvedValue(undefined)
    mockSaveAutoPrint.mockResolvedValue(undefined)
  })

  async function openPrintTab() {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: /^print$/i }))
    return user
  }

  it('shows heading "Print"', async () => {
    await openPrintTab()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^print$/i })).toBeInTheDocument()
    })
  })

  it('shows subtitle about paper sizes', async () => {
    await openPrintTab()
    await waitFor(() => {
      expect(
        screen.getByText(/set paper sizes for each slip type\. changes apply to all future prints\./i)
      ).toBeInTheDocument()
    })
  })

  it('shows Prescription Slip card', async () => {
    await openPrintTab()
    await waitFor(() => {
      expect(screen.getByText('Prescription Slip')).toBeInTheDocument()
    })
  })

  it('shows Dispensary Slip card', async () => {
    await openPrintTab()
    await waitFor(() => {
      expect(screen.getByText('Dispensary Slip')).toBeInTheDocument()
    })
  })

  it('prescription dropdown defaults to A5', async () => {
    await openPrintTab()
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox')
      expect((selects[0] as HTMLSelectElement).value).toBe('A5')
    })
  })

  it('dispensary dropdown defaults to A5', async () => {
    await openPrintTab()
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox')
      expect((selects[1] as HTMLSelectElement).value).toBe('A5')
    })
  })

  it('each dropdown shows 3 options (A6 removed)', async () => {
    await openPrintTab()
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox')
      expect(selects[0].querySelectorAll('option')).toHaveLength(3)
      expect(selects[1].querySelectorAll('option')).toHaveLength(3)
    })
  })

  it('dropdown does not show A6 option', async () => {
    await openPrintTab()
    await waitFor(() => {
      expect(screen.queryAllByRole('option', { name: 'A6 (105 x 148 mm)' })).toHaveLength(0)
    })
  })

  it('changing prescription dropdown saves to DB', async () => {
    const user = await openPrintTab()
    await waitFor(() => screen.getAllByRole('combobox'))

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'A4')

    await waitFor(() => {
      expect(mockSavePrintSetting).toHaveBeenCalledWith('printPrescriptionSize', 'A4')
    })
  })

  it('changing dispensary dropdown saves independently', async () => {
    const user = await openPrintTab()
    await waitFor(() => screen.getAllByRole('combobox'))

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[1], 'Letter')

    await waitFor(() => {
      expect(mockSavePrintSetting).toHaveBeenCalledWith('printDispensarySize', 'Letter')
    })
  })

  it('no Save button present (auto-save on change)', async () => {
    await openPrintTab()
    await waitFor(() => screen.getAllByRole('combobox'))

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
  })

  it('shows Auto-Print on Save toggle card', async () => {
    await openPrintTab()
    await waitFor(() => {
      expect(screen.getByText('Auto-Print on Save')).toBeInTheDocument()
    })
  })

  it('auto-print toggle is on by default', async () => {
    await openPrintTab()
    await waitFor(() => {
      const toggle = screen.getByRole('switch', { name: /auto-print on save/i })
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })
  })

  it('clicking auto-print toggle calls saveAutoPrint(false)', async () => {
    const user = await openPrintTab()
    await waitFor(() => screen.getByRole('switch', { name: /auto-print on save/i }))

    const toggle = screen.getByRole('switch', { name: /auto-print on save/i })
    await user.click(toggle)

    await waitFor(() => {
      expect(mockSaveAutoPrint).toHaveBeenCalledWith(false)
    })
  })

  it('clicking auto-print toggle twice calls saveAutoPrint(true)', async () => {
    const user = await openPrintTab()
    await waitFor(() => screen.getByRole('switch', { name: /auto-print on save/i }))

    const toggle = screen.getByRole('switch', { name: /auto-print on save/i })
    await user.click(toggle)
    await user.click(toggle)

    await waitFor(() => {
      expect(mockSaveAutoPrint).toHaveBeenLastCalledWith(true)
    })
  })
})
