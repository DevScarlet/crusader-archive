import type { Faction } from '../types/faction'
import type { Unit, UnitStats } from '../types/unit'

const API_BASE_URL = 'https://openhammer-api-production.up.railway.app'

interface OpenHammerFaction {
  name: string
  faction_type: string
  unit_count: number
}

interface OpenHammerUnit {
  id?: string
  name: string
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

function mapUnit(unit: OpenHammerUnit): Unit {
  const basePoints =
    typeof unit.points?.base === 'number' ? unit.points.base : undefined

  return {
    id: getOptionalString(unit.id),
    name: unit.name,
    faction: unit.faction,
    factionType: unit.faction_type,
    basePoints,
    stats: mapUnitStats(unit.stats),
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
