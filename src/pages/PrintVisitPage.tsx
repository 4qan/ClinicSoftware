import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PrescriptionSlip } from '@/components/PrescriptionSlip'
import { DispensarySlip } from '@/components/DispensarySlip'
import { getVisit } from '@/db/visits'
import { getPatient } from '@/db/patients'
import { getClinicInfo } from '@/db/settings'
import type { Visit, VisitMedication, Patient } from '@/db/index'
import type { ClinicInfo } from '@/db/settings'

type PrintMode = 'prescription' | 'dispensary' | null
type PreviewMode = 'prescription' | 'dispensary'

export function PrintVisitPage() {
  const { id: visitId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [visit, setVisit] = useState<Visit | null>(null)
  const [medications, setMedications] = useState<VisitMedication[]>([])
  const [patient, setPatient] = useState<Patient | null>(null)
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [printMode, setPrintMode] = useState<PrintMode>(null)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('prescription')

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

  // Auto-print when navigated with ?auto=prescription or ?auto=dispensary
  useEffect(() => {
    if (loading) return
    const auto = searchParams.get('auto')
    if (auto === 'prescription' || auto === 'dispensary') {
      setPreviewMode(auto)
      setPrintMode(auto)
      setTimeout(() => window.print(), 200)
    }
  }, [loading, searchParams])

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
      {/* Screen-only: breadcrumbs, tabs, and print button */}
      <div className="no-print">
        <Breadcrumbs crumbs={breadcrumbs} />

        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Preview tab toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode('prescription')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                previewMode === 'prescription'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Prescription
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('dispensary')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                previewMode === 'dispensary'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dispensary
            </button>
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={() => handlePrint(previewMode)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
          >
            Print {previewMode === 'prescription' ? 'Prescription' : 'Dispensary Slip'}
          </button>
        </div>
      </div>

      {/* Prescription Slip: shown on screen when previewing, hidden in print when printing dispensary */}
      <div className={`${previewMode !== 'prescription' ? 'hidden' : ''} ${printMode === 'dispensary' ? 'print-hidden' : ''}`}>
        <PrescriptionSlip
          visit={visit}
          medications={medications}
          patient={patient}
          clinicInfo={clinicInfo}
        />
      </div>

      {/* Dispensary Slip: shown on screen when previewing, hidden in print when printing prescription */}
      <div className={`${previewMode !== 'dispensary' ? 'hidden' : ''} ${printMode === 'prescription' ? 'print-hidden' : ''}`}>
        <DispensarySlip
          visit={visit}
          medications={medications}
          patient={patient}
        />
      </div>
    </div>
  )
}
