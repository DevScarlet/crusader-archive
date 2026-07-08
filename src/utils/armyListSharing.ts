import { appMetadata } from '../config/appMetadata'
import type { ArmyList, ArmyPlannerUnit } from '../hooks/useArmyPlanner'

const SHARE_CODE_PREFIX = 'CA10E-'
const SHARE_CODE_SCHEMA_VERSION = 1
export const DEFAULT_TARGET_POINTS = 1000
const RULES_NOTE =
  'Note: Crusader Archive does not validate official army-list rules.'

interface ShareCodeUnit {
  id?: string
  routeIdentifier: string
  name: string
  faction: string
  factionType?: string
  quantity: number
  points?: number
}

interface ShareCodePayload {
  schemaVersion: typeof SHARE_CODE_SCHEMA_VERSION
  app: typeof appMetadata.appName
  apiEdition: typeof appMetadata.openHammerApiEdition
  warhammerEdition: typeof appMetadata.warhammerEditionLabel
  list: {
    name: string
    faction?: string
    factionType?: string
    targetPoints: number
    units: ShareCodeUnit[]
  }
}

export interface ImportedArmyList {
  name: string
  faction?: string
  factionType?: string
  targetPoints: number
  units: ArmyPlannerUnit[]
}

export interface DecodeArmyListShareCodeResult {
  list?: ImportedArmyList
  errorMessage?: string
}

function getSubtotal(unit: Pick<ArmyPlannerUnit, 'points' | 'quantity'>): number {
  return (unit.points ?? 0) * unit.quantity
}

function getTotalPoints(units: ArmyPlannerUnit[]): number {
  return units.reduce((total, unit) => total + getSubtotal(unit), 0)
}

function getTotalUnits(units: ArmyPlannerUnit[]): number {
  return units.reduce((total, unit) => total + unit.quantity, 0)
}

function getBudgetLine(totalPoints: number, targetPoints: number): string {
  if (totalPoints > targetPoints) {
    return `Over: ${totalPoints - targetPoints} pts`
  }

  return `Remaining: ${targetPoints - totalPoints} pts`
}

function getListFactionLabel(list: Pick<ArmyList, 'faction'>): string {
  return list.faction ?? 'No faction selected'
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binaryValue = ''

  bytes.forEach((byte) => {
    binaryValue += String.fromCharCode(byte)
  })

  return btoa(binaryValue)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function decodeBase64Url(value: string): string {
  const base64Value = value.replaceAll('-', '+').replaceAll('_', '/')
  const paddingLength = (4 - (base64Value.length % 4)) % 4
  const paddedValue = base64Value + '='.repeat(paddingLength)
  const binaryValue = atob(paddedValue)
  const bytes = Uint8Array.from(binaryValue, (character) =>
    character.charCodeAt(0),
  )

  return new TextDecoder().decode(bytes)
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function getOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
}

function getTargetPoints(value: unknown): number {
  const targetPoints = getOptionalNumber(value)

  if (targetPoints === undefined || targetPoints < 0) {
    return DEFAULT_TARGET_POINTS
  }

  return Math.floor(targetPoints)
}

function parseShareCodeUnit(value: unknown): ArmyPlannerUnit | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const unit = value as Record<string, unknown>

  if (
    typeof unit.name !== 'string' ||
    typeof unit.faction !== 'string' ||
    typeof unit.routeIdentifier !== 'string' ||
    typeof unit.quantity !== 'number' ||
    !Number.isFinite(unit.quantity)
  ) {
    return null
  }

  return {
    id: getOptionalString(unit.id),
    routeIdentifier: unit.routeIdentifier,
    name: unit.name,
    faction: unit.faction,
    factionType: getOptionalString(unit.factionType),
    points: getOptionalNumber(unit.points),
    quantity: Math.max(1, Math.floor(unit.quantity)),
  }
}

function parseShareCodePayload(value: unknown): DecodeArmyListShareCodeResult {
  if (typeof value !== 'object' || value === null) {
    return {
      errorMessage: 'That share code is not a valid Crusader Archive list.',
    }
  }

  const payload = value as Record<string, unknown>

  if (payload.schemaVersion !== SHARE_CODE_SCHEMA_VERSION) {
    return {
      errorMessage:
        'That share code uses an unsupported Crusader Archive format.',
    }
  }

  if (payload.app !== appMetadata.appName) {
    return {
      errorMessage: 'That share code is not for Crusader Archive.',
    }
  }

  if (
    payload.apiEdition !== appMetadata.openHammerApiEdition ||
    payload.warhammerEdition !== appMetadata.warhammerEditionLabel
  ) {
    return {
      errorMessage:
        'That share code is for a different Warhammer or OpenHammer edition.',
    }
  }

  if (typeof payload.list !== 'object' || payload.list === null) {
    return {
      errorMessage: 'That share code does not include an army list.',
    }
  }

  const list = payload.list as Record<string, unknown>

  if (typeof list.name !== 'string' || !Array.isArray(list.units)) {
    return {
      errorMessage: 'That share code has missing army list details.',
    }
  }

  const units = list.units.map(parseShareCodeUnit)

  if (units.some((unit) => unit === null)) {
    return {
      errorMessage: 'That share code has unit details we could not read.',
    }
  }

  return {
    list: {
      name: list.name,
      faction: getOptionalString(list.faction),
      factionType: getOptionalString(list.factionType),
      targetPoints: getTargetPoints(list.targetPoints),
      units: units.filter((unit): unit is ArmyPlannerUnit => unit !== null),
    },
  }
}

export function formatArmyListText(list: ArmyList): string {
  const totalPoints = getTotalPoints(list.units)
  const unitLines = list.units.map(
    (unit) => `- ${unit.name} x${unit.quantity} - ${getSubtotal(unit)} pts`,
  )

  return [
    `${list.name} - ${getListFactionLabel(list)}`,
    '',
    `Target: ${list.targetPoints} pts`,
    `Total: ${totalPoints} pts`,
    getBudgetLine(totalPoints, list.targetPoints),
    `Selected units: ${getTotalUnits(list.units)}`,
    '',
    ...unitLines,
    '',
    RULES_NOTE,
  ].join('\n')
}

export function encodeArmyListShareCode(list: ArmyList): string {
  const payload: ShareCodePayload = {
    schemaVersion: SHARE_CODE_SCHEMA_VERSION,
    app: appMetadata.appName,
    apiEdition: appMetadata.openHammerApiEdition,
    warhammerEdition: appMetadata.warhammerEditionLabel,
    list: {
      name: list.name,
      faction: list.faction,
      factionType: list.factionType,
      targetPoints: list.targetPoints,
      units: list.units.map((unit) => ({
        id: unit.id,
        routeIdentifier: unit.routeIdentifier,
        name: unit.name,
        faction: unit.faction,
        factionType: unit.factionType,
        quantity: unit.quantity,
        points: unit.points ?? 0,
      })),
    },
  }

  return `${SHARE_CODE_PREFIX}${encodeBase64Url(JSON.stringify(payload))}`
}

export function decodeArmyListShareCode(
  shareCode: string,
): DecodeArmyListShareCodeResult {
  const trimmedShareCode = shareCode.trim()

  if (!trimmedShareCode.startsWith(SHARE_CODE_PREFIX)) {
    return {
      errorMessage: `Share codes should start with ${SHARE_CODE_PREFIX}.`,
    }
  }

  try {
    const encodedPayload = trimmedShareCode.slice(SHARE_CODE_PREFIX.length)
    const decodedPayload: unknown = JSON.parse(decodeBase64Url(encodedPayload))

    return parseShareCodePayload(decodedPayload)
  } catch (error) {
    console.error('Army list share code import failed.', { error })

    return {
      errorMessage:
        'That share code could not be read. Check that the full code was copied.',
    }
  }
}
