import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPatient, addToRecent } from '@/db/patients'
import type { Patient } from '@/db/index'
import type { PatientInput } from '@/db/patients'
import { PatientInfoCard } from '@/components/PatientInfoCard'

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const loadPatient = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const p = await getPatient(id)
    if (p) {
      setPatient(p)
      setNotFound(false)
      await addToRecent(id)
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

  function handleUpdated(changes: Partial<PatientInput>) {
    if (patient) {
      setPatient({ ...patient, ...changes, updatedAt: new Date().toISOString() } as Patient)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-gray-500">Loading patient...</p>
      </div>
    )
  }

  if (notFound || !patient) {
    return (
      <div className="max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient not found</h2>
        <p className="text-gray-500 mb-4">The patient you are looking for does not exist.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
          Go to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PatientInfoCard patient={patient} onUpdated={handleUpdated} />

      {/* Visit History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Visit History</h3>
        <div className="text-center py-8">
          <p className="text-lg text-gray-400">No visits yet</p>
          <p className="text-sm text-gray-400 mt-1">Visit history will appear here once visits are recorded.</p>
        </div>
      </div>
    </div>
  )
}
