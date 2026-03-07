import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CollapsibleSection } from '@/components/CollapsibleSection'
import { MedicationEntry } from '@/components/MedicationEntry'
import { MedicationList } from '@/components/MedicationList'
import { RxNotesField } from '@/components/RxNotesField'
import { getPatient } from '@/db/patients'
import { getVisit, updateVisit, deleteVisit } from '@/db/visits'
import { db } from '@/db/index'
import type { Patient } from '@/db/index'
import type { MedicationFormData } from '@/components/MedicationEntry'

export function EditVisitPage() {
  const navigate = useNavigate()
  const { id: visitId } = useParams<{ id: string }>()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [rxNotes, setRxNotes] = useState('')
  const [rxNotesLang, setRxNotesLang] = useState<'en' | 'ur'>('en')
  const [medications, setMedications] = useState<MedicationFormData[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function loadVisit() {
      if (!visitId) return

      const result = await getVisit(visitId)
      if (!result) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const p = await getPatient(result.visit.patientId)
      if (p) setPatient(p)

      setClinicalNotes(result.visit.clinicalNotes)
      setRxNotes(result.visit.rxNotes)
      setRxNotesLang(result.visit.rxNotesLang ?? 'en')
      setMedications(
        result.medications.map((m) => ({
          drugId: m.drugId,
          brandName: m.brandName,
          saltName: m.saltName,
          form: m.form,
          strength: m.strength,
          quantity: m.quantity,
          frequency: m.frequency,
          duration: m.duration,
        })),
      )
      setLoading(false)
    }

    loadVisit()
  }, [visitId])

  function handleAddMedication(med: MedicationFormData) {
    setMedications((prev) => [...prev, med])
  }

  function handleRemoveMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveVisit(): Promise<boolean> {
    if (!visitId || (!clinicalNotes.trim() && medications.length === 0)) return false
    setSaving(true)
    try {
      await updateVisit(visitId, {
        clinicalNotes: clinicalNotes.trim(),
        rxNotes: rxNotes.trim(),
        rxNotesLang,
        medications: medications.map((med, index) => ({
          drugId: med.drugId,
          brandName: med.brandName,
          saltName: med.saltName,
          form: med.form,
          strength: med.strength,
          quantity: med.quantity,
          frequency: med.frequency,
          duration: med.duration,
          sortOrder: index,
        })),
      })
      await db.settings.put({ key: 'rxNotesDefaultLang', value: rxNotesLang })
      return true
    } catch {
      setSaving(false)
      return false
    }
  }

  async function handleSave() {
    const saved = await saveVisit()
    if (saved) {
      if (patient) {
        navigate(`/patient/${patient.id}`)
      } else {
        navigate('/')
      }
    }
  }

  async function handleSaveAndPrint() {
    const saved = await saveVisit()
    if (saved && visitId) {
      navigate(`/visit/${visitId}/print`)
    }
  }

  async function handleDelete() {
    if (!visitId) return
    await deleteVisit(visitId)
    if (patient) {
      navigate(`/patient/${patient.id}`)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-gray-500">Loading visit...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Visit not found</h2>
        <p className="text-gray-500 mb-4">The visit you are looking for does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Go to Home
        </button>
      </div>
    )
  }

  const canSave = (clinicalNotes.trim() !== '' || medications.length > 0) && !saving

  const breadcrumbs = patient
    ? [
        { label: 'Home', path: '/' },
        {
          label: `${patient.firstName} ${patient.lastName}`,
          path: `/patient/${patient.id}`,
        },
        { label: 'Edit Visit' },
      ]
    : [{ label: 'Home', path: '/' }, { label: 'Edit Visit' }]

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumbs crumbs={breadcrumbs} />

      {/* Patient Section (read-only, collapsed) */}
      {patient && (
        <CollapsibleSection title="Patient" defaultOpen={false}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {patient.patientId}
              </span>
            </div>
            <p className="text-lg font-medium text-gray-900">
              {patient.firstName} {patient.lastName}
            </p>
            <p className="text-sm text-gray-600">
              {patient.age} years, <span className="capitalize">{patient.gender}</span>
            </p>
            {patient.contact && (
              <p className="text-sm text-gray-500">Contact: {patient.contact}</p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Clinical Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Clinical Notes</h3>
        <textarea
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder={'Complaint:\nExamination:\nDiagnosis:'}
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          style={{ minHeight: '120px' }}
        />
      </div>

      {/* Prescription */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Prescription</h3>
        <MedicationEntry onAdd={handleAddMedication} />
        <div className="mt-4">
          <MedicationList medications={medications} onRemove={handleRemoveMedication} />
        </div>
        <RxNotesField value={rxNotes} onChange={setRxNotes} lang={rxNotesLang} onLangChange={setRxNotesLang} />
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-base text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer transition-colors"
          style={{ minHeight: '44px' }}
        >
          Delete Visit
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-base text-gray-500 hover:text-gray-700 cursor-pointer"
            style={{ minHeight: '44px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed border border-gray-300 rounded-lg cursor-pointer transition-colors"
            style={{ minHeight: '44px' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={!canSave}
            className="px-8 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors"
            style={{ minHeight: '44px' }}
          >
            {saving ? 'Saving...' : 'Save & Print'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
