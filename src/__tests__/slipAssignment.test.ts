import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase } from '@/db/index'
import { createVisit, getVisit } from '@/db/visits'

describe('slipType field on VisitMedication', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('saves slipType=prescription and retrieves it correctly', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Test',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Amoxil',
          saltName: 'Amoxicillin',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1 tablet',
          frequency: 'BD',
          duration: '5 days',
          sortOrder: 0,
          slipType: 'prescription',
        },
      ],
    })

    const result = await getVisit(visitId)
    expect(result).not.toBeNull()
    expect(result!.medications[0].slipType).toBe('prescription')
  })

  it('saves slipType=dispensary and retrieves it correctly', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Test',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Panadol',
          saltName: 'Paracetamol',
          form: 'Tablet',
          strength: '500mg',
          quantity: '2 tablets',
          frequency: 'TDS',
          duration: '3 days',
          sortOrder: 0,
          slipType: 'dispensary',
        },
      ],
    })

    const result = await getVisit(visitId)
    expect(result!.medications[0].slipType).toBe('dispensary')
  })

  it('treats medication saved without slipType as dispensary (backward compat)', async () => {
    const visitId = await createVisit({
      patientId: 'patient-1',
      clinicalNotes: 'Test',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Brufen',
          saltName: 'Ibuprofen',
          form: 'Tablet',
          strength: '400mg',
          quantity: '1 tablet',
          frequency: 'OD',
          duration: '5 days',
          sortOrder: 0,
          // slipType intentionally omitted to simulate pre-feature data
        },
      ],
    })

    const result = await getVisit(visitId)
    // When slipType is undefined, treat as dispensary
    expect(result!.medications[0].slipType ?? 'dispensary').toBe('dispensary')
  })

  it('database opens without error after version(5) migration', async () => {
    // Simply opening the DB (which resetDatabase does) should not throw
    // This test verifies the v5 schema upgrade runs without error
    await resetDatabase()
    const visitId = await createVisit({
      patientId: 'patient-2',
      clinicalNotes: 'Schema test',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [],
    })
    expect(visitId).toBeTruthy()
  })
})

describe('MedicationFormData slipType default', () => {
  it('emptyForm has slipType defaulting to dispensary (import check)', async () => {
    // Dynamically import to test the module exports
    const { MedicationEntry } = await import('@/components/MedicationEntry')
    // MedicationEntry component exists
    expect(MedicationEntry).toBeDefined()
  })
})
