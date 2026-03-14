import { useState, useEffect } from 'react'
import { getClinicInfo, saveClinicInfo } from '@/db/settings'
import type { ClinicInfo } from '@/db/settings'

export function ClinicInfoSettings() {
  const [form, setForm] = useState<ClinicInfo>({
    doctorName: '',
    clinicName: '',
    address: '',
    phone: '',
    footerText: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getClinicInfo().then(setForm)
  }, [])

  function updateField(field: keyof ClinicInfo, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveClinicInfo(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Clinic Information</h3>
      <p className="text-sm text-gray-500 mb-4">
        Used in prescription print headers and footers.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="clinicDoctorName" className="block text-sm font-medium text-gray-700 mb-1">
            Doctor Name
          </label>
          <input
            id="clinicDoctorName"
            type="text"
            value={form.doctorName}
            onChange={(e) => updateField('doctorName', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
            placeholder="Dr. ..."
          />
        </div>

        <div>
          <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Name
          </label>
          <input
            id="clinicName"
            type="text"
            value={form.clinicName}
            onChange={(e) => updateField('clinicName', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
            placeholder="Clinic name"
          />
        </div>

        <div>
          <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Address
          </label>
          <textarea
            id="clinicAddress"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg resize-y"
            placeholder="Full address"
            style={{ minHeight: '60px' }}
          />
        </div>

        <div>
          <label htmlFor="clinicPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Phone
          </label>
          <input
            id="clinicPhone"
            type="text"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
            placeholder="Phone number"
          />
        </div>

        <div>
          <label htmlFor="clinicFooterText" className="block text-sm font-medium text-gray-700 mb-1">
            Footer Disclaimer
          </label>
          <textarea
            id="clinicFooterText"
            value={form.footerText}
            onChange={(e) => updateField('footerText', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg resize-y"
            placeholder="Footer text for printed prescriptions"
            style={{ minHeight: '60px' }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            style={{ minHeight: '40px' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved</span>
          )}
        </div>
      </form>
    </div>
  )
}
