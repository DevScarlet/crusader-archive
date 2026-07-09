export const unitMetadataTagPresets = [
  'Owned',
  'Want to buy',
  'Painted',
  'Favorite model',
  'Competitive',
  'Casual',
  'Anti-infantry',
  'Anti-vehicle',
  'Leader',
  'Tanky',
] as const

export type UnitMetadataTag = (typeof unitMetadataTagPresets)[number]

export interface UnitMetadata {
  note: string
  tags: UnitMetadataTag[]
  updatedAt?: string
}

export type UnitMetadataByUnitKey = Record<string, UnitMetadata>
