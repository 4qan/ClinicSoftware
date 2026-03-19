import { useState, useRef, useEffect } from 'react'
import { ComboBox } from './ComboBox'
import { useDrugSearch } from '@/hooks/useDrugSearch'
import { useAutocompleteKeyboard } from '@/hooks/useAutocompleteKeyboard'
import { QUANTITY_OPTIONS, FREQUENCY_OPTIONS, DURATION_OPTIONS, MEDICATION_FORMS, FORM_TO_CATEGORY } from '@/constants/clinical'
import { formatDrugSearchResult, formatDrugSelected } from '@/utils/drugFormatters'
import type { Drug } from '@/db/index'

export interface MedicationFormData {
  drugId?: string
  brandName: string
  saltName: string
  form: string
  strength: string
  quantity: string
  frequency: string
  duration: string
  slipType: 'dispensary' | 'prescription'
}

interface MedicationEntryProps {
  onAdd: (medication: MedicationFormData) => void
}

const emptyForm: MedicationFormData = {
  brandName: '',
  saltName: '',
  form: '',
  strength: '',
  quantity: '',
  frequency: '',
  duration: '',
  slipType: 'dispensary',
}

export function MedicationEntry({ onAdd }: MedicationEntryProps) {
  const [form, setForm] = useState<MedicationFormData>(emptyForm)
  const [drugQuery, setDrugQuery] = useState('')
  const [showDrugDropdown, setShowDrugDropdown] = useState(false)
  const drugRef = useRef<HTMLDivElement>(null)
  const drugInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)
  const formInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Pending focus flags
  const [pendingFocusAfterDrug, setPendingFocusAfterDrug] = useState<'quantity' | 'form' | null>(null)
  const [pendingFocusDrugInput, setPendingFocusDrugInput] = useState(false)

  const { results: drugResults, isSearching } = useDrugSearch(drugQuery)

  // Click-outside closes drug dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drugRef.current && !drugRef.current.contains(e.target as Node)) {
        setShowDrugDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus after drug selection
  useEffect(() => {
    if (!pendingFocusAfterDrug) return
    if (pendingFocusAfterDrug === 'quantity' && quantityInputRef.current) {
      quantityInputRef.current.focus()
    } else if (pendingFocusAfterDrug === 'form' && formInputRef.current) {
      formInputRef.current.focus()
    }
    setPendingFocusAfterDrug(null)
  }, [pendingFocusAfterDrug])

  // Focus after medication add
  useEffect(() => {
    if (!pendingFocusDrugInput) return
    drugInputRef.current?.focus()
    setPendingFocusDrugInput(false)
  }, [pendingFocusDrugInput])

  function handleDrugQueryChange(value: string) {
    setDrugQuery(value)
    setForm((f) => ({ ...f, brandName: value, saltName: '', form: '', strength: '', drugId: undefined }))
    setShowDrugDropdown(true)
    setDrugHighlightIndex(-1)
  }

  function handleSelectDrug(drug: Drug) {
    setDrugQuery(formatDrugSelected(drug))
    setForm((f) => ({
      ...f,
      drugId: drug.id,
      brandName: drug.brandName,
      saltName: drug.saltName,
      form: drug.form,
      strength: drug.strength,
    }))
    setShowDrugDropdown(false)
    // Schedule focus transition
    setPendingFocusAfterDrug(drug.id ? 'quantity' : 'form')
  }

  const {
    highlightIndex: drugHighlightIndex,
    setHighlightIndex: setDrugHighlightIndex,
    handleKeyDown: handleDrugKeyDown,
  } = useAutocompleteKeyboard<Drug>({
    items: drugResults,
    isOpen: showDrugDropdown,
    onSelect: handleSelectDrug,
    onClose: () => setShowDrugDropdown(false),
    onOpen: () => setShowDrugDropdown(true),
  })

  // ScrollIntoView for highlighted drug items
  useEffect(() => {
    if (drugHighlightIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[drugHighlightIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [drugHighlightIndex])

  // Whether the drug was selected from DB (form is inferred)
  const hasDbDrug = !!form.drugId

  // Quantity options based on current form
  const category = FORM_TO_CATEGORY[form.form] ?? 'oral'
  const quantityOptions = QUANTITY_OPTIONS[category] ?? QUANTITY_OPTIONS.oral

  const isValid =
    form.brandName.trim() !== '' &&
    form.form.trim() !== '' &&
    form.quantity.trim() !== '' &&
    form.frequency.trim() !== '' &&
    form.duration.trim() !== ''

  function handleAdd() {
    if (!isValid) return
    onAdd(form)
    setForm(emptyForm)
    setDrugQuery('')
    setPendingFocusDrugInput(true)
  }

  function handleWrapperKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault()
      handleAdd()
    }
  }

  // Drug input keydown: hook handles arrow/enter/escape/tab.
  // When dropdown is closed, Enter should bubble up to wrapper for add-medication.
  // The hook's Enter handler calls e.preventDefault() and returns early when isOpen=false,
  // so the wrapper's handleWrapperKeyDown will also fire for Enter with closed dropdown.
  // We need to prevent double-fire: only the wrapper fires for Enter when dropdown is closed.
  function handleDrugInputKeyDown(e: React.KeyboardEvent) {
    handleDrugKeyDown(e)
    // If drug dropdown is open and Enter was handled (drug selected), stop propagation
    // so the wrapper doesn't also try to add medication.
    if (e.key === 'Enter' && showDrugDropdown && drugResults.length > 0) {
      e.stopPropagation()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end" onKeyDown={handleWrapperKeyDown}>
      {/* Drug Name with autocomplete */}
      <div className="md:col-span-1 relative" ref={drugRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
        <input
          ref={drugInputRef}
          type="text"
          value={drugQuery}
          onChange={(e) => handleDrugQueryChange(e.target.value)}
          onFocus={() => drugQuery.trim().length >= 1 && setShowDrugDropdown(true)}
          onKeyDown={handleDrugInputKeyDown}
          placeholder="Type drug name..."
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
          style={{ minHeight: '44px' }}
          autoComplete="off"
        />
        {showDrugDropdown && drugQuery.trim().length >= 1 && (
          <div
            data-testid="drug-dropdown"
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
            ) : drugResults.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                No drugs found. You can type a custom name.
              </div>
            ) : (
              <div ref={dropdownRef}>
                {drugResults.map((drug, idx) => (
                  <button
                    key={drug.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectDrug(drug)
                    }}
                    onMouseEnter={() => setDrugHighlightIndex(idx)}
                    className={`w-full px-3 py-2 text-left text-sm border-b border-gray-100 last:border-b-0 ${
                      idx === drugHighlightIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {formatDrugSearchResult(drug)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form - read-only when inferred from drug DB, editable for custom drugs */}
      {hasDbDrug ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
          <div
            className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            style={{ minHeight: '44px', lineHeight: '24px' }}
          >
            {form.form || '—'}
          </div>
        </div>
      ) : (
        <ComboBox
          options={MEDICATION_FORMS}
          value={form.form}
          onChange={(v) => setForm((f) => ({ ...f, form: v, quantity: '' }))}
          placeholder="e.g., Tablet"
          label="Form"
          inputRef={formInputRef}
        />
      )}

      {/* Quantity (filtered by form) */}
      <ComboBox
        options={quantityOptions}
        value={form.quantity}
        onChange={(v) => setForm((f) => ({ ...f, quantity: v }))}
        placeholder={category === 'topical' ? 'e.g., Thin layer' : 'e.g., 1'}
        label="Qty"
        inputRef={quantityInputRef}
      />

      {/* Frequency */}
      <ComboBox
        options={FREQUENCY_OPTIONS}
        value={form.frequency}
        onChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
        placeholder="e.g., Twice daily"
        label="Frequency"
        showCustomIndicator
      />

      {/* Duration */}
      <ComboBox
        options={DURATION_OPTIONS}
        value={form.duration}
        onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
        placeholder="e.g., 5 days"
        label="Duration"
        showCustomIndicator
      />

      {/* Add Button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 invisible">Add</label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!isValid}
          className="w-full px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors"
          style={{ minHeight: '44px' }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
