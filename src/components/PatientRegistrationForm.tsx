import { useState, useEffect } from 'react'
import { searchPatients } from '@/db/patients'
import type { Patient } from '@/db/index'
import type { PatientInput } from '@/db/patients'
import { formatCNIC } from '@/utils/formatCNIC'

interface PatientRegistrationFormProps {
  initialFirstName?: string
  initialLastName?: string
  onSubmit: (data: PatientInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  compact?: boolean
}

export function PatientRegistrationForm({
  initialFirstName = '',
  initialLastName = '',
  onSubmit,
  onCancel,
  submitLabel = 'Save Patient',
  compact = false,
}: PatientRegistrationFormProps) {
  const [form, setForm] = useState<PatientInput>({
    firstName: initialFirstName,
    lastName: initialLastName,
    age: 0,
    gender: 'male',
    contact: '',
    cnic: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicates, setDuplicates] = useState<Patient[]>([])

  // Duplicate check as user types name
  useEffect(() => {
    const name = `${form.firstName} ${form.lastName}`.trim()
    if (name.length < 2) {
      setDuplicates([])
      return
    }

    const timeout = setTimeout(async () => {
      const searchTerm = form.firstName.length >= 2 ? form.firstName : form.lastName
      if (searchTerm.length < 2) {
        setDuplicates([])
        return
      }
      const found = await searchPatients(searchTerm)
      setDuplicates(found)
    }, 300)

    return () => clearTimeout(timeout)
  }, [form.firstName, form.lastName])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!form.gender) newErrors.gender = 'Gender is required'
    if (!form.age || form.age <= 0) newErrors.age = 'Age must be a positive number'
    if (form.cnic) {
      const cnicDigits = form.cnic.replace(/\D/g, '')
      if (cnicDigits.length > 0 && cnicDigits.length !== 13) {
        newErrors.cnic = 'CNIC must be 13 digits'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: form.age,
        gender: form.gender,
        contact: form.contact?.trim() || undefined,
        cnic: form.cnic?.trim() || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateField(field: keyof PatientInput, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  return (
    <div>
      {/* Duplicate check results */}
      {duplicates.length > 0 && (
        <div className={`${compact ? 'mb-3' : 'mb-4'} p-3 bg-yellow-50 border border-yellow-200 rounded-lg`}>
          <p className="text-sm font-medium text-yellow-800 mb-2">Patient already exists?</p>
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="flex items-center gap-3 p-2 rounded"
            >
              <span className="text-xs font-mono bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded">
                {dup.patientId}
              </span>
              <span className="font-medium text-gray-900">
                {dup.firstName} {dup.lastName}
              </span>
              <span className="text-sm text-gray-500">
                {dup.age}y, {dup.gender}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'gap-3' : 'gap-4'}`}>
        {/* First Name */}
        <div>
          <label htmlFor="reg-firstName" className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-1`}>
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-firstName"
            type="text"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className={`w-full px-3 py-2 ${compact ? 'text-sm' : 'text-base'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="reg-lastName" className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-1`}>
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-lastName"
            type="text"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={`w-full px-3 py-2 ${compact ? 'text-sm' : 'text-base'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>

        {/* Gender */}
        <div className="sm:col-span-2">
          <label className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-2`}>
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            {(['male', 'female'] as const).map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reg-gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => updateField('gender', g)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className={`${compact ? 'text-sm' : 'text-base'} text-gray-700 capitalize`}>{g}</span>
              </label>
            ))}
          </div>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>

        {/* Age */}
        <div>
          <label htmlFor="reg-age" className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-1`}>
            Age (years) <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-age"
            type="number"
            min="0"
            value={form.age || ''}
            onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 ${compact ? 'text-sm' : 'text-base'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter age"
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>

        {/* Contact */}
        <div>
          <label htmlFor="reg-contact" className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-1`}>
            Contact Number
          </label>
          <input
            id="reg-contact"
            type="text"
            value={form.contact}
            onChange={(e) => updateField('contact', e.target.value)}
            className={`w-full px-3 py-2 ${compact ? 'text-sm' : 'text-base'} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Contact (optional)"
          />
        </div>

        {/* CNIC */}
        <div className="sm:col-span-2">
          <label htmlFor="reg-cnic" className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-1`}>
            CNIC
          </label>
          <input
            id="reg-cnic"
            type="text"
            value={form.cnic}
            onChange={(e) => updateField('cnic', formatCNIC(e.target.value))}
            maxLength={15}
            className={`w-full px-3 py-2 ${compact ? 'text-sm' : 'text-base'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cnic ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="XXXXX-XXXXXXX-X"
          />
          <p className="mt-1 text-xs text-gray-400">Format: XXXXX-XXXXXXX-X</p>
          {errors.cnic && <p className="mt-1 text-sm text-red-600">{errors.cnic}</p>}
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-2 ${compact ? 'text-sm' : 'text-base'} font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors`}
            style={{ minHeight: '44px' }}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 ${compact ? 'text-sm' : 'text-base'} text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg cursor-pointer`}
              style={{ minHeight: '44px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
