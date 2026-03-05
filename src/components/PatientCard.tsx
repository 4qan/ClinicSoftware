import { useNavigate } from 'react-router-dom'
import type { Patient } from '@/db/index'

interface PatientCardProps {
  patient: Patient
}

export function PatientCard({ patient }: PatientCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/patient/${patient.id}`)}
      className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
    >
      <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
        {patient.patientId}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-medium text-gray-900 truncate">
          {patient.firstName} {patient.lastName}
        </p>
        <p className="text-sm text-gray-500">
          {patient.age}y, <span className="capitalize">{patient.gender}</span>
          {patient.contact && <span className="ml-2">{patient.contact}</span>}
        </p>
      </div>
    </button>
  )
}
