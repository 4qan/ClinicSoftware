import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/index'
import { PatientTable } from '@/components/PatientTable'

export function PatientsPage() {
  const patients = useLiveQuery(() => db.patients.orderBy('createdAt').reverse().toArray()) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <Link
          to="/register"
          className="px-4 py-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
        >
          Register New Patient
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-gray-400 mb-4">No patients registered yet</p>
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-800 font-medium text-base"
          >
            Register First Patient
          </Link>
        </div>
      ) : (
        <PatientTable patients={patients} />
      )}
    </div>
  )
}
