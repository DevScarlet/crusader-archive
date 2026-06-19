import type { Faction } from '../types/faction'
import type {
  Unit,
  UnitAbility,
  UnitStats,
  UnitWeapon,
} from '../types/unit'

const API_BASE_URL = 'https://openhammer-api-production.up.railway.app'
const ALL_UNITS_PAGE_SIZE = 500

interface OpenHammerFaction {
  name: string
  faction_type: string
  unit_count: number
}

interface OpenHammerUnit {
  id?: string
  name: string
  type?: string
  faction: string
  faction_type: string
  points?: {
    base?: number
  }
  stats?: {
    M?: string
    T?: string
    SV?: string
    W?: string
    LD?: string
    OC?: string
  }
  weapons?: {
    ranged?: unknown[]
    melee?: unknown[]
  }
  abilities?: unknown[]
  keywords?: unknown[]
}

function isOpenHammerFaction(value: unknown): value is OpenHammerFaction {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const faction = value as Record<string, unknown>

  return (
    typeof faction.name === 'string' &&
    typeof faction.faction_type === 'string' &&
    typeof faction.unit_count === 'number'
  )
}

function mapFaction(faction: OpenHammerFaction): Faction {
  return {
    name: faction.name,
    factionType: faction.faction_type,
    unitCount: faction.unit_count,
  }
}

function isOpenHammerUnit(value: unknown): value is OpenHammerUnit {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const unit = value as Record<string, unknown>

  return (
    typeof unit.name === 'string' &&
    typeof unit.faction === 'string' &&
    typeof unit.faction_type === 'string'
  )
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function mapUnitStats(stats: OpenHammerUnit['stats']): UnitStats | undefined {
  if (typeof stats !== 'object' || stats === null) {
    return undefined
  }

  return {
    movement: getOptionalString(stats.M),
    toughness: getOptionalString(stats.T),
    save: getOptionalString(stats.SV),
    wounds: getOptionalString(stats.W),
    leadership: getOptionalString(stats.LD),
    objectiveControl: getOptionalString(stats.OC),
  }
}

function mapWeapon(value: unknown): UnitWeapon | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const weapon = value as Record<string, unknown>

  if (typeof weapon.name !== 'string') {
    return null
  }

  return {
    name: weapon.name,
    range: getOptionalString(weapon.Range),
    attacks: getOptionalString(weapon.A),
    skill:
      getOptionalString(weapon.BS) ??
      getOptionalString(weapon.WS),
    strength: getOptionalString(weapon.S),
    armorPenetration: getOptionalString(weapon.AP),
    damage: getOptionalString(weapon.D),
    keywords: getOptionalString(weapon.Keywords),
  }
}

function mapWeapons(values: unknown[] | undefined): UnitWeapon[] {
  if (!values) {
    return []
  }

  return values
    .map(mapWeapon)
    .filter((weapon): weapon is UnitWeapon => weapon !== null)
}

function mapAbility(value: unknown): UnitAbility | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const ability = value as Record<string, unknown>

  if (typeof ability.name !== 'string') {
    return null
  }

  return {
    name: ability.name,
    description: getOptionalString(ability.description),
  }
}

function mapAbilities(values: unknown[] | undefined): UnitAbility[] {
  if (!values) {
    return []
  }

  return values
    .map(mapAbility)
    .filter((ability): ability is UnitAbility => ability !== null)
}

function mapKeywords(values: unknown[] | undefined): string[] {
  if (!values) {
    return []
  }

  return values.filter((value): value is string => typeof value === 'string')
}

function mapUnit(unit: OpenHammerUnit): Unit {
  const basePoints =
    typeof unit.points?.base === 'number' ? unit.points.base : undefined

  return {
    id: getOptionalString(unit.id),
    name: unit.name,
    faction: unit.faction,
    factionType: unit.faction_type,
    unitType: getOptionalString(unit.type),
    basePoints,
    stats: mapUnitStats(unit.stats),
    rangedWeapons: mapWeapons(unit.weapons?.ranged),
    meleeWeapons: mapWeapons(unit.weapons?.melee),
    abilities: mapAbilities(unit.abilities),
    keywords: mapKeywords(unit.keywords),
  }
}

export async function getFactions(signal?: AbortSignal): Promise<Faction[]> {
  const response = await fetch(`${API_BASE_URL}/factions`, { signal })

  if (!response.ok) {
    throw new Error(`OpenHammer API returned status ${response.status}.`)
  }

  const responseBody: unknown = await response.json()

  if (!Array.isArray(responseBody) || !responseBody.every(isOpenHammerFaction)) {
    throw new Error('OpenHammer API returned an unexpected factions response.')
  }

  return responseBody.map(mapFaction)
}

export async function getUnitsByFaction(
  factionName: string,
  signal?: AbortSignal,
): Promise<Unit[]> {
  const encodedFactionName = encodeURIComponent(factionName)
  const response = await fetch(
    `${API_BASE_URL}/factions/${encodedFactionName}/units`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`OpenHammer API returned status ${response.status}.`)
  }

  const responseBody: unknown = await response.json()

  if (!Array.isArray(responseBody) || !responseBody.every(isOpenHammerUnit)) {
    throw new Error('OpenHammer API returned an unexpected units response.')
  }

  return responseBody.map(mapUnit)
}

export async function getUnits(signal?: AbortSignal): Promise<Unit[]> {
  const units: Unit[] = []
  let offset = 0

  while (true) {
    const response = await fetch(
      `${API_BASE_URL}/units?limit=${ALL_UNITS_PAGE_SIZE}&offset=${offset}`,
      { signal },
    )

    if (!response.ok) {
      throw new Error(`OpenHammer API returned status ${response.status}.`)
    }

    const responseBody: unknown = await response.json()

    if (!Array.isArray(responseBody) || !responseBody.every(isOpenHammerUnit)) {
      throw new Error('OpenHammer API returned an unexpected units response.')
    }

    units.push(...responseBody.map(mapUnit))

    if (responseBody.length < ALL_UNITS_PAGE_SIZE) {
      return units
    }

    offset += ALL_UNITS_PAGE_SIZE
  }
}

export async function getUnit(
  unitIdentifier: string,
  signal?: AbortSignal,
): Promise<Unit | null> {
  const encodedIdentifier = encodeURIComponent(unitIdentifier)
  const unitResponse = await fetch(`${API_BASE_URL}/units/${encodedIdentifier}`, {
    signal,
  })

  if (unitResponse.ok) {
    const responseBody: unknown = await unitResponse.json()

    if (!isOpenHammerUnit(responseBody)) {
      throw new Error('OpenHammer API returned an unexpected unit response.')
    }

    return mapUnit(responseBody)
  }

  if (unitResponse.status !== 404) {
    throw new Error(`OpenHammer API returned status ${unitResponse.status}.`)
  }

  const searchResponse = await fetch(
    `${API_BASE_URL}/units/search/name/${encodedIdentifier}`,
    { signal },
  )

  if (!searchResponse.ok) {
    if (searchResponse.status === 404) {
      return null
    }

    throw new Error(`OpenHammer API returned status ${searchResponse.status}.`)
  }

  const searchBody: unknown = await searchResponse.json()

  if (!Array.isArray(searchBody) || !searchBody.every(isOpenHammerUnit)) {
    throw new Error('OpenHammer API returned an unexpected unit response.')
  }

  const exactMatch = searchBody.find(
    (unit) => unit.name.toLowerCase() === unitIdentifier.toLowerCase(),
  )

  return exactMatch ? mapUnit(exactMatch) : null
}
