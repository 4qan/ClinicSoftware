import { Link } from 'react-router-dom'
import { PatientTable } from '@/components/PatientTable'
import { useRecentPatients } from '@/hooks/useRecentPatients'

export function HomePage() {
  const recentPatients = useRecentPatients(10)

  return (
    <div>
      {/* Register button */}
      <div className="mb-8">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
        >
          Register New Patient
        </Link>
      </div>

      {/* Recent patients - table-based */}
      {recentPatients.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Patients</h3>
          <PatientTable patients={recentPatients} />
        </div>
      )}
    </div>
  )
}
