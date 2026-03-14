import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatDrugSearchResult, formatDrugSelected } from '@/utils/drugFormatters'
import type { Drug } from '@/db/index'
import { MedicationEntry } from '@/components/MedicationEntry'

// ─── Mock useDrugSearch ────────────────────────────────────────────────────────
vi.mock('@/hooks/useDrugSearch', () => ({
  useDrugSearch: vi.fn(),
}))
import { useDrugSearch } from '@/hooks/useDrugSearch'
const mockUseDrugSearch = vi.mocked(useDrugSearch)

// ─── Shared fixture drugs ──────────────────────────────────────────────────────
const baseDrug = {
  brandNameLower: '',
  saltNameLower: '',
  isCustom: false,
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const mockDrug: Drug = {
  ...baseDrug,
  id: 'drug-1',
  brandName: 'Augmentin',
  brandNameLower: 'augmentin',
  saltName: 'Amoxicillin/Clavulanate',
  saltNameLower: 'amoxicillin/clavulanate',
  strength: '625mg',
  form: 'Tablet',
}

const minimalDrug: Drug = {
  ...baseDrug,
  id: 'drug-2',
  brandName: 'Panadol',
  brandNameLower: 'panadol',
  saltName: '',
  strength: '',
  form: '',
}

// ─── drugFormatters unit tests (pre-existing) ──────────────────────────────────
describe('drugFormatters', () => {
  describe('formatDrugSearchResult', () => {
    it('returns full detail string with brand + salt + strength + form', () => {
      expect(formatDrugSearchResult(mockDrug)).toBe(
        'Augmentin (Amoxicillin/Clavulanate 625mg Tablet)'
      )
    })

    it('returns brand name only when no details exist', () => {
      expect(formatDrugSearchResult(minimalDrug)).toBe('Panadol')
    })

    it('includes only available details', () => {
      const partial: Drug = {
        ...baseDrug,
        id: 'drug-3',
        brandName: 'Brufen',
        brandNameLower: 'brufen',
        saltName: 'Ibuprofen',
        saltNameLower: 'ibuprofen',
        strength: '',
        form: 'Tablet',
      }
      expect(formatDrugSearchResult(partial)).toBe('Brufen (Ibuprofen Tablet)')
    })
  })

  describe('formatDrugSelected', () => {
    it('returns brand name only', () => {
      expect(formatDrugSelected(mockDrug)).toBe('Augmentin')
    })

    it('returns brand name only even when all details exist', () => {
      expect(formatDrugSelected(mockDrug)).toBe('Augmentin')
    })
  })
})

// ─── MedicationEntry keyboard navigation tests ────────────────────────────────
describe('MedicationEntry keyboard navigation', () => {
  beforeEach(() => {
    // Default: no results, not searching
    mockUseDrugSearch.mockReturnValue({ results: [], isSearching: false })
  })

  function getDrugInput() {
    return screen.getByPlaceholderText('Type drug name...')
  }

  function getDropdownItems() {
    const dropdown = document.querySelector('[data-testid="drug-dropdown"]')
    return dropdown ? Array.from(dropdown.querySelectorAll('button')) : []
  }

  // ─── Arrow Down highlights first result ─────────────────────────────────────
  it('ArrowDown on drug input opens dropdown and highlights first drug result', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug, minimalDrug], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'aug')
    // Escape to close, then use ArrowDown to re-open from hook
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}')

    const items = getDropdownItems()
    expect(items.length).toBeGreaterThan(0)
    expect(items[0].className).toContain('bg-blue-50')
    if (items[1]) {
      expect(items[1].className).not.toContain('bg-blue-50')
    }
  })

  // ─── Escape closes dropdown, focus stays on drug input ─────────────────────
  it('Escape closes drug dropdown without blurring drug input', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'aug')
    // Dropdown should be open
    expect(document.querySelector('[data-testid="drug-dropdown"]')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(document.querySelector('[data-testid="drug-dropdown"]')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(drugInput)
  })

  // ─── Enter selects highlighted DB drug, Quantity input is focused ──────────
  it('Enter on highlighted DB drug moves focus to Quantity input', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'aug')
    await user.keyboard('{ArrowDown}') // highlight index 0
    await user.keyboard('{Enter}')     // select mockDrug (has drugId)

    // After DB drug select, focus should be on Quantity input (label "Qty")
    // The Quantity ComboBox input should be focused
    // We find it by looking at what's focused
    const qtyInputs = screen.getAllByRole('textbox')
    const qtyInput = qtyInputs.find(
      (el) => (el as HTMLInputElement).placeholder?.toLowerCase().includes('e.g., 1') ||
               (el as HTMLInputElement).placeholder?.toLowerCase().includes('thin layer')
    )
    expect(qtyInput).toBeDefined()
    expect(document.activeElement).toBe(qtyInput)
  })

  // ─── Tab with highlighted drug confirms selection ────────────────────────────
  it('Tab with highlighted DB drug confirms selection and moves focus to Quantity', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'aug')
    await user.keyboard('{ArrowDown}') // highlight index 0

    await user.keyboard('{Tab}') // confirm selection, advance focus

    // Drug input should show selected drug brand name
    expect((drugInput as HTMLInputElement).value).toBe('Augmentin')
  })

  // ─── Custom drug: focus moves to Form input ─────────────────────────────────
  it('after selecting custom drug (no results), Tab from drug input focuses Form ComboBox', async () => {
    const user = userEvent.setup()
    // No results -- user typed a custom name
    mockUseDrugSearch.mockReturnValue({ results: [], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'CustomDrug')
    // No dropdown items visible, pressing Tab should advance focus
    // First tab goes to next input which should be Form ComboBox
    await user.keyboard('{Tab}')

    // Form ComboBox input should be focused (placeholder "e.g., Tablet")
    const formInput = screen.getAllByRole('textbox').find(
      (el) => (el as HTMLInputElement).placeholder === 'e.g., Tablet'
    )
    expect(formInput).toBeDefined()
    expect(document.activeElement).toBe(formInput)
  })

  // ─── After add, focus returns to drug input ──────────────────────────────────
  it('pressing Enter with all valid fields calls onAdd and returns focus to drug input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug], isSearching: false })
    render(<MedicationEntry onAdd={onAdd} />)

    const drugInput = getDrugInput()
    // Select a DB drug first
    await user.type(drugInput, 'aug')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    // Now fill Quantity, Frequency, Duration directly using the textboxes
    // Find comboboxes by placeholder
    const inputs = screen.getAllByRole('textbox')

    const qtyInput = inputs.find(el => (el as HTMLInputElement).placeholder?.includes('e.g., 1'))
    const freqInput = inputs.find(el => (el as HTMLInputElement).placeholder?.includes('Twice daily'))
    const durInput = inputs.find(el => (el as HTMLInputElement).placeholder?.includes('5 days'))

    expect(qtyInput).toBeDefined()
    expect(freqInput).toBeDefined()
    expect(durInput).toBeDefined()

    await user.type(qtyInput!, '1')
    await user.keyboard('{Escape}')
    await user.type(freqInput!, 'Once daily')
    await user.keyboard('{Escape}')
    await user.type(durInput!, '5 days')
    await user.keyboard('{Escape}')

    // Press Enter from duration field to add medication
    await user.keyboard('{Enter}')

    expect(onAdd).toHaveBeenCalledOnce()
    // After add, drug input should be focused
    expect(document.activeElement).toBe(drugInput)
  })

  // ─── After clicking Add button, focus returns to drug input ──────────────────
  it('clicking Add button returns focus to drug input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug], isSearching: false })
    render(<MedicationEntry onAdd={onAdd} />)

    const drugInput = getDrugInput()
    // Select a DB drug
    await user.type(drugInput, 'aug')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    // Fill required fields
    const inputs = screen.getAllByRole('textbox')
    const qtyInput = inputs.find(el => (el as HTMLInputElement).placeholder?.includes('e.g., 1'))
    const freqInput = inputs.find(el => (el as HTMLInputElement).placeholder?.includes('Twice daily'))
    const durInput = inputs.find(el => (el as HTMLInputElement).placeholder?.includes('5 days'))

    await user.type(qtyInput!, '1')
    await user.keyboard('{Escape}')
    await user.type(freqInput!, 'Once daily')
    await user.keyboard('{Escape}')
    await user.type(durInput!, '5 days')
    await user.keyboard('{Escape}')

    // Click the Add button
    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    expect(onAdd).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(drugInput)
  })

  // ─── Drug dropdown visual output unchanged ────────────────────────────────────
  it('shows "Searching..." while isSearching is true', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [], isSearching: true })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'aug')

    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  it('shows "No drugs found. You can type a custom name." when results empty and not searching', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'zzz')

    expect(screen.getByText('No drugs found. You can type a custom name.')).toBeInTheDocument()
  })

  it('renders drug results using formatDrugSearchResult', async () => {
    const user = userEvent.setup()
    mockUseDrugSearch.mockReturnValue({ results: [mockDrug], isSearching: false })
    render(<MedicationEntry onAdd={vi.fn()} />)

    const drugInput = getDrugInput()
    await user.type(drugInput, 'aug')

    expect(
      screen.getByText(formatDrugSearchResult(mockDrug))
    ).toBeInTheDocument()
  })
})
