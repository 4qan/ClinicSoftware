import { useState, useRef, useEffect } from 'react'

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

// Placeholder options until Plan 01 delivers clinical constants
const DOSAGE_OPTIONS = [
  '1 tablet', '2 tablets', '1/2 tablet',
  '5ml', '10ml', '15ml',
  '1 capsule', '2 capsules',
  '1 sachet', '1 puff', '2 puffs',
  'Apply thin layer',
]

const FREQUENCY_OPTIONS = [
  'OD (Once daily)',
  'BD (Twice daily)',
  'TDS (Three times daily)',
  'QID (Four times daily)',
  'PRN (As needed)',
  'HS (At bedtime)',
  'Stat (Immediately)',
  'Before meals',
  'After meals',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
]

const DURATION_OPTIONS = [
  '1 day', '3 days', '5 days', '7 days', '10 days', '14 days',
  '3 weeks', '1 month', '2 months', '3 months', '6 months',
  'Ongoing', 'As needed',
]

interface SimpleComboBoxProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

function SimpleComboBox({ options, value, onChange, placeholder, label }: SimpleComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState<string[]>(options)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const lower = value.toLowerCase()
      setFiltered(options.filter((o) => o.toLowerCase().includes(lower)))
    } else {
      setFiltered(options)
    }
  }, [value, options])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ minHeight: '44px' }}
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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

  // Placeholder: use simple text input for drug search until useDrugSearch is available
  // When Plan 01 lands, this will be swapped for the real drug autocomplete

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
    setForm((f) => ({ ...f, brandName: value, saltName: '' }))
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end" onKeyDown={handleKeyDown}>
      {/* Drug Name */}
      <div className="md:col-span-1" ref={drugRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
        <input
          type="text"
          value={drugQuery}
          onChange={(e) => handleDrugQueryChange(e.target.value)}
          placeholder="Type drug name..."
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: '44px' }}
        />
      </div>

      {/* Dosage */}
      <SimpleComboBox
        options={DOSAGE_OPTIONS}
        value={form.dosage}
        onChange={(v) => setForm((f) => ({ ...f, dosage: v }))}
        placeholder="e.g., 1 tablet"
        label="Dosage"
      />

      {/* Frequency */}
      <SimpleComboBox
        options={FREQUENCY_OPTIONS}
        value={form.frequency}
        onChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
        placeholder="e.g., BD"
        label="Frequency"
      />

      {/* Duration */}
      <SimpleComboBox
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
