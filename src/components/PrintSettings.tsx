import { useState, useEffect } from 'react'
import {
  getPrintSettings,
  savePrintSetting,
  PAPER_SIZE_ORDER,
  PAPER_SIZES,
} from '@/db/printSettings'
import type { PaperSize } from '@/db/printSettings'

export function PrintSettings() {
  const [prescriptionSize, setPrescriptionSize] = useState<PaperSize>('A5')
  const [dispensarySize, setDispensarySize] = useState<PaperSize>('A5')

  useEffect(() => {
    getPrintSettings().then((settings) => {
      setPrescriptionSize(settings.prescriptionSize)
      setDispensarySize(settings.dispensarySize)
    })
  }, [])

  async function handlePrescriptionChange(value: PaperSize) {
    setPrescriptionSize(value)
    await savePrintSetting('printPrescriptionSize', value)
  }

  async function handleDispensaryChange(value: PaperSize) {
    setDispensarySize(value)
    await savePrintSetting('printDispensarySize', value)
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Print</h3>
      <p className="text-sm text-gray-500 mb-6">
        Set paper sizes for each slip type. Changes apply to all future prints.
      </p>

      <div className="space-y-4">
        {/* Prescription Slip */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label
            htmlFor="prescriptionSize"
            className="block text-sm font-semibold text-gray-900 mb-3"
          >
            Prescription Slip
          </label>
          <select
            id="prescriptionSize"
            value={prescriptionSize}
            onChange={(e) => handlePrescriptionChange(e.target.value as PaperSize)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
          >
            {PAPER_SIZE_ORDER.map((size) => (
              <option key={size} value={size}>
                {PAPER_SIZES[size].label}
              </option>
            ))}
          </select>
        </div>

        {/* Dispensary Slip */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label
            htmlFor="dispensarySize"
            className="block text-sm font-semibold text-gray-900 mb-3"
          >
            Dispensary Slip
          </label>
          <select
            id="dispensarySize"
            value={dispensarySize}
            onChange={(e) => handleDispensaryChange(e.target.value as PaperSize)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
          >
            {PAPER_SIZE_ORDER.map((size) => (
              <option key={size} value={size}>
                {PAPER_SIZES[size].label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
