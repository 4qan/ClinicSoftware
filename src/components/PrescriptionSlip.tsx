import type { Visit, VisitMedication, Patient } from '@/db/index'
import type { ClinicInfo } from '@/db/settings'
import type { PaperSize } from '@/db/printSettings'
import { calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS } from '@/db/printSettings'
import { buildUrduInstruction, columnHeadersUrdu, sectionHeadersUrdu } from '@/constants/translations'

interface PrescriptionSlipProps {
  visit: Visit
  medications: VisitMedication[]
  patient: Patient
  clinicInfo: ClinicInfo
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

export function PrescriptionSlip({ visit, medications, patient, clinicInfo, paperSize }: PrescriptionSlipProps) {
  const scale = calcScale(paperSize)
  const basePt = +(11 * scale).toFixed(1)
  const headerPt = +(14 * scale).toFixed(1)

  return (
    <div
      className="prescription-slip bg-white mx-auto"
      style={{
        maxWidth: `${PAPER_SIZES[paperSize].width}mm`,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: `${basePt}pt`,
        ['--urdu-line-height' as string]: URDU_LINE_HEIGHTS[paperSize],
      } as React.CSSProperties}
    >
      <div className="p-6" style={{ fontSize: `${basePt}pt` }}>
        {/* Clinic Header */}
        <div className="text-center mb-3">
          {clinicInfo.doctorName && (
            <h1 className="text-xl font-bold text-gray-900 mb-0.5" style={{ fontSize: `${headerPt}pt` }}>
              {clinicInfo.doctorName}
            </h1>
          )}
          {clinicInfo.clinicName && (
            <p className="text-sm text-gray-700 font-medium">{clinicInfo.clinicName}</p>
          )}
          {clinicInfo.address && (
            <p className="text-xs text-gray-600">{clinicInfo.address}</p>
          )}
          {clinicInfo.phone && (
            <p className="text-xs text-gray-600">Phone: {clinicInfo.phone}</p>
          )}
        </div>

        <hr className="border-gray-400 mb-3" />

        {/* Patient Info Row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-3">
          <div>
            <span className="text-gray-500">Patient: </span>
            <span className="font-medium">{patient.firstName} {patient.lastName}</span>
          </div>
          <div>
            <span className="text-gray-500">ID: </span>
            <span className="font-mono">{patient.patientId}</span>
          </div>
          <div>
            <span className="text-gray-500">Age/Gender: </span>
            <span>{patient.age}y / <span className="capitalize">{patient.gender}</span></span>
          </div>
          <div>
            <span className="text-gray-500">Date: </span>
            <span>{formatDate(visit.createdAt)}</span>
          </div>
        </div>

        {(medications.length > 0 || visit.clinicalNotes || visit.rxNotes) && (
          <hr className="border-gray-300 mb-3" />
        )}

        {/* Medication Table */}
        {medications.length > 0 && (
          <div className={visit.clinicalNotes || visit.rxNotes ? 'mb-4' : 'mb-1'}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 pr-2 font-semibold text-gray-700" style={{ width: '24px' }}>#</th>
                  {['Brand Name', 'Salt', 'Strength', 'Instructions'].map((col, idx) => (
                    <th key={col} className={`text-left py-1 ${idx < 3 ? 'pr-2' : ''} font-semibold text-gray-700`}>
                      {col}<br />
                      <span dir="rtl" className="urdu-cell" style={{ fontSize: '9pt', fontWeight: 'normal' }}>{columnHeadersUrdu[col]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medications.map((med, i) => (
                  <tr key={med.id} className="border-b border-gray-200" style={{ breakInside: 'avoid' }}>
                    <td className="py-1 pr-2 text-gray-500">{i + 1}</td>
                    <td className="py-1 pr-2 font-medium">{med.brandName}</td>
                    <td className="py-1 pr-2 text-gray-600">{med.saltName}</td>
                    <td className="py-1 pr-2">{med.strength}</td>
                    {(() => {
                      const instruction = buildUrduInstruction({ form: med.form, quantity: med.quantity, frequency: med.frequency, duration: med.duration })
                      return (
                        <td className="py-1" style={{ minWidth: '140px' }}>
                          <span className="urdu-cell" dir="rtl">{instruction.urdu}</span>
                          <br />
                          <span className="text-xs text-gray-400">{instruction.english}</span>
                        </td>
                      )
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clinical Notes */}
        {visit.clinicalNotes && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Clinical Notes / <span dir="rtl" className="urdu-cell">{sectionHeadersUrdu['Clinical Notes']}</span></h3>
            <p className="text-sm text-gray-800 whitespace-pre-line">{visit.clinicalNotes}</p>
          </div>
        )}

        {/* Rx Notes */}
        {visit.rxNotes && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Instructions / <span dir="rtl" className="urdu-cell">{sectionHeadersUrdu['Instructions']}</span>
            </h3>
            <p
              className={`text-sm whitespace-pre-line ${
                (visit.rxNotesLang ?? 'en') === 'ur' ? 'urdu-cell' : 'text-gray-800'
              }`}
              dir={(visit.rxNotesLang ?? 'en') === 'ur' ? 'rtl' : 'ltr'}
              style={(visit.rxNotesLang ?? 'en') === 'ur' ? { unicodeBidi: 'isolate' } : undefined}
            >
              {visit.rxNotes}
            </p>
          </div>
        )}

        {/* Footer */}
        <hr className={`border-gray-300 mb-2 ${visit.clinicalNotes || visit.rxNotes ? 'mt-4' : 'mt-2'}`} />
        <div className="text-xs text-gray-500">
          {clinicInfo.footerText && (
            <p className="mb-1 italic">{clinicInfo.footerText}</p>
          )}
          <div className="flex flex-wrap gap-x-4">
            {clinicInfo.doctorName && <span>{clinicInfo.doctorName}</span>}
            {clinicInfo.phone && <span>{clinicInfo.phone}</span>}
            {clinicInfo.address && <span>{clinicInfo.address}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
