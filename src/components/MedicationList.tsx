import type { MedicationFormData } from './MedicationEntry'
import { formatDosageDisplay } from '@/constants/translations'

interface MedicationListProps {
  medications: MedicationFormData[]
  onRemove: (index: number) => void
  onToggleSlip: (index: number) => void
}

function formatDrugName(med: MedicationFormData): string {
  if (med.saltName) {
    return `${med.brandName} (${med.saltName})`
  }
  return med.brandName
}

export function MedicationList({ medications, onRemove, onToggleSlip }: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">No medications added yet</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-3 text-sm font-medium text-gray-500 w-10">#</th>
              <th className="py-2 pr-3 text-sm font-medium text-gray-500">Drug Name</th>
              <th className="py-2 pr-3 text-sm font-medium text-gray-500">Dosage</th>
              <th className="py-2 pr-3 text-sm font-medium text-gray-500">Frequency</th>
              <th className="py-2 pr-3 text-sm font-medium text-gray-500">Duration</th>
              <th className="py-2 pr-3 text-sm font-medium text-gray-500 w-16">Rx</th>
              <th className="py-2 text-sm font-medium text-gray-500 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}
              >
                <td className="py-3 pr-3 text-sm text-gray-500">{index + 1}</td>
                <td className="py-3 pr-3 text-sm font-medium text-gray-900">
                  {formatDrugName(med)}
                </td>
                <td className="py-3 pr-3 text-sm text-gray-700">{formatDosageDisplay(med.form, med.quantity)}</td>
                <td className="py-3 pr-3 text-sm text-gray-700">{med.frequency}</td>
                <td className="py-3 pr-3 text-sm text-gray-700">{med.duration}</td>
                <td className="py-3 pr-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={med.slipType === 'prescription'}
                    aria-label={`Slip type for ${med.brandName}`}
                    onClick={() => onToggleSlip(index)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      med.slipType === 'prescription' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        med.slipType === 'prescription' ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onRemove(index)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {medications.map((med, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {index + 1}. {formatDrugName(med)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatDosageDisplay(med.form, med.quantity)} | {med.frequency} | {med.duration}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={med.slipType === 'prescription'}
                aria-label={`Slip type for ${med.brandName}`}
                onClick={() => onToggleSlip(index)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  med.slipType === 'prescription' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    med.slipType === 'prescription' ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onRemove(index)}
                className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
