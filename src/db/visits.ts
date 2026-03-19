import { db } from './index'
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

export async function createVisit(data: CreateVisitData): Promise<string> {
  return await db.transaction('rw', [db.visits, db.visitMedications], async () => {
    const now = new Date().toISOString()
    const visitId = crypto.randomUUID()

    const visit: Visit = {
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

    await db.visits.add(visit)

    for (const med of data.medications) {
      const medication: VisitMedication = {
        id: crypto.randomUUID(),
        visitId,
        ...med,
      }
      await db.visitMedications.add(medication)
    }

    return visitId
  })
}

export async function updateVisit(visitId: string, data: UpdateVisitData): Promise<void> {
  await db.transaction('rw', [db.visits, db.visitMedications], async () => {
    const now = new Date().toISOString()

    await db.visits.update(visitId, {
      clinicalNotes: data.clinicalNotes,
      rxNotes: data.rxNotes,
      rxNotesLang: data.rxNotesLang,
      temperature: data.temperature,
      systolic: data.systolic,
      diastolic: data.diastolic,
      weight: data.weight,
      spo2: data.spo2,
      updatedAt: now,
    })

    // Replace all medications: delete existing, insert new
    await db.visitMedications.where('visitId').equals(visitId).delete()

    for (const med of data.medications) {
      const medication: VisitMedication = {
        id: crypto.randomUUID(),
        visitId,
        ...med,
      }
      await db.visitMedications.add(medication)
    }
  })
}

export async function deleteVisit(visitId: string): Promise<void> {
  await db.transaction('rw', [db.visits, db.visitMedications], async () => {
    await db.visitMedications.where('visitId').equals(visitId).delete()
    await db.visits.delete(visitId)
  })
}

export async function getVisit(
  visitId: string,
): Promise<{ visit: Visit; medications: VisitMedication[] } | null> {
  const visit = await db.visits.get(visitId)
  if (!visit) return null

  const medications = await db.visitMedications
    .where('visitId')
    .equals(visitId)
    .sortBy('sortOrder')

  return { visit, medications }
}

export async function getPatientVisits(
  patientId: string,
): Promise<Array<{ visit: Visit; medications: VisitMedication[] }>> {
  const visits = await db.visits
    .where('patientId')
    .equals(patientId)
    .reverse()
    .sortBy('createdAt')

  // Sort in reverse chronological order
  visits.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const results: Array<{ visit: Visit; medications: VisitMedication[] }> = []

  for (const visit of visits) {
    const medications = await db.visitMedications
      .where('visitId')
      .equals(visit.id)
      .sortBy('sortOrder')
    results.push({ visit, medications })
  }

  return results
}

export async function removeMedicationFromVisit(medicationId: string): Promise<void> {
  await db.visitMedications.delete(medicationId)
}
