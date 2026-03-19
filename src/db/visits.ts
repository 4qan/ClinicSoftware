import { pouchDb } from './pouchdb'
import type { Visit, VisitMedication } from './index'

export interface CreateVisitData {
  patientId: string
  clinicalNotes: string
  rxNotes: string
  rxNotesLang: 'en' | 'ur'
  medications: Omit<VisitMedication, 'id' | 'visitId'>[]
  temperature?: number
  systolic?: number
  diastolic?: number
  weight?: number
  spo2?: number
}

export interface UpdateVisitData {
  clinicalNotes: string
  rxNotes: string
  rxNotesLang: 'en' | 'ur'
  medications: Omit<VisitMedication, 'id' | 'visitId'>[]
  temperature?: number
  systolic?: number
  diastolic?: number
  weight?: number
  spo2?: number
}

function stripPouchFields<T>(doc: Record<string, unknown>): T {
  const result = { ...doc }
  delete result._id
  delete result._rev
  delete result.type
  return result as T
}

export async function createVisit(data: CreateVisitData): Promise<string> {
  const now = new Date().toISOString()
  const visitId = crypto.randomUUID()

  const visitDoc = {
    _id: 'visit:' + visitId,
    type: 'visit' as const,
    id: visitId,
    patientId: data.patientId,
    clinicalNotes: data.clinicalNotes,
    rxNotes: data.rxNotes,
    rxNotesLang: data.rxNotesLang,
    temperature: data.temperature,
    systolic: data.systolic,
    diastolic: data.diastolic,
    weight: data.weight,
    spo2: data.spo2,
    createdAt: now,
    updatedAt: now,
  }

  await pouchDb.put(visitDoc as PouchDB.Core.PutDocument<Record<string, unknown>>)

  const medDocs = data.medications.map(med => {
    const medId = crypto.randomUUID()
    return {
      _id: 'visitmed:' + medId,
      type: 'visitmed' as const,
      id: medId,
      visitId,
      ...med,
    }
  })

  if (medDocs.length > 0) {
    await pouchDb.bulkDocs(medDocs as PouchDB.Core.PutDocument<Record<string, unknown>>[])
  }

  return visitId
}

export async function updateVisit(visitId: string, data: UpdateVisitData): Promise<void> {
  const now = new Date().toISOString()

  // Get existing visit with _rev
  const existingDoc = await pouchDb.get('visit:' + visitId)

  // Update visit
  await pouchDb.put({
    ...(existingDoc as Record<string, unknown>),
    clinicalNotes: data.clinicalNotes,
    rxNotes: data.rxNotes,
    rxNotesLang: data.rxNotesLang,
    temperature: data.temperature,
    systolic: data.systolic,
    diastolic: data.diastolic,
    weight: data.weight,
    spo2: data.spo2,
    updatedAt: now,
  } as PouchDB.Core.PutDocument<Record<string, unknown>>)

  // Delete old medications
  const oldMedsResult = await pouchDb.find({
    selector: { type: 'visitmed', visitId },
    limit: 1000,
  })
  if (oldMedsResult.docs.length > 0) {
    await pouchDb.bulkDocs(
      oldMedsResult.docs.map(m => ({ ...(m as Record<string, unknown>), _deleted: true })) as PouchDB.Core.PutDocument<Record<string, unknown>>[]
    )
  }

  // Insert new medications
  const newMedDocs = data.medications.map(med => {
    const medId = crypto.randomUUID()
    return {
      _id: 'visitmed:' + medId,
      type: 'visitmed' as const,
      id: medId,
      visitId,
      ...med,
    }
  })

  if (newMedDocs.length > 0) {
    await pouchDb.bulkDocs(newMedDocs as PouchDB.Core.PutDocument<Record<string, unknown>>[])
  }
}

export async function deleteVisit(visitId: string): Promise<void> {
  const visitDoc = await pouchDb.get('visit:' + visitId)

  const medsResult = await pouchDb.find({
    selector: { type: 'visitmed', visitId },
    limit: 1000,
  })

  const deletedVisit = { ...(visitDoc as Record<string, unknown>), _deleted: true }
  const deletedMeds = medsResult.docs.map(m => ({ ...(m as Record<string, unknown>), _deleted: true }))

  await pouchDb.bulkDocs(
    [deletedVisit, ...deletedMeds] as PouchDB.Core.PutDocument<Record<string, unknown>>[]
  )
}

export async function getVisit(
  visitId: string,
): Promise<{ visit: Visit; medications: VisitMedication[] } | null> {
  let visitDoc: Record<string, unknown>
  try {
    visitDoc = await pouchDb.get('visit:' + visitId) as Record<string, unknown>
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return null
    throw err
  }

  const medsResult = await pouchDb.find({
    selector: { type: 'visitmed', visitId },
    limit: 1000,
  })

  const medications = medsResult.docs
    .map(m => stripPouchFields<VisitMedication>(m as Record<string, unknown>))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    visit: stripPouchFields<Visit>(visitDoc),
    medications,
  }
}

export async function getPatientVisits(
  patientId: string,
): Promise<Array<{ visit: Visit; medications: VisitMedication[] }>> {
  const visitsResult = await pouchDb.find({
    selector: { type: 'visit', patientId },
    limit: 1000,
  })

  // Sort by createdAt descending
  const visitDocs = visitsResult.docs
    .map(d => d as Record<string, unknown>)
    .sort((a, b) =>
      String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
    )

  const results: Array<{ visit: Visit; medications: VisitMedication[] }> = []

  for (const visitDoc of visitDocs) {
    const visitId = visitDoc.id as string
    const medsResult = await pouchDb.find({
      selector: { type: 'visitmed', visitId },
      limit: 1000,
    })

    const medications = medsResult.docs
      .map(m => stripPouchFields<VisitMedication>(m as Record<string, unknown>))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    results.push({
      visit: stripPouchFields<Visit>(visitDoc),
      medications,
    })
  }

  return results
}

export async function removeMedicationFromVisit(medicationId: string): Promise<void> {
  const doc = await pouchDb.get('visitmed:' + medicationId)
  await pouchDb.remove(doc as PouchDB.Core.RemoveDocument)
}
