import { useNavigate } from 'react-router-dom'
import type { Patient } from '@/db/index'

interface PatientTableProps {
  patients: Patient[]
}

export function PatientTable({ patients }: PatientTableProps) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
            <th className="px-4 py-3">Patient ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Age</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Contact</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => navigate(`/patient/${patient.id}`)}
              className="bg-white border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-base">
                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {patient.patientId}
                </span>
              </td>
              <td className="px-4 py-3 text-base font-medium text-gray-900">
                {patient.firstName} {patient.lastName}
              </td>
              <td className="px-4 py-3 text-base text-gray-700">
                {patient.age}y
              </td>
              <td className="px-4 py-3 text-base text-gray-700 capitalize">
                {patient.gender}
              </td>
              <td className="px-4 py-3 text-base text-gray-700">
                {patient.contact || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
