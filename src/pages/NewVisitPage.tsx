import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CollapsibleSection } from '@/components/CollapsibleSection'
import { MedicationEntry } from '@/components/MedicationEntry'
import { MedicationList } from '@/components/MedicationList'
import { RxNotesField } from '@/components/RxNotesField'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import { getPatient, registerPatient } from '@/db/patients'
import { usePatientSearch } from '@/hooks/usePatientSearch'
import { createVisit } from '@/db/visits'
import { getPatientVisits } from '@/db/visits'
import { db } from '@/db/index'
import type { Patient } from '@/db/index'
import type { PatientInput } from '@/db/patients'
import type { MedicationFormData } from '@/components/MedicationEntry'

export function NewVisitPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedPatientId = searchParams.get('patientId')

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientQuery, setPatientQuery] = useState('')
  const { results: patientResults, isSearching: isPatientSearching } = usePatientSearch(patientQuery)

  const [clinicalNotes, setClinicalNotes] = useState('')
  const [rxNotes, setRxNotes] = useState('')
  const [rxNotesLang, setRxNotesLang] = useState<'en' | 'ur'>('en')
  const [medications, setMedications] = useState<MedicationFormData[]>([])
  const [saving, setSaving] = useState(false)
  const [showInlineRegistration, setShowInlineRegistration] = useState(false)

  const [visitHistory, setVisitHistory] = useState<
    Array<{ id: string; date: string; notePreview: string; medCount: number }>
  >([])

  // Load pre-selected patient
  useEffect(() => {
    if (preselectedPatientId) {
      getPatient(preselectedPatientId).then((p) => {
        if (p) setSelectedPatient(p)
      })
    }
  }, [preselectedPatientId])

  // Load sticky language preference
  useEffect(() => {
    db.settings.get('rxNotesDefaultLang').then((setting) => {
      if (setting && (setting.value === 'en' || setting.value === 'ur')) {
        setRxNotesLang(setting.value)
      }
    })
  }, [])

  // Load visit history when patient changes
  const loadVisitHistory = useCallback(async () => {
    if (!selectedPatient) {
      setVisitHistory([])
      return
    }
    const visits = await getPatientVisits(selectedPatient.id)
    setVisitHistory(
      visits.slice(0, 5).map((v) => ({
        id: v.visit.id,
        date: new Date(v.visit.createdAt).toLocaleDateString('en-PK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        notePreview:
          v.visit.clinicalNotes.length > 100
            ? v.visit.clinicalNotes.substring(0, 100) + '...'
            : v.visit.clinicalNotes,
        medCount: v.medications.length,
      })),
    )
  }, [selectedPatient])

  useEffect(() => {
    loadVisitHistory()
  }, [loadVisitHistory])

  function handleSelectPatient(patient: Patient) {
    setSelectedPatient(patient)
    setPatientQuery('')
    setShowInlineRegistration(false)
  }

  function parseQueryName(query: string): { firstName: string; lastName: string } {
    const parts = query.trim().split(/\s+/)
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    }
  }

  async function handleInlineRegister(data: PatientInput) {
    const patient = await registerPatient(data)
    setSelectedPatient(patient)
    setShowInlineRegistration(false)
    setPatientQuery('')
  }

  function handleAddMedication(med: MedicationFormData) {
    setMedications((prev) => [...prev, med])
  }

  function handleRemoveMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveVisit(): Promise<string | null> {
    if (!selectedPatient || (!clinicalNotes.trim() && medications.length === 0)) return null
    setSaving(true)
    try {
      const visitId = await createVisit({
        patientId: selectedPatient.id,
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
      return visitId
    } catch {
      setSaving(false)
      return null
    }
  }

  async function handleSave() {
    const visitId = await saveVisit()
    if (visitId && selectedPatient) {
      navigate(`/patient/${selectedPatient.id}`)
    }
  }

  async function handleSaveAndPrint() {
    const visitId = await saveVisit()
    if (visitId) {
      navigate(`/visit/${visitId}/print`)
    }
  }

  const canSave = selectedPatient !== null && (clinicalNotes.trim() !== '' || medications.length > 0) && !saving
  const isDisabled = !selectedPatient

  const breadcrumbs = selectedPatient
    ? [
        { label: 'Home', path: '/' },
        {
          label: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          path: `/patient/${selectedPatient.id}`,
        },
        { label: 'New Visit' },
      ]
    : [{ label: 'Home', path: '/' }, { label: 'New Visit' }]

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumbs crumbs={breadcrumbs} />

      {/* Patient Section */}
      <CollapsibleSection
        title="Patient"
        defaultOpen={!preselectedPatientId}
        badge={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : undefined}
      >
        {selectedPatient ? (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {selectedPatient.patientId}
                </span>
              </div>
              <p className="text-lg font-medium text-gray-900">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {selectedPatient.age} years, <span className="capitalize">{selectedPatient.gender}</span>
              </p>
              {selectedPatient.contact && (
                <p className="text-sm text-gray-500">Contact: {selectedPatient.contact}</p>
              )}
            </div>
            {!preselectedPatientId && (
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Change
              </button>
            )}
          </div>
        ) : showInlineRegistration ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Create New Patient</h4>
              <button
                type="button"
                onClick={() => setShowInlineRegistration(false)}
                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Back to search
              </button>
            </div>
            <PatientRegistrationForm
              initialFirstName={parseQueryName(patientQuery).firstName}
              initialLastName={parseQueryName(patientQuery).lastName}
              onSubmit={handleInlineRegister}
              onCancel={() => setShowInlineRegistration(false)}
              submitLabel="Create & Select"
              compact
            />
          </div>
        ) : (
          <div>
            <div className="relative">
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="Search patient by name, ID, or contact..."
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: '44px' }}
              />
              {patientQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {isPatientSearching ? (
                    <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
                  ) : patientResults.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowInlineRegistration(true)}
                      className="w-full p-3 text-center text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      Create &lsquo;{patientQuery.trim()}&rsquo; as new patient
                    </button>
                  ) : (
                    patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                      >
                        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {p.patientId}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {p.firstName} {p.lastName}
                        </span>
                        {p.contact && (
                          <span className="text-xs text-gray-500 ml-auto">{p.contact}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Link
              to="/register"
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Register New Patient
            </Link>
          </div>
        )}
      </CollapsibleSection>

      {/* Visit History - conditionally rendered (no meaningful empty state) */}
      {selectedPatient && (
        <CollapsibleSection
          title="Visit History"
          defaultOpen={false}
          badge={visitHistory.length > 0 ? visitHistory.length : undefined}
        >
          {visitHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No previous visits</p>
          ) : (
            <div className="space-y-2">
              {visitHistory.map((v) => (
                <div
                  key={v.id}
                  className="border border-gray-100 rounded-lg p-3 flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{v.date}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{v.notePreview || 'No notes'}</p>
                  </div>
                  {v.medCount > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {v.medCount} med{v.medCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ))}
              <Link
                to={`/patient/${selectedPatient.id}`}
                className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium mt-1"
              >
                Show all visits
              </Link>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Clinical Notes - always visible, disabled without patient */}
      <fieldset disabled={isDisabled}>
        <div className={`bg-white border border-gray-200 rounded-lg p-6${isDisabled ? ' opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Clinical Notes</h3>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder={'Complaint:\nExamination:\nDiagnosis:'}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            style={{ minHeight: '120px' }}
          />
        </div>
      </fieldset>

      {/* Prescription - always visible, disabled without patient */}
      <fieldset disabled={isDisabled}>
        <div className={`bg-white border border-gray-200 rounded-lg p-6${isDisabled ? ' opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Prescription</h3>
          <MedicationEntry onAdd={handleAddMedication} />
          <div className="mt-4">
            <MedicationList medications={medications} onRemove={handleRemoveMedication} />
          </div>
          <RxNotesField value={rxNotes} onChange={setRxNotes} lang={rxNotesLang} onLangChange={setRxNotesLang} />
        </div>
      </fieldset>

      {/* Action Bar - always visible, disabled without patient */}
      <fieldset disabled={isDisabled}>
        <div className={`flex items-center justify-end gap-3${isDisabled ? ' opacity-50 pointer-events-none' : ''}`}>
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
            {saving ? 'Saving...' : 'Save Visit'}
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
      </fieldset>
    </div>
  )
}
