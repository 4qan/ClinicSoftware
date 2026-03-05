import { PatientCard } from './PatientCard'
import type { Patient } from '@/db/index'

interface RecentPatientsProps {
  patients: Patient[]
}

export function RecentPatients({ patients }: RecentPatientsProps) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-400">No recent patients</p>
        <p className="text-sm text-gray-400 mt-1">Recently viewed or registered patients will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  )
}
