import type { Faction } from '../types/faction'

const API_BASE_URL = 'https://openhammer-api-production.up.railway.app'

interface OpenHammerFaction {
  name: string
  faction_type: string
  unit_count: number
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
