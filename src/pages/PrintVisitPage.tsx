import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PrescriptionSlip } from '@/components/PrescriptionSlip'
import { DispensarySlip } from '@/components/DispensarySlip'
import { getVisit } from '@/db/visits'
import { getPatient } from '@/db/patients'
import { getClinicInfo } from '@/db/settings'
import type { Visit, VisitMedication, Patient } from '@/db/index'
import type { ClinicInfo } from '@/db/settings'

type PrintMode = 'prescription' | 'dispensary' | null

export function PrintVisitPage() {
  const { id: visitId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [visit, setVisit] = useState<Visit | null>(null)
  const [medications, setMedications] = useState<VisitMedication[]>([])
  const [patient, setPatient] = useState<Patient | null>(null)
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [printMode, setPrintMode] = useState<PrintMode>(null)

  useEffect(() => {
    async function loadData() {
      if (!visitId) return

      const result = await getVisit(visitId)
      if (!result) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setVisit(result.visit)
      setMedications(result.medications)

      const [p, ci] = await Promise.all([
        getPatient(result.visit.patientId),
        getClinicInfo(),
      ])

      if (p) setPatient(p)
      setClinicInfo(ci)
      setLoading(false)
    }

    loadData()
  }, [visitId])

  const handleAfterPrint = useCallback(() => {
    setPrintMode(null)
  }, [])

  useEffect(() => {
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [handleAfterPrint])

  function handlePrint(mode: PrintMode) {
    setPrintMode(mode)
    setTimeout(() => window.print(), 100)
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-gray-500">Loading prescription...</p>
      </div>
    )
  }

  if (notFound || !visit || !patient || !clinicInfo) {
    return (
      <div className="max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Visit not found</h2>
        <p className="text-gray-500 mb-4">The visit you are looking for does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Go to Home
        </button>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: `${patient.firstName} ${patient.lastName}`, path: `/patient/${patient.id}` },
    { label: 'Print Prescription' },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Screen-only: breadcrumbs and buttons */}
      <div className="no-print">
        <Breadcrumbs crumbs={breadcrumbs} />

        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => handlePrint('prescription')}
            className="flex-1 px-6 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
            style={{ minHeight: '56px' }}
          >
            Print Prescription
          </button>
          <button
            type="button"
            onClick={() => handlePrint('dispensary')}
            className="flex-1 px-6 py-4 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer transition-colors"
            style={{ minHeight: '56px' }}
          >
            Print Dispensary Slip
          </button>
        </div>
      </div>

      {/* Prescription Slip: always visible on screen as preview, visible in print only when printMode is 'prescription' */}
      <div className={printMode === 'dispensary' ? 'print-hidden' : ''}>
        <PrescriptionSlip
          visit={visit}
          medications={medications}
          patient={patient}
          clinicInfo={clinicInfo}
        />
      </div>

      {/* Dispensary Slip: hidden on screen, visible in print only when printMode is 'dispensary' */}
      <div className={`${printMode !== 'dispensary' ? 'hidden' : ''}`}>
        <DispensarySlip
          visit={visit}
          medications={medications}
          patient={patient}
        />
      </div>
    </div>
  )
}
