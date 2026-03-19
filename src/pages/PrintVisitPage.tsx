import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PrescriptionSlip } from '@/components/PrescriptionSlip'
import { DispensarySlip } from '@/components/DispensarySlip'
import { getVisit } from '@/db/visits'
import { getPatient } from '@/db/patients'
import { getClinicInfo } from '@/db/settings'
import { getPrintSettings, PAPER_SIZES, PAGE_SIZE_KEYWORD, calcMargin } from '@/db/printSettings'

const PREVIEW_PX_PER_MM = 2.8

function previewDimensions(size: PaperSize) {
  const { width, height } = PAPER_SIZES[size]
  return {
    widthPx: Math.round(width * PREVIEW_PX_PER_MM),
    heightPx: Math.round(height * PREVIEW_PX_PER_MM),
  }
}
import type { Visit, VisitMedication, Patient } from '@/db/index'
import type { ClinicInfo } from '@/db/settings'
import type { PrintSettings, PaperSize } from '@/db/printSettings'

type PrintMode = 'prescription' | 'dispensary' | null
type PreviewMode = 'prescription' | 'dispensary'

function injectPageStyle(size: PaperSize, margin: number): void {
  const existing = document.getElementById('print-page-style')
  if (existing) existing.remove()
  const style = document.createElement('style')
  style.id = 'print-page-style'
  style.media = 'print'
  style.textContent = `@page { size: ${PAGE_SIZE_KEYWORD[size]}; margin: ${margin}mm; }`
  document.head.appendChild(style)
}

function removePageStyle(): void {
  const existing = document.getElementById('print-page-style')
  if (existing) existing.remove()
}

export function PrintVisitPage() {
  const { id: visitId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [visit, setVisit] = useState<Visit | null>(null)
  const [medications, setMedications] = useState<VisitMedication[]>([])
  const [patient, setPatient] = useState<Patient | null>(null)
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [printMode, setPrintMode] = useState<PrintMode>(null)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('prescription')
  const autoPrintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const printButtonRef = useRef<HTMLButtonElement>(null)

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

      const [p, ci, ps] = await Promise.all([
        getPatient(result.visit.patientId),
        getClinicInfo(),
        getPrintSettings(),
      ])

      if (p) setPatient(p)
      setClinicInfo(ci)
      setPrintSettings(ps)
      setLoading(false)
    }

    loadData()
  }, [visitId])

  // Auto-print when navigated with ?auto=prescription or ?auto=dispensary (fire once)
  useEffect(() => {
    if (loading) return
    const auto = searchParams.get('auto')
    if (auto === 'prescription' || auto === 'dispensary') {
      setPreviewMode(auto)
      setPrintMode(auto)
      // Determine filtered meds for the target slip
      const targetMeds = auto === 'prescription'
        ? medications.filter((m) => m.slipType === 'prescription')
        : medications.filter((m) => (m.slipType ?? 'dispensary') === 'dispensary')
      // Skip auto-print if the target slip has no medications
      if (targetMeds.length === 0) return
      if (printSettings) {
        const size = auto === 'prescription' ? printSettings.prescriptionSize : printSettings.dispensarySize
        injectPageStyle(size, calcMargin(size))
      }
      autoPrintTimer.current = setTimeout(() => window.print(), 200)
    }
    return () => {
      // StrictMode remount: cancel pending print from previous mount
      if (autoPrintTimer.current) {
        clearTimeout(autoPrintTimer.current)
        autoPrintTimer.current = null
      }
    }
  }, [loading, searchParams, printSettings, medications])

  const handleAfterPrint = useCallback(() => {
    setPrintMode(null)
    removePageStyle()
    printButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [handleAfterPrint])

  function handlePrint(mode: PrintMode) {
    if (printSettings && mode) {
      const size = mode === 'prescription' ? printSettings.prescriptionSize : printSettings.dispensarySize
      injectPageStyle(size, calcMargin(size))
    }
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

  const prescriptionMeds = medications.filter((m) => m.slipType === 'prescription')
  const dispensaryMeds = medications.filter((m) => (m.slipType ?? 'dispensary') === 'dispensary')

  const activeSlipMeds = previewMode === 'prescription' ? prescriptionMeds : dispensaryMeds

  const activeSize: PaperSize = printSettings
    ? (previewMode === 'prescription' ? printSettings.prescriptionSize : printSettings.dispensarySize)
    : 'A5'

  const showPrescription = printMode !== null ? printMode === 'prescription' : previewMode === 'prescription'
  const showDispensary = printMode !== null ? printMode === 'dispensary' : previewMode === 'dispensary'

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
              tabIndex={-1}
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
              tabIndex={-1}
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

          <div className="flex items-center gap-3">
            {/* Paper size badge */}
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-1">
              Paper: {PAPER_SIZES[activeSize].label}
            </span>

            {/* Print button */}
            <button
              ref={printButtonRef}
              type="button"
              autoFocus
              onClick={() => handlePrint(previewMode)}
              disabled={activeSlipMeds.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors"
            >
              Print {previewMode === 'prescription' ? 'Prescription' : 'Dispensary Slip'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview frame (screen-only) stays mounted during print to avoid layout flash */}
      {(() => {
        const { widthPx, heightPx } = previewDimensions(activeSize)
        return (
          <div
            data-testid="preview-frame"
            className="no-print mx-auto bg-white border border-gray-300 shadow-md overflow-auto"
            style={{ width: `${widthPx}px`, minHeight: `${heightPx}px` }}
          >
            {previewMode === 'prescription' && visit && patient && clinicInfo && (
              prescriptionMeds.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-40 text-gray-400 text-sm">
                  No medications for this slip
                </div>
              ) : (
                <PrescriptionSlip
                  visit={visit}
                  medications={prescriptionMeds}
                  patient={patient}
                  clinicInfo={clinicInfo}
                  paperSize={activeSize}
                />
              )
            )}
            {previewMode === 'dispensary' && visit && patient && (
              dispensaryMeds.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-40 text-gray-400 text-sm">
                  No medications for this slip
                </div>
              ) : (
                <DispensarySlip
                  visit={visit}
                  medications={dispensaryMeds}
                  patient={patient}
                  paperSize={activeSize}
                />
              )
            )}
          </div>
        )
      })()}

      {/* Print-only rendering: slip without preview frame, hidden on screen */}
      {printMode === 'prescription' && showPrescription && (
        <div className="hidden print:block">
          <PrescriptionSlip
            visit={visit}
            medications={prescriptionMeds}
            patient={patient}
            clinicInfo={clinicInfo}
            paperSize={printSettings?.prescriptionSize ?? 'A5'}
          />
        </div>
      )}
      {printMode === 'dispensary' && showDispensary && (
        <div className="hidden print:block">
          <DispensarySlip
            visit={visit}
            medications={dispensaryMeds}
            patient={patient}
            paperSize={printSettings?.dispensarySize ?? 'A5'}
          />
        </div>
      )}
    </div>
  )
}
