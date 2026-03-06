/** Form-to-category classification */
export const FORM_TO_CATEGORY: Record<string, string> = {
  Tablet: 'oral', Capsule: 'oral', Sachet: 'oral', Powder: 'oral',
  Syrup: 'liquid', Suspension: 'liquid', Solution: 'liquid',
  Cream: 'topical', Ointment: 'topical', Gel: 'topical', Patch: 'topical',
  Drops: 'drops',
  Injection: 'injection',
  Inhaler: 'inhaler', Spray: 'inhaler',
  Suppository: 'suppository',
}

/** Quantity options filtered by form category */
export const QUANTITY_OPTIONS: Record<string, string[]> = {
  oral: ['½', '1', '2', '3'],
  liquid: ['2.5 ml', '5 ml', '10 ml', '15 ml'],
  drops: ['1', '2', '3', '5'],
  injection: ['1'],
  topical: ['Thin layer', 'As directed'],
  inhaler: ['1', '2'],
  suppository: ['1'],
}

/** Flat list of all quantity options (for backwards compat / validation) */
export const ALL_QUANTITY_OPTIONS: string[] = [
  ...new Set(Object.values(QUANTITY_OPTIONS).flat()),
]

export const FREQUENCY_OPTIONS: string[] = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'Once weekly',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime',
  'Once daily before breakfast',
  'Once daily at night',
  'Twice daily (morning and night)',
  'Stat (single dose)',
]

export const DURATION_OPTIONS: string[] = [
  '1 day',
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '3 weeks',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  'Ongoing',
  'As needed',
]

export const MEDICATION_FORMS: string[] = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Drops',
  'Injection',
  'Cream',
  'Ointment',
  'Gel',
  'Inhaler',
  'Suppository',
  'Sachet',
  'Powder',
  'Patch',
  'Spray',
  'Solution',
]
