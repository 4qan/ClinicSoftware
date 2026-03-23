import { pouchDb, putSetting, getSetting } from '@/db/pouchdb'
import type { Drug } from '@/db/index'

export type SeedEntry = Pick<Drug, 'brandName' | 'saltName' | 'form' | 'strength'>

export const SEED_DRUGS: SeedEntry[] = [
  // Antibiotics
  { brandName: 'Amoxil', saltName: 'Amoxicillin', form: 'Capsule', strength: '500mg' },
  { brandName: 'Amoxil', saltName: 'Amoxicillin', form: 'Syrup', strength: '125mg/5ml' },
  { brandName: 'Amoxil', saltName: 'Amoxicillin', form: 'Syrup', strength: '250mg/5ml' },
  { brandName: 'Augmentin', saltName: 'Amoxicillin + Clavulanate', form: 'Tablet', strength: '625mg' },
  { brandName: 'Augmentin', saltName: 'Amoxicillin + Clavulanate', form: 'Syrup', strength: '228mg/5ml' },
  { brandName: 'Augmentin', saltName: 'Amoxicillin + Clavulanate', form: 'Syrup', strength: '457mg/5ml' },
  { brandName: 'Novidat', saltName: 'Ciprofloxacin', form: 'Tablet', strength: '250mg' },
  { brandName: 'Novidat', saltName: 'Ciprofloxacin', form: 'Tablet', strength: '500mg' },
  { brandName: 'Ciprin', saltName: 'Ciprofloxacin', form: 'Tablet', strength: '500mg' },
  { brandName: 'Flagyl', saltName: 'Metronidazole', form: 'Tablet', strength: '400mg' },
  { brandName: 'Flagyl', saltName: 'Metronidazole', form: 'Syrup', strength: '200mg/5ml' },
  { brandName: 'Azomax', saltName: 'Azithromycin', form: 'Tablet', strength: '500mg' },
  { brandName: 'Azomax', saltName: 'Azithromycin', form: 'Syrup', strength: '200mg/5ml' },
  { brandName: 'Klaricid', saltName: 'Clarithromycin', form: 'Tablet', strength: '250mg' },
  { brandName: 'Klaricid', saltName: 'Clarithromycin', form: 'Tablet', strength: '500mg' },
  { brandName: 'Velosef', saltName: 'Cephradine', form: 'Capsule', strength: '500mg' },
  { brandName: 'Velosef', saltName: 'Cephradine', form: 'Syrup', strength: '125mg/5ml' },
  { brandName: 'Velosef', saltName: 'Cephradine', form: 'Syrup', strength: '250mg/5ml' },
  { brandName: 'Ceclor', saltName: 'Cefaclor', form: 'Capsule', strength: '500mg' },
  { brandName: 'Cespan', saltName: 'Cefixime', form: 'Capsule', strength: '400mg' },
  { brandName: 'Cespan', saltName: 'Cefixime', form: 'Syrup', strength: '100mg/5ml' },
  { brandName: 'Zinnat', saltName: 'Cefuroxime', form: 'Tablet', strength: '250mg' },
  { brandName: 'Zinnat', saltName: 'Cefuroxime', form: 'Tablet', strength: '500mg' },
  { brandName: 'Dalacin C', saltName: 'Clindamycin', form: 'Capsule', strength: '300mg' },
  { brandName: 'Vibramycin', saltName: 'Doxycycline', form: 'Capsule', strength: '100mg' },
  { brandName: 'Septran', saltName: 'Co-trimoxazole', form: 'Tablet', strength: '480mg' },
  { brandName: 'Septran', saltName: 'Co-trimoxazole', form: 'Syrup', strength: '240mg/5ml' },
  { brandName: 'Oxidil', saltName: 'Ceftriaxone', form: 'Injection', strength: '500mg' },
  { brandName: 'Oxidil', saltName: 'Ceftriaxone', form: 'Injection', strength: '1g' },
  { brandName: 'Cefspan', saltName: 'Cefixime', form: 'Tablet', strength: '200mg' },

  // Analgesics & Anti-inflammatories
  { brandName: 'Panadol', saltName: 'Paracetamol', form: 'Tablet', strength: '500mg' },
  { brandName: 'Panadol Extra', saltName: 'Paracetamol + Caffeine', form: 'Tablet', strength: '500mg/65mg' },
  { brandName: 'Calpol', saltName: 'Paracetamol', form: 'Syrup', strength: '120mg/5ml' },
  { brandName: 'Calpol', saltName: 'Paracetamol', form: 'Syrup', strength: '250mg/5ml' },
  { brandName: 'Brufen', saltName: 'Ibuprofen', form: 'Tablet', strength: '200mg' },
  { brandName: 'Brufen', saltName: 'Ibuprofen', form: 'Tablet', strength: '400mg' },
  { brandName: 'Brufen', saltName: 'Ibuprofen', form: 'Syrup', strength: '100mg/5ml' },
  { brandName: 'Ponstan', saltName: 'Mefenamic Acid', form: 'Capsule', strength: '250mg' },
  { brandName: 'Ponstan Forte', saltName: 'Mefenamic Acid', form: 'Tablet', strength: '500mg' },
  { brandName: 'Disprin', saltName: 'Aspirin', form: 'Tablet', strength: '300mg' },
  { brandName: 'Ascard', saltName: 'Aspirin', form: 'Tablet', strength: '75mg' },
  { brandName: 'Ascard', saltName: 'Aspirin', form: 'Tablet', strength: '150mg' },
  { brandName: 'Voltaren', saltName: 'Diclofenac Sodium', form: 'Tablet', strength: '50mg' },
  { brandName: 'Voltaren', saltName: 'Diclofenac Sodium', form: 'Injection', strength: '75mg/3ml' },
  { brandName: 'Voltaren', saltName: 'Diclofenac Sodium', form: 'Gel', strength: '1%' },
  { brandName: 'Arcoxia', saltName: 'Etoricoxib', form: 'Tablet', strength: '60mg' },
  { brandName: 'Arcoxia', saltName: 'Etoricoxib', form: 'Tablet', strength: '90mg' },
  { brandName: 'Toradol', saltName: 'Ketorolac', form: 'Injection', strength: '30mg' },
  { brandName: 'Tramal', saltName: 'Tramadol', form: 'Capsule', strength: '50mg' },

  // Gastrointestinal
  { brandName: 'Risek', saltName: 'Omeprazole', form: 'Capsule', strength: '20mg' },
  { brandName: 'Risek', saltName: 'Omeprazole', form: 'Capsule', strength: '40mg' },
  { brandName: 'Nexium', saltName: 'Esomeprazole', form: 'Tablet', strength: '20mg' },
  { brandName: 'Nexium', saltName: 'Esomeprazole', form: 'Tablet', strength: '40mg' },
  { brandName: 'Zantac', saltName: 'Ranitidine', form: 'Tablet', strength: '150mg' },
  { brandName: 'Motilium', saltName: 'Domperidone', form: 'Tablet', strength: '10mg' },
  { brandName: 'Motilium', saltName: 'Domperidone', form: 'Syrup', strength: '5mg/5ml' },
  { brandName: 'Imodium', saltName: 'Loperamide', form: 'Capsule', strength: '2mg' },
  { brandName: 'Buscopan', saltName: 'Hyoscine Butylbromide', form: 'Tablet', strength: '10mg' },
  { brandName: 'Buscopan', saltName: 'Hyoscine Butylbromide', form: 'Injection', strength: '20mg' },
  { brandName: 'Duphalac', saltName: 'Lactulose', form: 'Syrup', strength: '3.35g/5ml' },
  { brandName: 'Ulgel', saltName: 'Aluminium Hydroxide + Magnesium Hydroxide', form: 'Suspension', strength: '' },
  { brandName: 'Flagyl', saltName: 'Metronidazole', form: 'Tablet', strength: '200mg' },
  { brandName: 'Entamizole', saltName: 'Metronidazole + Diloxanide', form: 'Tablet', strength: '200mg/250mg' },

  // Respiratory & Allergy
  { brandName: 'Ventolin', saltName: 'Salbutamol', form: 'Inhaler', strength: '100mcg' },
  { brandName: 'Ventolin', saltName: 'Salbutamol', form: 'Syrup', strength: '2mg/5ml' },
  { brandName: 'Seretide', saltName: 'Fluticasone + Salmeterol', form: 'Inhaler', strength: '250/50mcg' },
  { brandName: 'Rigix', saltName: 'Cetirizine', form: 'Tablet', strength: '10mg' },
  { brandName: 'Rigix', saltName: 'Cetirizine', form: 'Syrup', strength: '5mg/5ml' },
  { brandName: 'Clarityn', saltName: 'Loratadine', form: 'Tablet', strength: '10mg' },
  { brandName: 'Xyzal', saltName: 'Levocetirizine', form: 'Tablet', strength: '5mg' },
  { brandName: 'Montika', saltName: 'Montelukast', form: 'Tablet', strength: '10mg' },
  { brandName: 'Montika', saltName: 'Montelukast', form: 'Tablet', strength: '5mg' },
  { brandName: 'Phenergan', saltName: 'Promethazine', form: 'Syrup', strength: '5mg/5ml' },
  { brandName: 'Benadryl', saltName: 'Diphenhydramine', form: 'Syrup', strength: '12.5mg/5ml' },
  { brandName: 'Prospan', saltName: 'Ivy Leaf Extract', form: 'Syrup', strength: '' },
  { brandName: 'Hydryllin', saltName: 'Diphenhydramine + Ammonium Chloride', form: 'Syrup', strength: '' },
  { brandName: 'Sinecod', saltName: 'Butamirate', form: 'Syrup', strength: '7.5mg/5ml' },
  { brandName: 'Mucolite', saltName: 'Ambroxol', form: 'Syrup', strength: '15mg/5ml' },
  { brandName: 'Mucolite', saltName: 'Ambroxol', form: 'Tablet', strength: '30mg' },

  // Cardiovascular
  { brandName: 'Lopressor', saltName: 'Metoprolol', form: 'Tablet', strength: '50mg' },
  { brandName: 'Tenormin', saltName: 'Atenolol', form: 'Tablet', strength: '50mg' },
  { brandName: 'Tenormin', saltName: 'Atenolol', form: 'Tablet', strength: '100mg' },
  { brandName: 'Norvasc', saltName: 'Amlodipine', form: 'Tablet', strength: '5mg' },
  { brandName: 'Norvasc', saltName: 'Amlodipine', form: 'Tablet', strength: '10mg' },
  { brandName: 'Coversyl', saltName: 'Perindopril', form: 'Tablet', strength: '5mg' },
  { brandName: 'Zestril', saltName: 'Lisinopril', form: 'Tablet', strength: '5mg' },
  { brandName: 'Zestril', saltName: 'Lisinopril', form: 'Tablet', strength: '10mg' },
  { brandName: 'Cozaar', saltName: 'Losartan', form: 'Tablet', strength: '50mg' },
  { brandName: 'Cozaar', saltName: 'Losartan', form: 'Tablet', strength: '100mg' },
  { brandName: 'Lipitor', saltName: 'Atorvastatin', form: 'Tablet', strength: '10mg' },
  { brandName: 'Lipitor', saltName: 'Atorvastatin', form: 'Tablet', strength: '20mg' },
  { brandName: 'Lipitor', saltName: 'Atorvastatin', form: 'Tablet', strength: '40mg' },
  { brandName: 'Plavix', saltName: 'Clopidogrel', form: 'Tablet', strength: '75mg' },
  { brandName: 'Lasix', saltName: 'Furosemide', form: 'Tablet', strength: '40mg' },
  { brandName: 'Aldactone', saltName: 'Spironolactone', form: 'Tablet', strength: '25mg' },

  // Antidiabetics
  { brandName: 'Glucophage', saltName: 'Metformin', form: 'Tablet', strength: '500mg' },
  { brandName: 'Glucophage', saltName: 'Metformin', form: 'Tablet', strength: '850mg' },
  { brandName: 'Glucophage', saltName: 'Metformin', form: 'Tablet', strength: '1000mg' },
  { brandName: 'Diamicron', saltName: 'Gliclazide', form: 'Tablet', strength: '80mg' },
  { brandName: 'Diamicron MR', saltName: 'Gliclazide', form: 'Tablet', strength: '30mg' },
  { brandName: 'Daonil', saltName: 'Glibenclamide', form: 'Tablet', strength: '5mg' },
  { brandName: 'Januvia', saltName: 'Sitagliptin', form: 'Tablet', strength: '50mg' },
  { brandName: 'Januvia', saltName: 'Sitagliptin', form: 'Tablet', strength: '100mg' },
  { brandName: 'Mixtard', saltName: 'Insulin (Human)', form: 'Injection', strength: '100 IU/ml' },
  { brandName: 'NovoRapid', saltName: 'Insulin Aspart', form: 'Injection', strength: '100 IU/ml' },
  { brandName: 'Lantus', saltName: 'Insulin Glargine', form: 'Injection', strength: '100 IU/ml' },

  // Neuropsychiatric
  { brandName: 'Lexotanil', saltName: 'Bromazepam', form: 'Tablet', strength: '3mg' },
  { brandName: 'Xanax', saltName: 'Alprazolam', form: 'Tablet', strength: '0.5mg' },
  { brandName: 'Stilnoct', saltName: 'Zolpidem', form: 'Tablet', strength: '10mg' },
  { brandName: 'Tegral', saltName: 'Carbamazepine', form: 'Tablet', strength: '200mg' },
  { brandName: 'Epival', saltName: 'Divalproex Sodium', form: 'Tablet', strength: '250mg' },
  { brandName: 'Cipramil', saltName: 'Citalopram', form: 'Tablet', strength: '20mg' },
  { brandName: 'Prozac', saltName: 'Fluoxetine', form: 'Capsule', strength: '20mg' },

  // Vitamins & Supplements
  { brandName: 'Neurobion', saltName: 'Vitamin B Complex', form: 'Tablet', strength: '' },
  { brandName: 'Neurobion', saltName: 'Vitamin B Complex', form: 'Injection', strength: '' },
  { brandName: 'Cal-C', saltName: 'Calcium + Vitamin D', form: 'Tablet', strength: '500mg/200IU' },
  { brandName: 'Osteocare', saltName: 'Calcium + Magnesium + Zinc + Vitamin D', form: 'Tablet', strength: '' },
  { brandName: 'Fefol', saltName: 'Iron + Folic Acid', form: 'Capsule', strength: '' },
  { brandName: 'Folic Acid', saltName: 'Folic Acid', form: 'Tablet', strength: '5mg' },

  // Dermatology & Topical
  { brandName: 'Betnovate', saltName: 'Betamethasone Valerate', form: 'Cream', strength: '0.1%' },
  { brandName: 'Dermovate', saltName: 'Clobetasol Propionate', form: 'Cream', strength: '0.05%' },
  { brandName: 'Canesten', saltName: 'Clotrimazole', form: 'Cream', strength: '1%' },
  { brandName: 'Fucidin', saltName: 'Fusidic Acid', form: 'Cream', strength: '2%' },
  { brandName: 'Kenacort', saltName: 'Triamcinolone', form: 'Injection', strength: '40mg' },
  { brandName: 'Polyfax', saltName: 'Polymyxin B + Bacitracin', form: 'Ointment', strength: '' },

  // Muscle Relaxants
  { brandName: 'Myoril', saltName: 'Thiocolchicoside', form: 'Capsule', strength: '4mg' },
  { brandName: 'Norgesic', saltName: 'Orphenadrine + Paracetamol', form: 'Tablet', strength: '35mg/450mg' },
  { brandName: 'Relaxon', saltName: 'Cyclobenzaprine', form: 'Tablet', strength: '10mg' },
]

export function buildSeedId(entry: SeedEntry): string {
  return `seed-${entry.brandName}-${entry.saltName}-${entry.form}-${entry.strength}`
    .toLowerCase().replace(/[^a-z0-9-]/g, '_')
}

function buildDrugRecord(entry: SeedEntry): Drug {
  const now = new Date().toISOString()
  return {
    id: buildSeedId(entry),
    brandName: entry.brandName,
    brandNameLower: entry.brandName.toLowerCase(),
    saltName: entry.saltName,
    saltNameLower: entry.saltName.toLowerCase(),
    form: entry.form,
    strength: entry.strength,
    isCustom: false,
    isActive: true,
    isOverridden: false,
    createdAt: now,
    updatedAt: now,
  }
}

export async function seedDrugDatabase(): Promise<void> {
  const drugs = SEED_DRUGS.map(entry => ({
    ...buildDrugRecord(entry),
    _id: 'drug:' + buildSeedId(entry),
    type: 'drug' as const,
  }))

  // Check which IDs already exist (idempotent: do not re-insert)
  const existingResult = await pouchDb.allDocs({ keys: drugs.map(d => d._id) })
  const existingIds = new Set(
    existingResult.rows
      .filter(row => !('error' in row) && 'id' in row)
      .map(row => (row as { id: string }).id)
  )

  const toInsert = drugs.filter(d => !existingIds.has(d._id))
  if (toInsert.length > 0) {
    const results = await pouchDb.bulkDocs(toInsert as PouchDB.Core.PutDocument<Record<string, unknown>>[])
    // Ignore conflicts: they mean the drug arrived via sync before we could insert it
    const errors = results.filter(
      (r): r is PouchDB.Core.Error => 'error' in r && (r as PouchDB.Core.Error).status !== 409,
    )
    if (errors.length > 0) {
      console.warn(`[seed] ${errors.length} non-conflict error(s) during drug seeding`)
    }
  }
}

export async function deduplicateExistingDrugs(): Promise<void> {
  const flag = await getSetting('drugsDeduped')
  if (flag) return

  const result = await pouchDb.allDocs({
    startkey: 'drug:',
    endkey: 'drug:\uffff',
    include_docs: true,
  })

  const seen = new Map<string, string>()
  const toDelete: PouchDB.Core.PutDocument<Record<string, unknown>>[] = []

  for (const row of result.rows) {
    if (!row.doc) continue
    const doc = row.doc as unknown as Record<string, unknown>
    if (doc._deleted) continue

    const key = `${doc.brandNameLower}|${doc.saltNameLower}|${doc.form}|${doc.strength}`
    if (seen.has(key)) {
      toDelete.push({ ...doc, _deleted: true } as PouchDB.Core.PutDocument<Record<string, unknown>>)
    } else {
      seen.set(key, doc._id as string)
    }
  }

  if (toDelete.length > 0) {
    await pouchDb.bulkDocs(toDelete)
  }

  await putSetting('drugsDeduped', true)
}
