import { describe, it, expect, beforeEach } from 'vitest'
import { db, resetDatabase } from '@/db/index'
import {
  createVisit,
  updateVisit,
  deleteVisit,
  getVisit,
  getPatientVisits,
  removeMedicationFromVisit,
} from '@/db/visits'

describe('Visit CRUD', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('creates a visit with medications', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Fever and cough',
      rxNotes: 'Take with food',
      medications: [
        {
          brandName: 'Augmentin',
          saltName: 'Amoxicillin/Clavulanate',
          form: 'Tablet',
          strength: '625mg',
          quantity: '1 tablet',
          frequency: 'BD',
          duration: '5 days',
          sortOrder: 0,
        },
      ],
    })

    expect(visitId).toBeTruthy()

    const result = await getVisit(visitId)
    expect(result).not.toBeNull()
    expect(result!.visit.patientId).toBe('patient-1')
    expect(result!.visit.clinicalNotes).toBe('Fever and cough')
    expect(result!.visit.rxNotes).toBe('Take with food')
    expect(result!.visit.createdAt).toBeTruthy()
    expect(result!.visit.updatedAt).toBeTruthy()
    expect(result!.medications).toHaveLength(1)
    expect(result!.medications[0].brandName).toBe('Augmentin')
  })

  it('creates a visit without medications', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Follow-up visit',
      rxNotes: '',
      medications: [],
    })

    const result = await getVisit(visitId)
    expect(result!.medications).toHaveLength(0)
  })

  it('updates visit notes and replaces medications', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Original notes',
      rxNotes: '',
      medications: [
        {
          brandName: 'DrugA',
          saltName: 'SaltA',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1 tablet',
          frequency: 'OD',
          duration: '3 days',
          sortOrder: 0,
        },
      ],
    })

    await updateVisit(visitId, {
      clinicalNotes: 'Updated notes',
      rxNotes: 'New rx notes',
      medications: [
        {
          brandName: 'DrugB',
          saltName: 'SaltB',
          form: 'Syrup',
          strength: '250mg/5ml',
          quantity: '5ml',
          frequency: 'TDS',
          duration: '7 days',
          sortOrder: 0,
        },
        {
          brandName: 'DrugC',
          saltName: 'SaltC',
          form: 'Capsule',
          strength: '200mg',
          quantity: '1 capsule',
          frequency: 'BD',
          duration: '5 days',
          sortOrder: 1,
        },
      ],
    })

    const result = await getVisit(visitId)
    expect(result!.visit.clinicalNotes).toBe('Updated notes')
    expect(result!.visit.rxNotes).toBe('New rx notes')
    expect(result!.medications).toHaveLength(2)
    expect(result!.medications[0].brandName).toBe('DrugB')
    expect(result!.medications[1].brandName).toBe('DrugC')
  })

  it('deletes a visit and its medications', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'To be deleted',
      rxNotes: '',
      medications: [
        {
          brandName: 'DrugA',
          saltName: 'SaltA',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1 tablet',
          frequency: 'OD',
          duration: '3 days',
          sortOrder: 0,
        },
      ],
    })

    await deleteVisit(visitId)

    const result = await getVisit(visitId)
    expect(result).toBeNull()

    const meds = await db.visitMedications.where('visitId').equals(visitId).toArray()
    expect(meds).toHaveLength(0)
  })

  it('returns null for non-existent visit', async () => {
    const result = await getVisit('non-existent')
    expect(result).toBeNull()
  })

  it('gets patient visits in reverse chronological order', async () => {
    await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'First visit',
      rxNotes: '',
      medications: [],
    })

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10))

    await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Second visit',
      rxNotes: '',
      medications: [],
    })

    const visits = await getPatientVisits('patient-1')
    expect(visits).toHaveLength(2)
    expect(visits[0].visit.clinicalNotes).toBe('Second visit')
    expect(visits[1].visit.clinicalNotes).toBe('First visit')
  })

  it('only returns visits for the specified patient', async () => {
    await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Patient 1 visit',
      rxNotes: '',
      medications: [],
    })

    await createVisit({
      patientId: 'patient-2',
      clinicalNotes: 'Patient 2 visit',
      rxNotes: '',
      medications: [],
    })

    const visits = await getPatientVisits('patient-1')
    expect(visits).toHaveLength(1)
    expect(visits[0].visit.clinicalNotes).toBe('Patient 1 visit')
  })

  it('removes a single medication from a visit', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Visit notes',
      rxNotes: '',
      medications: [
        {
          brandName: 'DrugA',
          saltName: 'SaltA',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1 tablet',
          frequency: 'OD',
          duration: '3 days',
          sortOrder: 0,
        },
        {
          brandName: 'DrugB',
          saltName: 'SaltB',
          form: 'Syrup',
          strength: '250mg',
          quantity: '5ml',
          frequency: 'BD',
          duration: '5 days',
          sortOrder: 1,
        },
      ],
    })

    const result = await getVisit(visitId)
    const medToRemove = result!.medications[0]

    await removeMedicationFromVisit(medToRemove.id)

    const updated = await getVisit(visitId)
    expect(updated!.medications).toHaveLength(1)
    expect(updated!.medications[0].brandName).toBe('DrugB')
  })
})
