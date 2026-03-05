import { db } from './index'
import type { Patient } from './index'
import { withTimestamps } from './timestamps'

export interface PatientInput {
  firstName: string
  lastName: string
  age: number
  gender: 'male' | 'female' | 'other'
  contact?: string
  cnic?: string
}

const CURRENT_YEAR = new Date().getFullYear()

export async function generatePatientId(): Promise<string> {
  return await db.transaction('rw', db.settings, async () => {
    const setting = await db.settings.get('patientCounter')
    const counter = setting ? (setting.value as number) + 1 : 1
    await db.settings.put({ key: 'patientCounter', value: counter })
    const padded = counter >= 10000 ? String(counter) : String(counter).padStart(4, '0')
    return `${CURRENT_YEAR}-${padded}`
  })
}

export async function registerPatient(data: PatientInput): Promise<Patient> {
  return await db.transaction('rw', [db.patients, db.settings, db.recentPatients], async () => {
    const id = crypto.randomUUID()
    const patientId = await generatePatientId()

    const patient: Omit<Patient, 'createdAt' | 'updatedAt'> = {
      id,
      patientId,
      firstName: data.firstName,
      lastName: data.lastName,
      firstNameLower: data.firstName.toLowerCase(),
      lastNameLower: data.lastName.toLowerCase(),
      age: data.age,
      gender: data.gender,
      contact: data.contact,
      cnic: data.cnic,
    }

    const timestamped = withTimestamps(patient, true) as Patient
    await db.patients.add(timestamped)
    await db.recentPatients.put({ id, viewedAt: new Date().toISOString() })

    return timestamped
  })
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  return db.patients.get(id)
}

export async function updatePatient(id: string, changes: Partial<PatientInput>): Promise<void> {
  const update: Record<string, unknown> = { ...changes }
  if (changes.firstName !== undefined) {
    update.firstNameLower = changes.firstName.toLowerCase()
  }
  if (changes.lastName !== undefined) {
    update.lastNameLower = changes.lastName.toLowerCase()
  }
  // Remove undefined values
  for (const key of Object.keys(update)) {
    if (update[key] === undefined) delete update[key]
  }
  const timestamped = withTimestamps(update, false)
  await db.patients.update(id, timestamped)
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const lower = trimmed.toLowerCase()

  // Patient IDs follow YYYY-XXXX format. If query matches that pattern prefix, search by patientId.
  if (/^\d{4}-/.test(trimmed) || /^\d{1,4}$/.test(trimmed) && parseInt(trimmed) >= 1900) {
    // Could be a year prefix for patient ID
    const byId = await db.patients
      .where('patientId')
      .startsWith(trimmed)
      .limit(10)
      .toArray()
    if (byId.length > 0) return byId
  }

  // If query starts with 0 or + it's likely a phone/contact number
  if (/^[0+]/.test(trimmed)) {
    return db.patients
      .where('contact')
      .startsWith(trimmed)
      .limit(10)
      .toArray()
  }

  // Pure digits that didn't match patient ID: try both patientId and contact
  if (/^\d+$/.test(trimmed)) {
    const byId = await db.patients
      .where('patientId')
      .startsWith(trimmed)
      .limit(10)
      .toArray()
    if (byId.length > 0) return byId
    return db.patients
      .where('contact')
      .startsWith(trimmed)
      .limit(10)
      .toArray()
  }

  // Otherwise: search by name prefix, deduplicate
  const byFirstName = await db.patients
    .where('firstNameLower')
    .startsWith(lower)
    .limit(10)
    .toArray()

  const byLastName = await db.patients
    .where('lastNameLower')
    .startsWith(lower)
    .limit(10)
    .toArray()

  // Deduplicate by id
  const seen = new Set<string>()
  const results: Patient[] = []
  for (const p of [...byFirstName, ...byLastName]) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      results.push(p)
    }
    if (results.length >= 10) break
  }

  return results
}

export async function getRecentPatients(limit: number = 10): Promise<Patient[]> {
  const recents = await db.recentPatients
    .orderBy('viewedAt')
    .reverse()
    .limit(limit)
    .toArray()

  const patients: Patient[] = []
  for (const recent of recents) {
    const patient = await db.patients.get(recent.id)
    if (patient) patients.push(patient)
  }

  return patients
}

export async function addToRecent(patientId: string): Promise<void> {
  await db.recentPatients.put({ id: patientId, viewedAt: new Date().toISOString() })
}
