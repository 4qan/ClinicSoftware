import { useState, useRef, useEffect } from 'react'
import { ComboBox } from './ComboBox'
import { useDrugSearch } from '@/hooks/useDrugSearch'
import { DOSAGE_OPTIONS, FREQUENCY_OPTIONS, DURATION_OPTIONS } from '@/constants/clinical'
import type { Drug } from '@/db/index'

export interface MedicationFormData {
  drugId?: string
  brandName: string
  saltName: string
  form: string
  strength: string
  dosage: string
  frequency: string
  duration: string
}

interface MedicationEntryProps {
  onAdd: (medication: MedicationFormData) => void
}

const emptyForm: MedicationFormData = {
  brandName: '',
  saltName: '',
  form: '',
  strength: '',
  dosage: '',
  frequency: '',
  duration: '',
}

export function MedicationEntry({ onAdd }: MedicationEntryProps) {
  const [form, setForm] = useState<MedicationFormData>(emptyForm)
  const [drugQuery, setDrugQuery] = useState('')
  const [showDrugDropdown, setShowDrugDropdown] = useState(false)
  const drugRef = useRef<HTMLDivElement>(null)

  const { results: drugResults, isSearching } = useDrugSearch(drugQuery)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drugRef.current && !drugRef.current.contains(e.target as Node)) {
        setShowDrugDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleDrugQueryChange(value: string) {
    setDrugQuery(value)
    setForm((f) => ({ ...f, brandName: value, saltName: '', form: '', strength: '', drugId: undefined }))
    setShowDrugDropdown(true)
  }

  function handleSelectDrug(drug: Drug) {
    setDrugQuery(drug.brandName)
    setForm((f) => ({
      ...f,
      drugId: drug.id,
      brandName: drug.brandName,
      saltName: drug.saltName,
      form: drug.form,
      strength: drug.strength,
    }))
    setShowDrugDropdown(false)
  }

  const isValid =
    form.brandName.trim() !== '' &&
    form.dosage.trim() !== '' &&
    form.frequency.trim() !== '' &&
    form.duration.trim() !== ''

  function handleAdd() {
    if (!isValid) return
    onAdd(form)
    setForm(emptyForm)
    setDrugQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault()
      handleAdd()
    }
  }

  function formatDrugDisplay(drug: Drug): string {
    const parts = [drug.brandName]
    const details: string[] = []
    if (drug.saltName) details.push(drug.saltName)
    if (drug.strength) details.push(drug.strength)
    if (drug.form) details.push(drug.form)
    if (details.length > 0) parts.push(`(${details.join(' ')})`)
    return parts.join(' ')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end" onKeyDown={handleKeyDown}>
      {/* Drug Name with autocomplete */}
      <div className="md:col-span-1 relative" ref={drugRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
        <input
          type="text"
          value={drugQuery}
          onChange={(e) => handleDrugQueryChange(e.target.value)}
          onFocus={() => drugQuery.trim().length >= 1 && setShowDrugDropdown(true)}
          placeholder="Type drug name..."
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: '44px' }}
          autoComplete="off"
        />
        {showDrugDropdown && drugQuery.trim().length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
            ) : drugResults.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                No drugs found. You can type a custom name.
              </div>
            ) : (
              drugResults.map((drug) => (
                <button
                  key={drug.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectDrug(drug)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  {formatDrugDisplay(drug)}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Dosage */}
      <ComboBox
        options={DOSAGE_OPTIONS}
        value={form.dosage}
        onChange={(v) => setForm((f) => ({ ...f, dosage: v }))}
        placeholder="e.g., 1 tablet"
        label="Dosage"
      />

      {/* Frequency */}
      <ComboBox
        options={FREQUENCY_OPTIONS}
        value={form.frequency}
        onChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
        placeholder="e.g., Twice daily"
        label="Frequency"
      />

      {/* Duration */}
      <ComboBox
        options={DURATION_OPTIONS}
        value={form.duration}
        onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
        placeholder="e.g., 5 days"
        label="Duration"
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
