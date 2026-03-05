import { Link } from 'react-router-dom'
import { RecentPatients } from '@/components/RecentPatients'
import { useRecentPatients } from '@/hooks/useRecentPatients'

export function HomePage() {
  const recentPatients = useRecentPatients(10)

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Register button */}
      <div className="mb-8 text-center">
        <Link
          to="/register"
          className="inline-block px-8 py-3 text-lg font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
        >
          Register New Patient
        </Link>
      </div>

      {/* Recent patients - only show when there are patients */}
      {recentPatients.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Patients</h3>
          <RecentPatients patients={recentPatients} />
        </div>
      )}
    </div>
  )
}
