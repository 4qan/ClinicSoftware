import type { Visit, VisitMedication, Patient } from '@/db/index'

interface DispensarySlipProps {
  visit: Visit
  medications: VisitMedication[]
  patient: Patient
}

export function DispensarySlip({ visit, medications, patient }: DispensarySlipProps) {
  return (
    <div className="dispensary-slip">
      <p>Dispensary slip for {patient.firstName} {patient.lastName}</p>
    </div>
  )
}
