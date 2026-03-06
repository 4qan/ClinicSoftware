import { PatientTable } from '@/components/PatientTable'
import { useRecentPatients } from '@/hooks/useRecentPatients'

export function HomePage() {
  const recentPatients = useRecentPatients(10)

  return (
    <div>
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
