import { pouchDb } from './pouchdb'
import type { Patient } from './index'
import { withTimestamps } from './timestamps'

export interface PatientInput {
  firstName: string
  lastName: string
  age: number
  gender: 'male' | 'female'
  contact?: string
  cnic?: string
}

const CURRENT_YEAR = new Date().getFullYear()

function stripPouchFields<T>(doc: Record<string, unknown>): T {
  const result = { ...doc }
  delete result._id
  delete result._rev
  delete result.type
  return result as T
}

export async function generatePatientId(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let existingRev: string | undefined
      let currentCounter = 0

      try {
        const existing = await pouchDb.get('settings:patientCounter')
        existingRev = (existing as unknown as Record<string, unknown>)._rev as string
        currentCounter = (existing as unknown as Record<string, unknown>).value as number
      } catch (err: unknown) {
        if ((err as PouchDB.Core.Error).status !== 404) throw err
      }

      const counter = currentCounter + 1
      const doc: Record<string, unknown> = {
        _id: 'settings:patientCounter',
        type: 'settings',
        key: 'patientCounter',
        value: counter,
      }
      if (existingRev) doc._rev = existingRev

      await pouchDb.put(doc as PouchDB.Core.PutDocument<Record<string, unknown>>)

      const padded = counter >= 10000 ? String(counter) : String(counter).padStart(4, '0')
      return `${CURRENT_YEAR}-${padded}`
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status === 409 && attempt < 2) {
        // Conflict: another concurrent call won, retry
        continue
      }
      throw err
    }
  }
  throw new Error('Failed to generate patient ID after 3 attempts')
}

export async function getNextPatientId(): Promise<string> {
  let currentCounter = 0
  try {
    const existing = await pouchDb.get('settings:patientCounter')
    currentCounter = (existing as unknown as Record<string, unknown>).value as number
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status !== 404) throw err
  }
  const nextCounter = currentCounter + 1
  const padded = nextCounter >= 10000 ? String(nextCounter) : String(nextCounter).padStart(4, '0')
  return `${CURRENT_YEAR}-${padded}`
}

export async function registerPatient(data: PatientInput): Promise<Patient> {
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

  await pouchDb.put({
    ...timestamped,
    _id: 'patient:' + id,
    type: 'patient',
  } as Record<string, unknown> as PouchDB.Core.PutDocument<Record<string, unknown>>)

  // Upsert recent entry
  try {
    let recentRev: string | undefined
    try {
      const existing = await pouchDb.get('recent:' + id)
      recentRev = (existing as unknown as Record<string, unknown>)._rev as string
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status !== 404) throw err
    }

    const recentDoc: Record<string, unknown> = {
      _id: 'recent:' + id,
      type: 'recent',
      id,
      viewedAt: new Date().toISOString(),
    }
    if (recentRev) recentDoc._rev = recentRev

    await pouchDb.put(recentDoc as PouchDB.Core.PutDocument<Record<string, unknown>>)
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status !== 409) throw err
    // 409 on recent entry is non-critical, ignore
  }

  return timestamped
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  try {
    const doc = await pouchDb.get('patient:' + id)
    return stripPouchFields<Patient>(doc as unknown as Record<string, unknown>)
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return undefined
    throw err
  }
}

export async function updatePatient(id: string, changes: Partial<PatientInput>): Promise<void> {
  const doc = await pouchDb.get('patient:' + id)
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
  const withUpdate = withTimestamps(update, false)
  await pouchDb.put({
    ...(doc as unknown as Record<string, unknown>),
    ...withUpdate,
    _id: (doc as unknown as Record<string, unknown>)._id,
    _rev: (doc as unknown as Record<string, unknown>)._rev,
    type: 'patient',
  } as PouchDB.Core.PutDocument<Record<string, unknown>>)
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const lower = trimmed.toLowerCase()

  // Patient IDs follow YYYY-XXXX format. If query matches that pattern prefix, search by patientId.
  if (/^\d{4}-/.test(trimmed) || (/^\d{1,4}$/.test(trimmed) && parseInt(trimmed) >= 1900)) {
    const result = await pouchDb.find({
      selector: { type: 'patient', patientId: { $gte: trimmed, $lte: trimmed + '\uffff' } },
      limit: 10,
    })
    const patients = result.docs.map(d => stripPouchFields<Patient>(d as unknown as Record<string, unknown>))
    if (patients.length > 0) return patients
  }

  // If query starts with 0 or + it's likely a phone/contact number
  if (/^[0+]/.test(trimmed)) {
    const result = await pouchDb.find({
      selector: { type: 'patient', contact: { $gte: trimmed, $lte: trimmed + '\uffff' } },
      limit: 10,
    })
    return result.docs.map(d => stripPouchFields<Patient>(d as unknown as Record<string, unknown>))
  }

  // Pure digits that didn't match patient ID: try both patientId and contact
  if (/^\d+$/.test(trimmed)) {
    const byId = await pouchDb.find({
      selector: { type: 'patient', patientId: { $gte: trimmed, $lte: trimmed + '\uffff' } },
      limit: 10,
    })
    const byIdPatients = byId.docs.map(d => stripPouchFields<Patient>(d as unknown as Record<string, unknown>))
    if (byIdPatients.length > 0) return byIdPatients

    const byContact = await pouchDb.find({
      selector: { type: 'patient', contact: { $gte: trimmed, $lte: trimmed + '\uffff' } },
      limit: 10,
    })
    return byContact.docs.map(d => stripPouchFields<Patient>(d as unknown as Record<string, unknown>))
  }

  // Otherwise: search by name prefix, deduplicate
  const [byFirstName, byLastName] = await Promise.all([
    pouchDb.find({
      selector: { type: 'patient', firstNameLower: { $gte: lower, $lte: lower + '\uffff' } },
      limit: 10,
    }),
    pouchDb.find({
      selector: { type: 'patient', lastNameLower: { $gte: lower, $lte: lower + '\uffff' } },
      limit: 10,
    }),
  ])

  const seen = new Set<string>()
  const results: Patient[] = []
  for (const doc of [...byFirstName.docs, ...byLastName.docs]) {
    const p = stripPouchFields<Patient>(doc as unknown as Record<string, unknown>)
    if (!seen.has(p.id)) {
      seen.add(p.id)
      results.push(p)
    }
    if (results.length >= 10) break
  }

  return results
}

export async function getRecentPatients(limit: number = 10): Promise<Patient[]> {
  const result = await pouchDb.allDocs({
    startkey: 'recent:',
    endkey: 'recent:\uffff',
    include_docs: true,
  })

  // Sort by viewedAt descending, take first `limit`
  const sorted = result.rows
    .filter(row => row.doc)
    .map(row => row.doc as unknown as Record<string, unknown>)
    .sort((a, b) =>
      String(b.viewedAt ?? '').localeCompare(String(a.viewedAt ?? ''))
    )
    .slice(0, limit)

  const patients: Patient[] = []
  for (const recentDoc of sorted) {
    const id = recentDoc.id as string
    try {
      const patientDoc = await pouchDb.get('patient:' + id)
      patients.push(stripPouchFields<Patient>(patientDoc as unknown as Record<string, unknown>))
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status !== 404) throw err
      // Patient deleted, skip
    }
  }

  return patients
}

export async function addToRecent(patientId: string): Promise<void> {
  let existingRev: string | undefined
  try {
    const existing = await pouchDb.get('recent:' + patientId)
    existingRev = (existing as unknown as Record<string, unknown>)._rev as string
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status !== 404) throw err
  }

  const doc: Record<string, unknown> = {
    _id: 'recent:' + patientId,
    type: 'recent',
    id: patientId,
    viewedAt: new Date().toISOString(),
  }
  if (existingRev) doc._rev = existingRev

  await pouchDb.put(doc as PouchDB.Core.PutDocument<Record<string, unknown>>)
}
