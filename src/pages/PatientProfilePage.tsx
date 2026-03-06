import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPatient, addToRecent } from '@/db/patients'
import type { Patient } from '@/db/index'
import type { PatientInput } from '@/db/patients'
import { PatientInfoCard } from '@/components/PatientInfoCard'
import { VisitHistorySection } from '@/components/VisitHistorySection'
import { Breadcrumbs } from '@/components/Breadcrumbs'

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
      <Breadcrumbs crumbs={[
        { label: 'Home', path: '/' },
        { label: 'Patients', path: '/patients' },
        { label: `${patient.firstName} ${patient.lastName}` },
      ]} />
      <PatientInfoCard patient={patient} onUpdated={handleUpdated} />

      <VisitHistorySection patientId={patient.id} />
    </div>
  )
}
