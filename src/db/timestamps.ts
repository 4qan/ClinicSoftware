import { db } from './index'
import type { Patient } from './index'

export function withTimestamps<T extends Record<string, unknown>>(
  data: T,
  isNew: boolean,
): T {
  const now = new Date().toISOString()

  if (isNew) {
    return { ...data, createdAt: now, updatedAt: now }
  }

  return { ...data, updatedAt: now }
}

export async function createPatient(
  data: Omit<Patient, 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const timestamped = withTimestamps(data, true) as Patient
  return db.patients.add(timestamped)
}

export async function updatePatient(
  id: string,
  changes: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<number> {
  const timestamped = withTimestamps(changes, false)
  return db.patients.update(id, timestamped)
}
