import { useLayoutEffect, useRef, useState } from 'react'
import type { Visit, VisitMedication, Patient } from '@/db/index'
import { calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS } from '@/db/printSettings'
import type { PaperSize } from '@/db/printSettings'

// Short uppercase codes per medication form, shown inside the qty box on the
// 78x115mm Slip layout so the dispenser instantly knows what unit "14" or "60ml"
// refers to. Falls back to the first 3 chars uppercase for unknown forms.
export const FORM_CODES: Record<string, string> = {
  Tablet: 'TAB',
  Capsule: 'CAP',
  Syrup: 'SYR',
  Suspension: 'SUS',
  Inhaler: 'INH',
  Lotion: 'LOT',
  Cream: 'CRM',
  Ointment: 'OIN',
  Drops: 'DRP',
  Injection: 'INJ',
  Spray: 'SPR',
  Sachet: 'SAC',
}

export function getFormCode(form: string): string {
  return FORM_CODES[form] ?? form.slice(0, 3).toUpperCase()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface DispensarySlipProps {
  visit: Visit
  medications: VisitMedication[]
  patient: Patient
  paperSize: PaperSize
}

export function DispensarySlip(props: DispensarySlipProps) {
  if (props.paperSize === 'Slip') {
    return <ChunkedSlipDispensary {...props} />
  }
  return <LegacyDispensarySlip {...props} />
}

// ============================================================
// Legacy table layout — A5 / A4 / Letter (unchanged behavior)
// ============================================================
function LegacyDispensarySlip({ visit, medications, patient, paperSize }: DispensarySlipProps) {
  const scale = calcScale(paperSize)
  const basePt = +(10 * scale).toFixed(1)
  const headerPt = +(12 * scale).toFixed(1)

  return (
    <div
      className="dispensary-slip bg-white mx-auto"
      style={{
        maxWidth: `${PAPER_SIZES[paperSize].width}mm`,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: `${basePt}pt`,
        ['--urdu-line-height' as string]: URDU_LINE_HEIGHTS[paperSize],
      } as React.CSSProperties}
    >
      <div style={{ padding: `${(4 * scale).toFixed(1)}mm` }}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
          <h2 className="font-bold text-gray-900" style={{ fontSize: `${headerPt}pt` }}>Dispensary Slip</h2>
          <span className="text-sm">
            <span className="text-gray-500">Patient: </span>
            <span className="font-medium">{patient.firstName} {patient.lastName}</span>
          </span>
          <span className="text-sm">
            <span className="text-gray-500">ID: </span>
            <span className="font-mono">{patient.patientId}</span>
          </span>
          <span className="text-sm">
            <span className="text-gray-500">Date: </span>
            <span>{formatDate(visit.createdAt)}</span>
          </span>
        </div>

        <hr className="border-gray-300 mb-2" />

        {medications.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-0.5 pr-2 font-semibold text-gray-700" style={{ width: '20px' }}>#</th>
                {['Brand Name', 'Salt', 'Strength', 'Form', 'Qty', 'Frequency', 'Duration'].map((col, idx, arr) => (
                  <th key={col} className={`text-left py-0.5 ${idx < arr.length - 1 ? 'pr-2' : ''} font-semibold text-gray-700`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medications.map((med, i) => (
                <tr key={med.id} className="border-b border-gray-200" style={{ breakInside: 'avoid' }}>
                  <td className="py-0.5 pr-2 text-gray-500">{i + 1}</td>
                  <td className="py-0.5 pr-2 font-medium">{med.brandName}</td>
                  <td className="py-0.5 pr-2 text-gray-600">{med.saltName}</td>
                  <td className="py-0.5 pr-2">{med.strength}</td>
                  <td className="py-0.5 pr-2">{med.form}</td>
                  <td className="py-0.5 pr-2">{med.quantity}</td>
                  <td className="py-0.5 pr-2">{med.frequency}</td>
                  <td className="py-0.5">{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Slip layout — 78x115mm, B2 design with chunked pagination
// ============================================================

const SLIP_WIDTH_MM = 78
const SLIP_HEIGHT_MM = 115
const SLIP_PADDING_MM = 3
// Used when getBoundingClientRect returns 0 (jsdom/SSR). 6 meds per page is a
// sane default given B2's ~14mm-per-med density on a 115mm page.
const FALLBACK_MEDS_PER_PAGE = 6
const PX_PER_MM = 96 / 25.4

// Pure chunker — exported for unit testing.
// If all heights are zero (jsdom), splits by fixed count instead of by measured height.
export function chunkByMeasuredHeight(
  heights: number[],
  availableHeightPx: number,
  fallbackPerPage: number = FALLBACK_MEDS_PER_PAGE
): number[][] {
  if (heights.length === 0) return [[]]

  const useFallback = heights.every((h) => h <= 0)
  if (useFallback) {
    const chunks: number[][] = []
    for (let i = 0; i < heights.length; i += fallbackPerPage) {
      chunks.push(
        Array.from({ length: Math.min(fallbackPerPage, heights.length - i) }, (_, j) => i + j)
      )
    }
    return chunks
  }

  const chunks: number[][] = []
  let current: number[] = []
  let used = 0
  heights.forEach((h, i) => {
    if (current.length > 0 && used + h > availableHeightPx) {
      chunks.push(current)
      current = []
      used = 0
    }
    current.push(i)
    used += h
  })
  if (current.length > 0) chunks.push(current)
  return chunks
}

const slipPageStyle: React.CSSProperties = {
  width: `${SLIP_WIDTH_MM}mm`,
  minHeight: `${SLIP_HEIGHT_MM}mm`,
  padding: `${SLIP_PADDING_MM}mm`,
  fontFamily: "'Segoe UI', Arial, sans-serif",
  fontSize: '7pt',
  lineHeight: 1.3,
  color: '#111827',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  pageBreakAfter: 'always',
  breakAfter: 'page',
}

function SlipHeader({ visit, patient }: { visit: Visit; patient: Patient }) {
  return (
    <div
      className="slip-header"
      data-testid="slip-header"
      style={{ borderBottom: '0.5pt solid #9ca3af', paddingBottom: '1.5mm' }}
    >
      <h2 style={{ fontSize: '9pt', fontWeight: 700, margin: '0 0 1mm', letterSpacing: '0.2px' }}>
        Dispensary Slip
      </h2>
      <div style={{ fontSize: '6.5pt', lineHeight: 1.15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
          <span>
            <span style={{ color: '#6b7280' }}>Patient: </span>
            <span style={{ fontWeight: 500 }}>{patient.firstName} {patient.lastName}</span>
          </span>
          <span style={{ fontFamily: "'SF Mono', Consolas, monospace" }}>{patient.patientId}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', color: '#6b7280' }}>
          <span>{formatDate(visit.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

function SlipFooter({ pageNum, totalPages }: { pageNum: number; totalPages: number }) {
  return (
    <div
      className="slip-footer"
      data-testid="slip-footer"
      style={{
        borderTop: '0.25pt solid #d1d5db',
        paddingTop: '1mm',
        marginTop: '1.5mm',
        fontSize: '5.5pt',
        color: '#6b7280',
        textAlign: 'right',
        letterSpacing: '0.3px',
      }}
    >
      Page {pageNum} / {totalPages}
    </div>
  )
}

function MedBlock({ med, index }: { med: VisitMedication; index: number }) {
  const formCode = getFormCode(med.form)
  return (
    <div
      data-med-idx={index}
      className="slip-med"
      style={{
        display: 'grid',
        gridTemplateColumns: '5mm 1fr',
        columnGap: '1mm',
        padding: '1mm 0',
        borderBottom: '0.25pt dotted #e5e7eb',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div style={{ fontSize: '7pt', fontWeight: 700, textAlign: 'right', paddingRight: '1mm' }}>
        {index + 1}.
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '7pt',
            fontWeight: 700,
            wordBreak: 'break-word',
            hyphens: 'auto',
            lineHeight: 1.15,
            marginBottom: '0.3mm',
          }}
        >
          {med.brandName}
        </div>
        <div style={{ fontSize: '6pt', color: '#4b5563', lineHeight: 1.15 }}>
          <span>{med.saltName}</span>
          <span style={{ color: '#9ca3af', margin: '0 0.8mm' }}>·</span>
          <span>{med.strength}</span>
        </div>
        <div
          style={{
            fontSize: '6pt',
            color: '#111827',
            lineHeight: 1.15,
            marginTop: '0.4mm',
            display: 'flex',
            alignItems: 'baseline',
            gap: '1mm',
            flexWrap: 'wrap',
          }}
        >
          <span
            data-testid="qty-box"
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '0.6mm',
              border: '0.4pt solid #111827',
              padding: '0.2mm 1mm',
              fontWeight: 700,
            }}
          >
            <span>{med.quantity}</span>
            <span
              data-testid="form-tag"
              style={{
                fontSize: '5.5pt',
                fontWeight: 600,
                color: '#4b5563',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              {formCode}
            </span>
          </span>
          <span>{med.frequency}</span>
          <span style={{ color: '#9ca3af' }}>·</span>
          <span>{med.duration}</span>
        </div>
      </div>
    </div>
  )
}

interface SlipPageProps {
  visit: Visit
  patient: Patient
  pageMedications: { med: VisitMedication; index: number }[]
  pageNum: number
  totalPages: number
}

function SlipPage({ visit, patient, pageMedications, pageNum, totalPages }: SlipPageProps) {
  return (
    <div className="dispensary-slip" data-paper-size="Slip" data-testid="slip-page" style={slipPageStyle}>
      <SlipHeader visit={visit} patient={patient} />
      <div style={{ flex: 1, marginTop: '1.5mm' }}>
        {pageMedications.map(({ med, index }) => (
          <MedBlock key={med.id} med={med} index={index} />
        ))}
      </div>
      <SlipFooter pageNum={pageNum} totalPages={totalPages} />
    </div>
  )
}

function ChunkedSlipDispensary({ visit, medications, patient }: DispensarySlipProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [chunks, setChunks] = useState<number[][] | null>(null)

  useLayoutEffect(() => {
    if (!measureRef.current) {
      setChunks([medications.map((_, i) => i)])
      return
    }
    const container = measureRef.current
    const medElements = container.querySelectorAll<HTMLElement>('[data-med-idx]')
    const heights = Array.from(medElements).map((el) => el.getBoundingClientRect().height)

    const headerEl = container.querySelector<HTMLElement>('.slip-header')
    const footerEl = container.querySelector<HTMLElement>('.slip-footer')
    const slipPx = SLIP_HEIGHT_MM * PX_PER_MM
    const paddingPx = SLIP_PADDING_MM * PX_PER_MM * 2
    const headerPx = headerEl?.getBoundingClientRect().height ?? 0
    const footerPx = footerEl?.getBoundingClientRect().height ?? 0
    // 8px safety buffer to avoid edge cases where the last med visually fits but
    // print rendering nudges it past the page break.
    const available = slipPx - paddingPx - headerPx - footerPx - 8

    setChunks(chunkByMeasuredHeight(heights, available))
  }, [medications])

  if (chunks === null) {
    // First render: hidden measurement of every med in a single page so we can
    // read individual block heights, then re-render as actual chunked pages.
    return (
      <div
        ref={measureRef}
        aria-hidden="true"
        data-testid="slip-measure-container"
        style={{ position: 'absolute', top: '-99999px', left: 0, visibility: 'hidden' }}
      >
        <SlipPage
          visit={visit}
          patient={patient}
          pageMedications={medications.map((med, index) => ({ med, index }))}
          pageNum={1}
          totalPages={1}
        />
      </div>
    )
  }

  return (
    <>
      {chunks.map((indices, pageIdx) => (
        <SlipPage
          key={pageIdx}
          visit={visit}
          patient={patient}
          pageMedications={indices.map((i) => ({ med: medications[i], index: i }))}
          pageNum={pageIdx + 1}
          totalPages={chunks.length}
        />
      ))}
    </>
  )
}
