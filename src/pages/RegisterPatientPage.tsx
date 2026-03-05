import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerPatient, searchPatients } from '@/db/patients'
import type { Patient } from '@/db/index'
import type { PatientInput } from '@/db/patients'

export function RegisterPatientPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<PatientInput>({
    firstName: '',
    lastName: '',
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const patient = await registerPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: form.age,
        gender: form.gender,
        contact: form.contact?.trim() || undefined,
        cnic: form.cnic?.trim() || undefined,
      })
      navigate(`/patient/${patient.id}`)
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Register New Patient</h2>
        <Link to="/" className="text-base text-gray-500 hover:text-gray-700">
          Cancel
        </Link>
      </div>

      {/* Patient ID preview */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <label className="block text-sm font-medium text-gray-500 mb-1">Patient ID</label>
        <p className="text-base text-gray-400 italic">Will be assigned on save</p>
      </div>

      {/* Duplicate check results */}
      {duplicates.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-2">Patient already exists?</p>
          {duplicates.map((dup) => (
            <Link
              key={dup.id}
              to={`/patient/${dup.id}`}
              className="flex items-center gap-3 p-2 hover:bg-yellow-100 rounded"
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
            </Link>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-base font-medium text-gray-900 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-base font-medium text-gray-900 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>

        {/* Gender */}
        <div className="sm:col-span-2">
          <label className="block text-base font-medium text-gray-900 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            {(['male', 'female', 'other'] as const).map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => updateField('gender', g)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-base text-gray-700 capitalize">{g}</span>
              </label>
            ))}
          </div>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>

        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-base font-medium text-gray-900 mb-1">
            Age (years) <span className="text-red-500">*</span>
          </label>
          <input
            id="age"
            type="number"
            min="0"
            value={form.age || ''}
            onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter age"
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>

        {/* Contact */}
        <div>
          <label htmlFor="contact" className="block text-base font-medium text-gray-900 mb-1">
            Contact Number
          </label>
          <input
            id="contact"
            type="text"
            value={form.contact}
            onChange={(e) => updateField('contact', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contact (optional)"
          />
        </div>

        {/* CNIC */}
        <div className="sm:col-span-2">
          <label htmlFor="cnic" className="block text-base font-medium text-gray-900 mb-1">
            CNIC
          </label>
          <input
            id="cnic"
            type="text"
            value={form.cnic}
            onChange={(e) => updateField('cnic', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CNIC (optional)"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="sm:col-span-2 w-full py-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          {isSubmitting ? 'Saving...' : 'Save Patient'}
        </button>
      </form>
    </div>
  )
}
