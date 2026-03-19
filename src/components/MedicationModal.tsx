import { useState, useEffect } from 'react'
import type { Drug } from '@/db/index'
import { ComboBox } from '@/components/ComboBox'
import { MEDICATION_FORMS } from '@/constants/clinical'

interface MedicationFormData {
  brandName: string
  saltName: string
  form: string
  strength: string
}

interface MedicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: MedicationFormData) => void
  drug?: Drug
}

export function MedicationModal({ isOpen, onClose, onSave, drug }: MedicationModalProps) {
  const [brandName, setBrandName] = useState('')
  const [saltName, setSaltName] = useState('')
  const [form, setForm] = useState('')
  const [strength, setStrength] = useState('')
  const [errors, setErrors] = useState<{ brandName?: string; saltName?: string; form?: string }>({})

  useEffect(() => {
    if (isOpen) {
      if (drug) {
        setBrandName(drug.brandName)
        setSaltName(drug.saltName)
        setForm(drug.form)
        setStrength(drug.strength)
      } else {
        setBrandName('')
        setSaltName('')
        setForm('')
        setStrength('')
      }
      setErrors({})
    }
  }, [isOpen, drug])

  if (!isOpen) return null

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!brandName.trim()) newErrors.brandName = 'Brand name is required'
    if (!saltName.trim()) newErrors.saltName = 'Salt name is required'
    if (!form.trim()) newErrors.form = 'Form is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({ brandName: brandName.trim(), saltName: saltName.trim(), form: form.trim(), strength: strength.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">
          {drug ? 'Edit Medication' : 'Add Medication'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className={`w-full px-3 py-2 text-base border rounded-lg ${errors.brandName ? 'border-red-500' : 'border-gray-200'}`}
              style={{ minHeight: '44px' }}
              autoFocus
            />
            {errors.brandName && <p className="mt-1 text-sm text-red-600">{errors.brandName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salt Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={saltName}
              onChange={(e) => setSaltName(e.target.value)}
              className={`w-full px-3 py-2 text-base border rounded-lg ${errors.saltName ? 'border-red-500' : 'border-gray-200'}`}
              style={{ minHeight: '44px' }}
            />
            {errors.saltName && <p className="mt-1 text-sm text-red-600">{errors.saltName}</p>}
          </div>

          <div>
            <ComboBox
              options={MEDICATION_FORMS}
              value={form}
              onChange={setForm}
              label="Form *"
              placeholder="Select or type form"
              error={errors.form}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <input
              type="text"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="e.g. 500mg"
              className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg"
              style={{ minHeight: '44px' }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
