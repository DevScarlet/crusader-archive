import { useEffect, useState } from 'react'
import type { Faction } from '../types/faction'
import type { Unit } from '../types/unit'

const ARMY_PLANNER_STORAGE_KEY = 'crusader-archive-army-planner'
const ARMY_PLANNER_UPDATED_EVENT = 'crusader-archive-army-planner-updated'

export interface ArmyPlannerUnit {
  id?: string
  routeIdentifier: string
  name: string
  faction: string
  factionType?: string
  points?: number
  quantity: number
}

export interface ArmyList {
  name: string
  faction?: string
  factionType?: string
  units: ArmyPlannerUnit[]
}

function getUnitKey(unit: Pick<ArmyPlannerUnit, 'id' | 'faction' | 'name'>): string {
  return unit.id ?? `${unit.faction}:${unit.name}`
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
}

function parseArmyUnit(value: unknown): ArmyPlannerUnit | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const unit = value as Record<string, unknown>

  if (
    typeof unit.name !== 'string' ||
    typeof unit.faction !== 'string' ||
    typeof unit.routeIdentifier !== 'string' ||
    typeof unit.quantity !== 'number'
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

function parseArmyList(value: unknown): ArmyList {
  if (typeof value !== 'object' || value === null) {
    return {
      name: 'My Army List',
      units: [],
    }
  }

  const list = value as Record<string, unknown>
  const units = Array.isArray(list.units)
    ? list.units
        .map(parseArmyUnit)
        .filter((unit): unit is ArmyPlannerUnit => unit !== null)
    : []

  return {
    name: typeof list.name === 'string' ? list.name : 'My Army List',
    faction: getOptionalString(list.faction),
    factionType: getOptionalString(list.factionType),
    units,
  }
}

function readArmyList(): ArmyList {
  try {
    const storedList = localStorage.getItem(ARMY_PLANNER_STORAGE_KEY)

    if (!storedList) {
      return {
        name: 'My Army List',
        units: [],
      }
    }

    const parsedList: unknown = JSON.parse(storedList)

    return parseArmyList(parsedList)
  } catch {
    return {
      name: 'My Army List',
      units: [],
    }
  }
}

function saveArmyList(list: ArmyList): void {
  localStorage.setItem(ARMY_PLANNER_STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(ARMY_PLANNER_UPDATED_EVENT))
}

function toArmyPlannerUnit(unit: Unit): ArmyPlannerUnit {
  const routeIdentifier = unit.id ?? unit.name

  return {
    id: unit.id,
    routeIdentifier,
    name: unit.name,
    faction: unit.faction,
    factionType: unit.factionType,
    points: unit.basePoints,
    quantity: 1,
  }
}

export function useArmyPlanner() {
  const [armyList, setArmyList] = useState<ArmyList>(readArmyList)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    function refreshArmyList() {
      setArmyList(readArmyList())
    }

    window.addEventListener('storage', refreshArmyList)
    window.addEventListener(ARMY_PLANNER_UPDATED_EVENT, refreshArmyList)

    return () => {
      window.removeEventListener('storage', refreshArmyList)
      window.removeEventListener(ARMY_PLANNER_UPDATED_EVENT, refreshArmyList)
    }
  }, [])

  function updateListName(name: string): void {
    const currentList = readArmyList()

    saveArmyList({
      ...currentList,
      name: name.trim() || 'My Army List',
    })
    setMessage(null)
  }

  function updateListFaction(faction?: Faction): void {
    const currentList = readArmyList()

    saveArmyList({
      ...currentList,
      faction: faction?.name,
      factionType: faction?.factionType,
      units: faction
        ? currentList.units.filter((unit) => unit.faction === faction.name)
        : currentList.units,
    })
    setMessage(null)
  }

  function addUnit(unit: Unit): void {
    const currentList = readArmyList()

    if (currentList.faction && currentList.faction !== unit.faction) {
      setMessage(
        `This army list is for ${currentList.faction}. This version supports one faction per list.`,
      )
      return
    }

    const newUnit = toArmyPlannerUnit(unit)
    const unitKey = getUnitKey(newUnit)
    const existingUnit = currentList.units.find(
      (armyUnit) => getUnitKey(armyUnit) === unitKey,
    )
    const updatedUnits = existingUnit
      ? currentList.units.map((armyUnit) =>
          getUnitKey(armyUnit) === unitKey
            ? { ...armyUnit, quantity: armyUnit.quantity + 1 }
            : armyUnit,
        )
      : [...currentList.units, newUnit]

    saveArmyList({
      ...currentList,
      faction: currentList.faction ?? unit.faction,
      factionType: currentList.factionType ?? unit.factionType,
      units: updatedUnits,
    })
    setMessage(`${unit.name} added to ${currentList.name}.`)
  }

  function updateQuantity(unit: ArmyPlannerUnit, quantity: number): void {
    const safeQuantity = Math.max(1, Math.floor(quantity))
    const unitKey = getUnitKey(unit)
    const currentList = readArmyList()
    const updatedUnits = currentList.units.map((armyUnit) =>
      getUnitKey(armyUnit) === unitKey
        ? { ...armyUnit, quantity: safeQuantity }
        : armyUnit,
    )

    saveArmyList({ ...currentList, units: updatedUnits })
  }

  function removeUnit(unit: ArmyPlannerUnit): void {
    const unitKey = getUnitKey(unit)
    const currentList = readArmyList()
    const updatedUnits = currentList.units.filter(
      (armyUnit) => getUnitKey(armyUnit) !== unitKey,
    )

    saveArmyList({ ...currentList, units: updatedUnits })
  }

  function clearList(): void {
    const currentList = readArmyList()

    saveArmyList({
      name: currentList.name,
      faction: currentList.faction,
      factionType: currentList.factionType,
      units: [],
    })
    setMessage('Army list cleared.')
  }

  const totalUnits = armyList.units.reduce(
    (total, unit) => total + unit.quantity,
    0,
  )
  const totalPoints = armyList.units.reduce(
    (total, unit) => total + (unit.points ?? 0) * unit.quantity,
    0,
  )

  return {
    armyList,
    message,
    totalUnits,
    totalPoints,
    updateListName,
    updateListFaction,
    addUnit,
    updateQuantity,
    removeUnit,
    clearList,
    clearMessage: () => setMessage(null),
  }
}
