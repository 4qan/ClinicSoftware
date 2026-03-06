import type { Visit, VisitMedication, Patient } from '@/db/index'
import type { ClinicInfo } from '@/db/settings'

interface PrescriptionSlipProps {
  visit: Visit
  medications: VisitMedication[]
  patient: Patient
  clinicInfo: ClinicInfo
}

export function PrescriptionSlip({ visit, medications, patient, clinicInfo }: PrescriptionSlipProps) {
  return (
    <div className="prescription-slip">
      <p>Prescription for {patient.firstName} {patient.lastName}</p>
    </div>
  )
}
