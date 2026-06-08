export interface UnitStats {
  movement?: string
  toughness?: string
  save?: string
  wounds?: string
  leadership?: string
  objectiveControl?: string
}

export interface Unit {
  id?: string
  name: string
  faction: string
  factionType: string
  basePoints?: number
  stats?: UnitStats
}
