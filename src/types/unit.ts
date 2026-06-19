export interface UnitStats {
  movement?: string
  toughness?: string
  save?: string
  wounds?: string
  leadership?: string
  objectiveControl?: string
}

export interface UnitWeapon {
  name: string
  range?: string
  attacks?: string
  skill?: string
  strength?: string
  armorPenetration?: string
  damage?: string
  keywords?: string
}

export interface UnitAbility {
  name: string
  description?: string
}

export interface Unit {
  id?: string
  name: string
  faction: string
  factionType: string
  unitType?: string
  basePoints?: number
  stats?: UnitStats
  rangedWeapons?: UnitWeapon[]
  meleeWeapons?: UnitWeapon[]
  abilities?: UnitAbility[]
  keywords?: string[]
}
