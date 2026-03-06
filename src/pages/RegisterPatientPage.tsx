import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerPatient, getNextPatientId } from '@/db/patients'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import type { PatientInput } from '@/db/patients'

export function RegisterPatientPage() {
  const navigate = useNavigate()
  const [previewId, setPreviewId] = useState<string>('')

  useEffect(() => { getNextPatientId().then(setPreviewId) }, [])

  async function handleSubmit(data: PatientInput) {
    const patient = await registerPatient(data)
    navigate(`/patient/${patient.id}`)
  }

  return (
    <div className="max-w-2xl">
      <Breadcrumbs crumbs={[{ label: 'Home', path: '/' }, { label: 'Register Patient' }]} />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Register New Patient</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-base text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Patient ID preview */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="block text-sm font-medium text-blue-700 mb-1">Patient ID</label>
        <p className="text-lg text-blue-800 font-bold font-mono">
          {previewId || '...'}
        </p>
      </div>

      <PatientRegistrationForm
        onSubmit={handleSubmit}
        submitLabel="Save Patient"
      />
    </div>
  )
}
