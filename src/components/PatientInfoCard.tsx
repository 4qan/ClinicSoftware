import { useState } from 'react'
import { updatePatient } from '@/db/patients'
import type { Patient } from '@/db/index'
import type { PatientInput } from '@/db/patients'

interface PatientInfoCardProps {
  patient: Patient
  onUpdated: (updated: Partial<PatientInput>) => void
}

export function PatientInfoCard({ patient, onUpdated }: PatientInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    age: patient.age,
    gender: patient.gender,
    contact: patient.contact || '',
    cnic: patient.cnic || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function startEdit() {
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact || '',
      cnic: patient.cnic || '',
    })
    setErrors({})
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    setErrors({})
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!form.age || form.age <= 0) newErrors.age = 'Age must be a positive number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    const changes: Partial<PatientInput> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      age: form.age,
      gender: form.gender,
      contact: form.contact.trim() || undefined,
      cnic: form.cnic.trim() || undefined,
    }

    await updatePatient(patient.id, changes)
    setIsEditing(false)
    onUpdated(changes)
  }

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Edit Patient</h3>
          <div className="flex gap-2">
            <button onClick={cancelEdit} className="px-4 py-2 text-base text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              Save
            </button>
          </div>
        </div>

        {/* Patient ID (read-only) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">Patient ID</label>
          <p className="text-lg font-mono text-gray-400">{patient.patientId}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-firstName" className="block text-base font-medium text-gray-900 mb-1">First Name *</label>
            <input
              id="edit-firstName"
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="edit-lastName" className="block text-base font-medium text-gray-900 mb-1">Last Name *</label>
            <input
              id="edit-lastName"
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
          <div>
            <label htmlFor="edit-age" className="block text-base font-medium text-gray-900 mb-1">Age *</label>
            <input
              id="edit-age"
              type="number"
              min="0"
              value={form.age || ''}
              onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
          </div>
          <div>
            <label className="block text-base font-medium text-gray-900 mb-1">Gender *</label>
            <div className="flex gap-3 mt-1">
              {(['male', 'female'] as const).map((g) => (
                <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="edit-gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => setForm((f) => ({ ...f, gender: g }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">{g}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="edit-contact" className="block text-base font-medium text-gray-900 mb-1">Contact</label>
            <input
              id="edit-contact"
              type="text"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="edit-cnic" className="block text-base font-medium text-gray-900 mb-1">CNIC</label>
            <input
              id="edit-cnic"
              type="text"
              value={form.cnic}
              onChange={(e) => setForm((f) => ({ ...f, cnic: e.target.value }))}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {patient.patientId}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {patient.firstName} {patient.lastName}
          </h2>
          <p className="text-lg text-gray-600 mt-1">
            {patient.age} years, <span className="capitalize">{patient.gender}</span>
          </p>
          {patient.contact && (
            <p className="text-base text-gray-500 mt-1">Contact: {patient.contact}</p>
          )}
          {patient.cnic && (
            <p className="text-base text-gray-500">CNIC: {patient.cnic}</p>
          )}
        </div>
        <button
          onClick={startEdit}
          className="px-4 py-2 text-base text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
