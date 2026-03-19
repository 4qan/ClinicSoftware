import { db } from '@/db/index'
import type { Drug } from '@/db/index'
import { SEED_DRUGS, buildSeedId } from '@/db/seedDrugs'

export async function searchDrugs(query: string): Promise<Drug[]> {
  const lower = query.toLowerCase().trim()
  if (!lower) return []

  const byBrand = await db.drugs
    .where('brandNameLower').startsWith(lower)
    .and(d => d.isActive)
    .limit(15)
    .toArray()

  const bySalt = await db.drugs
    .where('saltNameLower').startsWith(lower)
    .and(d => d.isActive)
    .limit(15)
    .toArray()

  const seen = new Set<string>()
  const results: Drug[] = []
  for (const d of [...byBrand, ...bySalt]) {
    const key = `${d.brandNameLower}|${d.saltNameLower}|${d.form}|${d.strength}`
    if (!seen.has(key)) {
      seen.add(key)
      results.push(d)
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
  await db.drugs.add(drug)
  return id
}

export async function updateDrug(
  id: string,
  data: Partial<Pick<Drug, 'brandName' | 'saltName' | 'form' | 'strength'>>
): Promise<void> {
  const existing = await db.drugs.get(id)
  if (!existing) throw new Error('Drug not found')

  const updates: Partial<Drug> = { ...data, updatedAt: new Date().toISOString() }
  if (!existing.isCustom) {
    updates.isOverridden = true
  }
  if (data.brandName !== undefined) {
    updates.brandNameLower = data.brandName.toLowerCase()
  }
  if (data.saltName !== undefined) {
    updates.saltNameLower = data.saltName.toLowerCase()
  }
  await db.drugs.update(id, updates)
}

/** @deprecated Use updateDrug instead */
export async function updateCustomDrug(
  id: string,
  data: Partial<Pick<Drug, 'brandName' | 'saltName' | 'form' | 'strength'>>
): Promise<void> {
  return updateDrug(id, data)
}

export async function toggleDrugActive(id: string): Promise<void> {
  const existing = await db.drugs.get(id)
  if (!existing) throw new Error('Drug not found')
  await db.drugs.update(id, {
    isActive: !existing.isActive,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteDrug(id: string): Promise<void> {
  const existing = await db.drugs.get(id)
  if (!existing) throw new Error('Drug not found')
  await db.drugs.delete(id)
}

/** @deprecated Use deleteDrug instead */
export async function deleteCustomDrug(id: string): Promise<void> {
  return deleteDrug(id)
}

export async function resetDrugToDefault(id: string): Promise<void> {
  const existing = await db.drugs.get(id)
  if (!existing) throw new Error('Drug not found')
  if (existing.isCustom) throw new Error('Custom drugs have no default to reset to')

  const seedEntry = SEED_DRUGS.find(entry => buildSeedId(entry) === id)
  if (!seedEntry) throw new Error('No seed entry found for this drug')

  await db.drugs.update(id, {
    brandName: seedEntry.brandName,
    brandNameLower: seedEntry.brandName.toLowerCase(),
    saltName: seedEntry.saltName,
    saltNameLower: seedEntry.saltName.toLowerCase(),
    form: seedEntry.form,
    strength: seedEntry.strength,
    isOverridden: false,
    isActive: true,
    updatedAt: new Date().toISOString(),
  })
}

export async function getCustomDrugs(): Promise<Drug[]> {
  return db.drugs.filter(d => d.isCustom === true).toArray()
}

export async function getAllDrugs(): Promise<Drug[]> {
  return db.drugs.filter(d => d.isActive).toArray()
}

export async function getAllDrugsUnfiltered(): Promise<Drug[]> {
  return db.drugs.toArray()
}
