import { OPEN_HAMMER_API_EDITION } from '../config/appMetadata'
import type { Faction } from '../types/faction'
import type {
  Unit,
  UnitAbility,
  UnitStats,
  UnitWeapon,
} from '../types/unit'

const API_BASE_URL = 'https://openhammer-api-production.up.railway.app'
const API_ROOT_URL = `${API_BASE_URL}/v1/${OPEN_HAMMER_API_EDITION}`

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

interface OpenHammerUnitCount {
  count: number
}

export interface GetUnitsOptions {
  limit: number
  offset: number
  name?: string
  faction?: string
  factionType?: string
  unitType?: string
  sortBy?: string
}

export interface PaginatedUnits {
  units: Unit[]
  totalCount: number | null
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

function isOpenHammerUnitCount(value: unknown): value is OpenHammerUnitCount {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const countResponse = value as Record<string, unknown>

  return typeof countResponse.count === 'number'
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

function addOptionalParam(
  searchParams: URLSearchParams,
  name: string,
  value: string | undefined,
): void {
  if (value) {
    searchParams.set(name, value)
  }
}

function getOpenHammerUrl(path: string, searchParams?: URLSearchParams): string {
  const queryString = searchParams?.toString()

  return `${API_ROOT_URL}${path}${queryString ? `?${queryString}` : ''}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function getResponseText(response: Response): Promise<string | undefined> {
  try {
    return await response.text()
  } catch (error) {
    console.error('OpenHammer API request failed while reading error details.', {
      error,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    })

    return undefined
  }
}

async function fetchOpenHammer(
  url: string,
  signal?: AbortSignal,
  allowedFailureStatuses: number[] = [],
): Promise<Response> {
  let response: Response

  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }

    console.error('OpenHammer API request failed before receiving a response.', {
      error,
      url,
    })

    throw new Error(
      'OpenHammer API request failed before receiving a response.',
      { cause: error },
    )
  }

  if (!response.ok && !allowedFailureStatuses.includes(response.status)) {
    const responseBody = await getResponseText(response)

    console.error('OpenHammer API request failed.', {
      responseBody,
      status: response.status,
      statusText: response.statusText,
      url,
    })

    throw new Error(
      `OpenHammer API request failed with status ${response.status}.`,
    )
  }

  return response
}

async function getJsonResponse(
  response: Response,
  responseDescription: string,
): Promise<unknown> {
  try {
    return await response.json()
  } catch (error) {
    console.error('OpenHammer API request failed while parsing JSON.', {
      error,
      responseDescription,
      status: response.status,
      url: response.url,
    })

    throw new Error(
      `OpenHammer API request failed: ${responseDescription} response was not valid JSON.`,
      { cause: error },
    )
  }
}

function throwUnexpectedResponse(
  responseDescription: string,
  responseBody: unknown,
): never {
  console.error('OpenHammer API request failed with an unexpected response.', {
    responseBody,
    responseDescription,
  })

  throw new Error(
    `OpenHammer API request failed: unexpected ${responseDescription} response.`,
  )
}

export async function getFactions(signal?: AbortSignal): Promise<Faction[]> {
  const response = await fetchOpenHammer(getOpenHammerUrl('/factions'), signal)
  const responseBody = await getJsonResponse(response, 'factions')

  if (!Array.isArray(responseBody) || !responseBody.every(isOpenHammerFaction)) {
    throwUnexpectedResponse('factions', responseBody)
  }

  return responseBody.map(mapFaction)
}

export async function getUnitsByFaction(
  factionName: string,
  signal?: AbortSignal,
): Promise<Unit[]> {
  const encodedFactionName = encodeURIComponent(factionName)
  const response = await fetchOpenHammer(
    getOpenHammerUrl(`/factions/${encodedFactionName}/units`),
    signal,
  )
  const responseBody = await getJsonResponse(response, 'faction units')

  if (!Array.isArray(responseBody) || !responseBody.every(isOpenHammerUnit)) {
    throwUnexpectedResponse('faction units', responseBody)
  }

  return responseBody.map(mapUnit)
}

async function getUnitCount(
  options: GetUnitsOptions,
  signal?: AbortSignal,
): Promise<number | null> {
  if (options.name || options.unitType) {
    return null
  }

  const searchParams = new URLSearchParams()
  addOptionalParam(searchParams, 'faction', options.faction)
  addOptionalParam(searchParams, 'faction_type', options.factionType)

  const response = await fetchOpenHammer(
    getOpenHammerUrl('/units/count', searchParams),
    signal,
  )
  const responseBody = await getJsonResponse(response, 'unit count')

  if (!isOpenHammerUnitCount(responseBody)) {
    throwUnexpectedResponse('unit count', responseBody)
  }

  return responseBody.count
}

export async function getUnits(
  options: GetUnitsOptions,
  signal?: AbortSignal,
): Promise<PaginatedUnits> {
  const searchParams = new URLSearchParams()
  searchParams.set('limit', String(options.limit))
  searchParams.set('offset', String(options.offset))
  addOptionalParam(searchParams, 'name', options.name)
  addOptionalParam(searchParams, 'faction', options.faction)
  addOptionalParam(searchParams, 'faction_type', options.factionType)
  addOptionalParam(searchParams, 'type', options.unitType)
  addOptionalParam(searchParams, 'sort_by', options.sortBy)

  const [unitResponse, totalCount] = await Promise.all([
    fetchOpenHammer(getOpenHammerUrl('/units', searchParams), signal),
    getUnitCount(options, signal),
  ])
  const responseBody = await getJsonResponse(unitResponse, 'units')

  if (!Array.isArray(responseBody) || !responseBody.every(isOpenHammerUnit)) {
    throwUnexpectedResponse('units', responseBody)
  }

  return {
    units: responseBody.map(mapUnit),
    totalCount,
  }
}

export async function getUnit(
  unitIdentifier: string,
  signal?: AbortSignal,
): Promise<Unit | null> {
  const encodedIdentifier = encodeURIComponent(unitIdentifier)
  const unitResponse = await fetchOpenHammer(
    getOpenHammerUrl(`/units/${encodedIdentifier}`),
    signal,
    [404],
  )

  if (unitResponse.ok) {
    const responseBody = await getJsonResponse(unitResponse, 'unit')

    if (!isOpenHammerUnit(responseBody)) {
      throwUnexpectedResponse('unit', responseBody)
    }

    return mapUnit(responseBody)
  }

  const searchResponse = await fetchOpenHammer(
    getOpenHammerUrl(`/units/search/name/${encodedIdentifier}`),
    signal,
    [404],
  )

  if (searchResponse.status === 404) {
    return null
  }

  const searchBody = await getJsonResponse(searchResponse, 'unit search')

  if (!Array.isArray(searchBody) || !searchBody.every(isOpenHammerUnit)) {
    throwUnexpectedResponse('unit search', searchBody)
  }

  const exactMatch = searchBody.find(
    (unit) => unit.name.toLowerCase() === unitIdentifier.toLowerCase(),
  )

  return exactMatch ? mapUnit(exactMatch) : null
}
