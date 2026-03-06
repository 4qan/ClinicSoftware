import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/index'
import { PatientTable } from '@/components/PatientTable'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export function PatientsPage() {
  const patients = useLiveQuery(() => db.patients.orderBy('createdAt').reverse().toArray()) ?? []

  return (
    <div>
      <Breadcrumbs crumbs={[{ label: 'Home', path: '/' }, { label: 'Patients' }]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patients</h2>

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
