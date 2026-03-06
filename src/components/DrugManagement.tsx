import { useState, useEffect, type FormEvent } from 'react'
import { ComboBox } from '@/components/ComboBox'
import { MEDICATION_FORMS } from '@/constants/clinical'
import {
  addCustomDrug,
  updateCustomDrug,
  deleteCustomDrug,
  toggleDrugActive,
  getCustomDrugs,
} from '@/db/drugs'
import type { Drug } from '@/db/index'

interface DrugFormData {
  brandName: string
  saltName: string
  form: string
  strength: string
}

const emptyForm: DrugFormData = { brandName: '', saltName: '', form: '', strength: '' }

function AddDrugForm({ onAdded }: { onAdded: () => void }) {
  const [data, setData] = useState<DrugFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof DrugFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!data.brandName.trim()) errs.brandName = 'Brand name is required'
    if (!data.saltName.trim()) errs.saltName = 'Salt/generic name is required'
    if (!data.form.trim()) errs.form = 'Form is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await addCustomDrug({
        brandName: data.brandName.trim(),
        saltName: data.saltName.trim(),
        form: data.form.trim(),
        strength: data.strength.trim(),
      })
      setData(emptyForm)
      setErrors({})
      onAdded()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
          <input
            type="text"
            value={data.brandName}
            onChange={(e) => setData({ ...data, brandName: e.target.value })}
            className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.brandName ? 'border-red-500' : 'border-gray-200'
            }`}
            style={{ minHeight: '44px' }}
            placeholder="e.g. Panadol"
          />
          {errors.brandName && <p className="mt-1 text-sm text-red-600">{errors.brandName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salt / Generic Name</label>
          <input
            type="text"
            value={data.saltName}
            onChange={(e) => setData({ ...data, saltName: e.target.value })}
            className={`w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.saltName ? 'border-red-500' : 'border-gray-200'
            }`}
            style={{ minHeight: '44px' }}
            placeholder="e.g. Paracetamol"
          />
          {errors.saltName && <p className="mt-1 text-sm text-red-600">{errors.saltName}</p>}
        </div>
        <ComboBox
          options={MEDICATION_FORMS}
          value={data.form}
          onChange={(v) => setData({ ...data, form: v })}
          label="Form"
          placeholder="e.g. Tablet"
          error={errors.form}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strength (optional)</label>
          <input
            type="text"
            value={data.strength}
            onChange={(e) => setData({ ...data, strength: e.target.value })}
            className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            style={{ minHeight: '44px' }}
            placeholder="e.g. 500mg"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
      >
        {isSubmitting ? 'Adding...' : 'Add Drug'}
      </button>
    </form>
  )
}

function DrugRow({
  drug,
  onUpdated,
}: {
  drug: Drug
  onUpdated: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<DrugFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof DrugFormData, string>>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  function startEdit() {
    setEditData({
      brandName: drug.brandName,
      saltName: drug.saltName,
      form: drug.form,
      strength: drug.strength,
    })
    setErrors({})
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    setErrors({})
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!editData.brandName.trim()) errs.brandName = 'Required'
    if (!editData.saltName.trim()) errs.saltName = 'Required'
    if (!editData.form.trim()) errs.form = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    await updateCustomDrug(drug.id, {
      brandName: editData.brandName.trim(),
      saltName: editData.saltName.trim(),
      form: editData.form.trim(),
      strength: editData.strength.trim(),
    })
    setIsEditing(false)
    onUpdated()
  }

  async function handleToggle() {
    await toggleDrugActive(drug.id)
    onUpdated()
  }

  async function handleDelete() {
    await deleteCustomDrug(drug.id)
    onUpdated()
  }

  if (isEditing) {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={editData.brandName}
              onChange={(e) => setEditData({ ...editData, brandName: e.target.value })}
              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                errors.brandName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brand Name"
            />
            {errors.brandName && <p className="text-xs text-red-600">{errors.brandName}</p>}
          </div>
          <div>
            <input
              type="text"
              value={editData.saltName}
              onChange={(e) => setEditData({ ...editData, saltName: e.target.value })}
              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                errors.saltName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Salt Name"
            />
            {errors.saltName && <p className="text-xs text-red-600">{errors.saltName}</p>}
          </div>
          <ComboBox
            options={MEDICATION_FORMS}
            value={editData.form}
            onChange={(v) => setEditData({ ...editData, form: v })}
            placeholder="Form"
            error={errors.form}
          />
          <input
            type="text"
            value={editData.strength}
            onChange={(e) => setEditData({ ...editData, strength: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="Strength"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 py-2.5 border-b border-gray-100 last:border-b-0 ${
        drug.isActive ? '' : 'opacity-50'
      }`}
    >
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-900 text-sm">{drug.brandName}</span>
        <span className="text-gray-500 text-sm ml-1">
          ({drug.saltName}{drug.strength ? ` ${drug.strength}` : ''} {drug.form})
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={startEdit}
          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleToggle}
          className={`px-2 py-1 text-xs rounded ${
            drug.isActive
              ? 'text-yellow-700 hover:bg-yellow-50'
              : 'text-green-700 hover:bg-green-50'
          }`}
        >
          {drug.isActive ? 'Disable' : 'Enable'}
        </button>
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              className="px-2 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded font-medium"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export function DrugManagement() {
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadDrugs() {
    setIsLoading(true)
    const list = await getCustomDrugs()
    setDrugs(list)
    setIsLoading(false)
  }

  useEffect(() => {
    loadDrugs()
  }, [])

  const filtered = filter
    ? drugs.filter(d =>
        d.brandName.toLowerCase().includes(filter.toLowerCase()) ||
        d.saltName.toLowerCase().includes(filter.toLowerCase())
      )
    : drugs

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Drug Management</h3>

      <div className="mb-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Custom Drug</h4>
        <AddDrugForm onAdded={loadDrugs} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Custom Drugs</h4>

        {drugs.length > 3 && (
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter custom drugs..."
            className="w-full px-3 py-2 mb-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
        ) : drugs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No custom drugs added yet. Use the form above to add your own medications.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No drugs match your filter.
          </p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filtered.map((drug) => (
              <DrugRow key={drug.id} drug={drug} onUpdated={loadDrugs} />
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Pre-loaded medications cannot be edited. Add custom medications above to supplement the built-in drug list.
      </p>
    </div>
  )
}
