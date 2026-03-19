import { pouchDb } from '@/db/pouchdb'
import type { Drug } from '@/db/index'
import { SEED_DRUGS, buildSeedId } from '@/db/seedDrugs'

function stripPouchFields<T>(doc: Record<string, unknown>): T {
  const result = { ...doc }
  delete result._id
  delete result._rev
  delete result.type
  return result as T
}

export async function searchDrugs(query: string): Promise<Drug[]> {
  const lower = query.toLowerCase().trim()
  if (!lower) return []

  const [byBrand, bySalt] = await Promise.all([
    pouchDb.find({
      selector: { type: 'drug', isActive: true, brandNameLower: { $gte: lower, $lte: lower + '\uffff' } },
      limit: 15,
    }),
    pouchDb.find({
      selector: { type: 'drug', isActive: true, saltNameLower: { $gte: lower, $lte: lower + '\uffff' } },
      limit: 15,
    }),
  ])

  const seen = new Set<string>()
  const results: Drug[] = []
  for (const d of [...byBrand.docs, ...bySalt.docs]) {
    const drug = stripPouchFields<Drug>(d as Record<string, unknown>)
    const key = `${drug.brandNameLower}|${drug.saltNameLower}|${drug.form}|${drug.strength}`
    if (!seen.has(key)) {
      seen.add(key)
      results.push(drug)
    }
    if (results.length >= 10) break
  }
  return results
}

export async function addCustomDrug(
  data: Pick<Drug, 'brandName' | 'saltName' | 'form' | 'strength'>
): Promise<string> {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const drug: Drug = {
    id,
    brandName: data.brandName,
    brandNameLower: data.brandName.toLowerCase(),
    saltName: data.saltName,
    saltNameLower: data.saltName.toLowerCase(),
    form: data.form,
    strength: data.strength,
    isCustom: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
  await pouchDb.put({
    ...drug,
    _id: 'drug:' + id,
    type: 'drug',
  } as PouchDB.Core.PutDocument<Record<string, unknown>>)
  return id
}

export async function updateDrug(
  id: string,
  data: Partial<Pick<Drug, 'brandName' | 'saltName' | 'form' | 'strength'>>
): Promise<void> {
  const doc = await pouchDb.get('drug:' + id)
  if (!doc) throw new Error('Drug not found')

  const existing = stripPouchFields<Drug>(doc as Record<string, unknown>)
  const updates: Partial<Drug> & Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() }
  if (!existing.isCustom) {
    updates.isOverridden = true
    if (!existing.seedKey) {
      updates.seedKey = buildSeedId({
        brandName: existing.brandName,
        saltName: existing.saltName,
        form: existing.form,
        strength: existing.strength,
      })
    }
  }
  if (data.brandName !== undefined) {
    updates.brandNameLower = data.brandName.toLowerCase()
  }
  if (data.saltName !== undefined) {
    updates.saltNameLower = data.saltName.toLowerCase()
  }

  await pouchDb.put({
    ...(doc as Record<string, unknown>),
    ...updates,
  } as PouchDB.Core.PutDocument<Record<string, unknown>>)
}

/** @deprecated Use updateDrug instead */
export async function updateCustomDrug(
  id: string,
  data: Partial<Pick<Drug, 'brandName' | 'saltName' | 'form' | 'strength'>>
): Promise<void> {
  return updateDrug(id, data)
}

export async function toggleDrugActive(id: string): Promise<void> {
  const doc = await pouchDb.get('drug:' + id)
  if (!doc) throw new Error('Drug not found')

  const existing = stripPouchFields<Drug>(doc as Record<string, unknown>)
  await pouchDb.put({
    ...(doc as Record<string, unknown>),
    isActive: !existing.isActive,
    updatedAt: new Date().toISOString(),
  } as PouchDB.Core.PutDocument<Record<string, unknown>>)
}

export async function deleteDrug(id: string): Promise<void> {
  const doc = await pouchDb.get('drug:' + id)
  if (!doc) throw new Error('Drug not found')
  await pouchDb.remove(doc as PouchDB.Core.RemoveDocument)
}

/** @deprecated Use deleteDrug instead */
export async function deleteCustomDrug(id: string): Promise<void> {
  return deleteDrug(id)
}

export async function resetDrugToDefault(id: string): Promise<void> {
  const doc = await pouchDb.get('drug:' + id)
  if (!doc) throw new Error('Drug not found')

  const existing = stripPouchFields<Drug>(doc as Record<string, unknown>)
  if (existing.isCustom) throw new Error('Custom drugs have no default to reset to')

  // Match by: deterministic seed ID -> stored seedKey -> partial property match
  let seedEntry = SEED_DRUGS.find(entry => buildSeedId(entry) === id)
  if (!seedEntry && existing.seedKey) {
    seedEntry = SEED_DRUGS.find(entry => buildSeedId(entry) === existing.seedKey)
  }
  if (!seedEntry) {
    const matches = SEED_DRUGS.filter(entry =>
      entry.brandName.toLowerCase() === existing.brandNameLower &&
      entry.form === existing.form &&
      entry.strength === existing.strength
    )
    if (matches.length === 1) seedEntry = matches[0]
  }
  if (!seedEntry) throw new Error('No seed entry found for this drug')

  await pouchDb.put({
    ...(doc as Record<string, unknown>),
    brandName: seedEntry.brandName,
    brandNameLower: seedEntry.brandName.toLowerCase(),
    saltName: seedEntry.saltName,
    saltNameLower: seedEntry.saltName.toLowerCase(),
    form: seedEntry.form,
    strength: seedEntry.strength,
    isOverridden: false,
    seedKey: undefined,
    isActive: true,
    updatedAt: new Date().toISOString(),
  } as PouchDB.Core.PutDocument<Record<string, unknown>>)
}

export async function getCustomDrugs(): Promise<Drug[]> {
  const result = await pouchDb.find({
    selector: { type: 'drug', isCustom: true },
    limit: 5000,
  })
  return result.docs.map(d => stripPouchFields<Drug>(d as Record<string, unknown>))
}

export async function getAllDrugs(): Promise<Drug[]> {
  const result = await pouchDb.find({
    selector: { type: 'drug', isActive: true },
    limit: 5000,
  })
  return result.docs.map(d => stripPouchFields<Drug>(d as Record<string, unknown>))
}

export async function getAllDrugsUnfiltered(): Promise<Drug[]> {
  const result = await pouchDb.allDocs({
    startkey: 'drug:',
    endkey: 'drug:\uffff',
    include_docs: true,
  })
  return result.rows
    .filter(row => row.doc && !(row.doc as Record<string, unknown>)._deleted)
    .map(row => stripPouchFields<Drug>(row.doc as Record<string, unknown>))
}
