import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Visit, VisitMedication } from '@/db/index'
import { deleteVisit } from '@/db/visits'
import { formatDosageDisplay } from '@/constants/translations'

interface VisitCardProps {
  visit: Visit
  medications: VisitMedication[]
  defaultExpanded?: boolean
  onDeleted?: () => void
}

function formatVisitDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function truncateText(text: string, maxLength: number): string {
  const firstLine = text.split('\n')[0]
  if (firstLine.length <= maxLength) return firstLine
  return firstLine.substring(0, maxLength) + '...'
}

export function VisitCard({ visit, medications, defaultExpanded = false, onDeleted }: VisitCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPrintDropdown, setShowPrintDropdown] = useState(false)
  const printDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPrintDropdown) return
    function handleClickOutside(e: MouseEvent) {
      if (printDropdownRef.current && !printDropdownRef.current.contains(e.target as Node)) {
        setShowPrintDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPrintDropdown])

  async function handleDelete() {
    setDeleting(true)
    await deleteVisit(visit.id)
    setShowDeleteConfirm(false)
    setDeleting(false)
    onDeleted?.()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg border-l-4 border-l-blue-600">
      {/* Collapsed header (always visible) */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 py-3 text-left cursor-pointer flex items-center justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-900">
              {formatVisitDate(visit.createdAt)}
            </span>
            {medications.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
                {medications.length} medication{medications.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {visit.clinicalNotes && (
            <p className="text-sm text-gray-500 mt-1 truncate">
              {truncateText(visit.clinicalNotes, 80)}
            </p>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Clinical Notes */}
          {visit.clinicalNotes && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Clinical Notes
              </h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{visit.clinicalNotes}</p>
            </div>
          )}

          {/* Medications Table */}
          {medications.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Medications
              </h4>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-1.5 pr-3 font-medium text-gray-500">Drug</th>
                      <th className="py-1.5 pr-3 font-medium text-gray-500">Dosage</th>
                      <th className="py-1.5 pr-3 font-medium text-gray-500">Frequency</th>
                      <th className="py-1.5 font-medium text-gray-500">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr key={med.id} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 text-gray-900">
                          {med.brandName}
                          {med.saltName && (
                            <span className="text-gray-500"> ({med.saltName}{med.strength ? ` ${med.strength}` : ''}{med.form ? ` ${med.form}` : ''})</span>
                          )}
                          {med.slipType === 'prescription' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1.5">Rx</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 text-gray-700">{formatDosageDisplay(med.form, med.quantity)}</td>
                        <td className="py-1.5 pr-3 text-gray-700">{med.frequency}</td>
                        <td className="py-1.5 text-gray-700">{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card list */}
              <div className="md:hidden space-y-2">
                {medications.map((med) => (
                  <div key={med.id} className="bg-gray-50 rounded p-2 text-sm">
                    <p className="font-medium text-gray-900">
                      {med.brandName}
                      {med.saltName && (
                        <span className="text-gray-500 font-normal"> ({med.saltName})</span>
                      )}
                      {med.slipType === 'prescription' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1.5">Rx</span>
                      )}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {formatDosageDisplay(med.form, med.quantity)} | {med.frequency} | {med.duration}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rx Notes */}
          {visit.rxNotes && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Rx Notes
              </h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{visit.rxNotes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="relative flex items-center" ref={printDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPrintDropdown((prev) => !prev)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Print
              </button>
              {showPrintDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                  <Link
                    to={`/visit/${visit.id}/print?auto=prescription`}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowPrintDropdown(false)}
                  >
                    Print Prescription
                  </Link>
                  <Link
                    to={`/visit/${visit.id}/print?auto=dispensary`}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowPrintDropdown(false)}
                  >
                    Print Dispensary
                  </Link>
                  <Link
                    to={`/visit/${visit.id}/print`}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                    onClick={() => setShowPrintDropdown(false)}
                  >
                    Preview
                  </Link>
                </div>
              )}
            </div>
            <Link
              to={`/visit/${visit.id}/edit`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Visit?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. The visit and all associated medications will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
