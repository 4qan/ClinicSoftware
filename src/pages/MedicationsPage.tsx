import { useState, useEffect } from 'react'
import type { Drug } from '@/db/index'
import {
  getAllDrugsUnfiltered,
  updateDrug,
  deleteDrug,
  addCustomDrug,
  toggleDrugActive,
  resetDrugToDefault,
} from '@/db/drugs'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { MedicationModal } from '@/components/MedicationModal'

type FilterType = 'all' | 'predefined' | 'custom' | 'disabled'

interface ConfirmState {
  type: 'delete' | 'reset'
  drugId: string
}

export function MedicationsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDrug, setEditingDrug] = useState<Drug | undefined>(undefined)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadDrugs() {
    const all = await getAllDrugsUnfiltered()
    all.sort((a, b) => a.brandName.localeCompare(b.brandName))
    setDrugs(all)
    setLoading(false)
  }

  useEffect(() => {
    loadDrugs()
  }, [])

  const filtered = drugs.filter((d) => {
    // Filter pill
    if (filter === 'predefined' && d.isCustom) return false
    if (filter === 'custom' && !d.isCustom) return false
    if (filter === 'disabled' && d.isActive) return false

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      return d.brandNameLower.includes(q) || d.saltNameLower.includes(q)
    }
    return true
  })

  function openAdd() {
    setEditingDrug(undefined)
    setModalOpen(true)
  }

  function openEdit(drug: Drug) {
    setEditingDrug(drug)
    setModalOpen(true)
  }

  async function handleSave(data: { brandName: string; saltName: string; form: string; strength: string }) {
    if (editingDrug) {
      await updateDrug(editingDrug.id, data)
    } else {
      await addCustomDrug(data)
    }
    setModalOpen(false)
    setEditingDrug(undefined)
    await loadDrugs()
  }

  async function handleToggle(drug: Drug) {
    await toggleDrugActive(drug.id)
    await loadDrugs()
  }

  function requestDelete(drug: Drug) {
    setConfirm({ type: 'delete', drugId: drug.id })
  }

  function requestReset(drug: Drug) {
    setConfirm({ type: 'reset', drugId: drug.id })
  }

  async function handleConfirm() {
    if (!confirm) return
    if (confirm.type === 'delete') {
      await deleteDrug(confirm.drugId)
    } else {
      await resetDrugToDefault(confirm.drugId)
    }
    setConfirm(null)
    await loadDrugs()
  }

  const filterLabels: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'predefined', label: 'Predefined' },
    { key: 'custom', label: 'Custom' },
    { key: 'disabled', label: 'Disabled' },
  ]

  return (
    <div className="max-w-5xl">
      <Breadcrumbs crumbs={[{ label: 'Home', path: '/' }, { label: 'Medications' }]} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Medications</h2>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Add Medication
        </button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand or salt name..."
          className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg"
          style={{ minHeight: '44px' }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {filterLabels.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No medications found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="py-2 pr-4">Brand Name</th>
                <th className="py-2 pr-4">Salt Name</th>
                <th className="py-2 pr-4 hidden md:table-cell">Form</th>
                <th className="py-2 pr-4 hidden md:table-cell">Strength</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((drug) => {
                const isConfirming = confirm?.drugId === drug.id
                return (
                  <tr
                    key={drug.id}
                    className={`border-b border-gray-100 ${!drug.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{drug.brandName}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{drug.saltName}</td>
                    <td className="py-2.5 pr-4 text-gray-600 hidden md:table-cell">{drug.form}</td>
                    <td className="py-2.5 pr-4 text-gray-600 hidden md:table-cell">{drug.strength || '--'}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {drug.isCustom ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            Custom
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Predefined
                          </span>
                        )}
                        {!drug.isCustom && drug.isOverridden && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                            Edited
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      {drug.isActive ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      {isConfirming ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-700">
                            {confirm?.type === 'delete'
                              ? 'Delete this medication? This cannot be undone.'
                              : 'This will revert all changes to the original predefined values. This cannot be undone.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirm(null)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirm}
                            className={`text-xs px-2 py-1 rounded text-white ${
                              confirm?.type === 'delete'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                          >
                            {confirm?.type === 'delete' ? 'Delete' : 'Reset'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(drug)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(drug)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                          >
                            {drug.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(drug)}
                            className="text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 text-red-600"
                          >
                            Delete
                          </button>
                          {!drug.isCustom && drug.isOverridden && (
                            <button
                              type="button"
                              onClick={() => requestReset(drug)}
                              className="text-xs px-2 py-1 border border-amber-200 rounded hover:bg-amber-50 text-amber-700"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <MedicationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingDrug(undefined) }}
        onSave={handleSave}
        drug={editingDrug}
      />
    </div>
  )
}
