import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getPatientVisits } from '@/db/visits'
import { VisitCard } from './VisitCard'
import type { Visit, VisitMedication } from '@/db/index'

interface VisitHistorySectionProps {
  patientId: string
}

export function VisitHistorySection({ patientId }: VisitHistorySectionProps) {
  const [visits, setVisits] = useState<Array<{ visit: Visit; medications: VisitMedication[] }>>([])
  const [loading, setLoading] = useState(true)

  const loadVisits = useCallback(async () => {
    setLoading(true)
    const results = await getPatientVisits(patientId)
    setVisits(results)
    setLoading(false)
  }, [patientId])

  useEffect(() => {
    loadVisits()
  }, [loadVisits])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Visit History</h3>
        <Link
          to={`/visit/new?patientId=${patientId}`}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          New Visit
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-4">Loading visits...</p>
      ) : visits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-400">No visits recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start by creating a new visit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v, index) => (
            <VisitCard
              key={v.visit.id}
              visit={v.visit}
              medications={v.medications}
              defaultExpanded={index === 0}
              onDeleted={loadVisits}
            />
          ))}
        </div>
      )}
    </div>
  )
}
