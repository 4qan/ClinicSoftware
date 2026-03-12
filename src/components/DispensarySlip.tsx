import type { Visit, VisitMedication, Patient } from '@/db/index'
import { calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS } from '@/db/printSettings'
import type { PaperSize } from '@/db/printSettings'

interface DispensarySlipProps {
  visit: Visit
  medications: VisitMedication[]
  patient: Patient
  paperSize: PaperSize
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function DispensarySlip({ visit, medications, patient, paperSize }: DispensarySlipProps) {
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
        '--urdu-line-height': URDU_LINE_HEIGHTS[paperSize],
      } as React.CSSProperties}
    >
      <div style={{ padding: `${(4 * scale).toFixed(1)}mm` }}>
        {/* Header */}
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

        {/* Medication Table */}
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
