import { useEffect, useState } from 'react'
import type { Faction } from '../types/faction'
import type { Unit } from '../types/unit'

const ARMY_PLANNER_STORAGE_KEY = 'crusader-archive-army-planner'
const ARMY_PLANNER_UPDATED_EVENT = 'crusader-archive-army-planner-updated'
const ARMY_PLANNER_TOAST_EVENT = 'crusader-archive-toast'

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
  id: string
  name: string
  faction?: string
  factionType?: string
  units: ArmyPlannerUnit[]
  createdAt: string
}

export interface ArmyPlannerToast {
  message: string
  actionLabel?: string
  actionTo?: string
}

interface ArmyPlannerState {
  activeArmyListId: string
  armyLists: ArmyList[]
}

interface UseArmyPlannerResult {
  activeList: ArmyList
  lists: ArmyList[]
  totalUnits: number
  totalPoints: number
  setActiveListId: (listId: string) => void
  createList: () => void
  deleteList: (listId: string) => void
  updateListName: (name: string) => boolean
  updateListFaction: (faction?: Faction) => void
  addUnit: (unit: Unit) => void
  addUnitToList: (listId: string, unit: Unit) => boolean
  getUnitQuantity: (unit: Unit) => number
  updateQuantity: (unit: ArmyPlannerUnit, quantity: number) => void
  removeUnit: (unit: ArmyPlannerUnit) => void
  clearList: () => void
}

function createListId(): string {
  return `army-list-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDefaultList(): ArmyList {
  return {
    id: createListId(),
    name: 'My Army List',
    units: [],
    createdAt: new Date().toISOString(),
  }
}

function getNextNewListName(lists: ArmyList[]): string {
  const existingNames = new Set(lists.map((list) => list.name.trim()))

  if (!existingNames.has('New army list')) {
    return 'New army list'
  }

  let listNumber = 2

  while (existingNames.has(`New army list ${listNumber}`)) {
    listNumber += 1
  }

  return `New army list ${listNumber}`
}

function getUnitKey(
  unit: Pick<ArmyPlannerUnit, 'id' | 'faction' | 'name'>,
): string {
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

function parseArmyList(value: unknown, fallbackId: string): ArmyList | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const list = value as Record<string, unknown>

  if (typeof list.name !== 'string') {
    return null
  }

  const units = Array.isArray(list.units)
    ? list.units
        .map(parseArmyUnit)
        .filter((unit): unit is ArmyPlannerUnit => unit !== null)
    : []

  return {
    id: getOptionalString(list.id) ?? fallbackId,
    name: list.name,
    faction: getOptionalString(list.faction),
    factionType: getOptionalString(list.factionType),
    units,
    createdAt: getOptionalString(list.createdAt) ?? new Date().toISOString(),
  }
}

function normalizeState(state: ArmyPlannerState): ArmyPlannerState {
  if (state.armyLists.length === 0) {
    const defaultList = createDefaultList()

    return {
      activeArmyListId: defaultList.id,
      armyLists: [defaultList],
    }
  }

  const activeListExists = state.armyLists.some(
    (list) => list.id === state.activeArmyListId,
  )

  return {
    activeArmyListId: activeListExists
      ? state.activeArmyListId
      : state.armyLists[0].id,
    armyLists: state.armyLists,
  }
}

function readPlannerState(): ArmyPlannerState {
  try {
    const storedState = localStorage.getItem(ARMY_PLANNER_STORAGE_KEY)

    if (!storedState) {
      const defaultList = createDefaultList()

      return {
        activeArmyListId: defaultList.id,
        armyLists: [defaultList],
      }
    }

    const parsedState: unknown = JSON.parse(storedState)

    if (
      typeof parsedState === 'object' &&
      parsedState !== null &&
      Array.isArray((parsedState as Record<string, unknown>).armyLists)
    ) {
      const plannerState = parsedState as Record<string, unknown>
      const armyLists = (plannerState.armyLists as unknown[])
        .map((list, index) => parseArmyList(list, `army-list-${index}`))
        .filter((list): list is ArmyList => list !== null)

      return normalizeState({
        activeArmyListId:
          getOptionalString(plannerState.activeArmyListId) ??
          armyLists[0]?.id ??
          createListId(),
        armyLists,
      })
    }

    if (
      typeof parsedState === 'object' &&
      parsedState !== null &&
      Array.isArray((parsedState as Record<string, unknown>).lists)
    ) {
      const plannerState = parsedState as Record<string, unknown>
      const armyLists = (plannerState.lists as unknown[])
        .map((list, index) => parseArmyList(list, `army-list-${index}`))
        .filter((list): list is ArmyList => list !== null)

      return normalizeState({
        activeArmyListId:
          getOptionalString(plannerState.activeListId) ??
          armyLists[0]?.id ??
          createListId(),
        armyLists,
      })
    }

    const migratedList = parseArmyList(parsedState, 'legacy-army-list')

    if (migratedList) {
      return {
        activeArmyListId: migratedList.id,
        armyLists: [migratedList],
      }
    }
  } catch {
    // Fall through to a clean default state.
  }

  const defaultList = createDefaultList()

  return {
    activeArmyListId: defaultList.id,
    armyLists: [defaultList],
  }
}

function savePlannerState(state: ArmyPlannerState): void {
  localStorage.setItem(
    ARMY_PLANNER_STORAGE_KEY,
    JSON.stringify(normalizeState(state)),
  )
  window.dispatchEvent(new Event(ARMY_PLANNER_UPDATED_EVENT))
}

function showToast(toast: ArmyPlannerToast): void {
  window.dispatchEvent(
    new CustomEvent<ArmyPlannerToast>(ARMY_PLANNER_TOAST_EVENT, {
      detail: toast,
    }),
  )
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

function getDisplayListName(list: ArmyList): string {
  return list.name.trim() || 'Untitled army list'
}

export function useArmyPlanner(): UseArmyPlannerResult {
  const [plannerState, setPlannerState] =
    useState<ArmyPlannerState>(readPlannerState)

  useEffect(() => {
    function refreshArmyList() {
      setPlannerState(readPlannerState())
    }

    window.addEventListener('storage', refreshArmyList)
    window.addEventListener(ARMY_PLANNER_UPDATED_EVENT, refreshArmyList)

    return () => {
      window.removeEventListener('storage', refreshArmyList)
      window.removeEventListener(ARMY_PLANNER_UPDATED_EVENT, refreshArmyList)
    }
  }, [])

  const activeList =
    plannerState.armyLists.find(
      (list) => list.id === plannerState.activeArmyListId,
    ) ?? plannerState.armyLists[0]

  function saveList(updatedList: ArmyList, activeArmyListId: string): void {
    const currentState = readPlannerState()
    const updatedLists = currentState.armyLists.map((list) =>
      list.id === updatedList.id ? updatedList : list,
    )

    savePlannerState({
      ...currentState,
      armyLists: updatedLists,
      activeArmyListId,
    })
  }

  function saveActiveList(updatedList: ArmyList): void {
    saveList(updatedList, updatedList.id)
  }

  function setActiveListId(listId: string): void {
    const currentState = readPlannerState()

    if (!currentState.armyLists.some((list) => list.id === listId)) {
      return
    }

    savePlannerState({
      ...currentState,
      activeArmyListId: listId,
    })
  }

  function createList(): void {
    const currentState = readPlannerState()
    const newList: ArmyList = {
      id: createListId(),
      name: getNextNewListName(currentState.armyLists),
      units: [],
      createdAt: new Date().toISOString(),
    }

    savePlannerState({
      activeArmyListId: newList.id,
      armyLists: [...currentState.armyLists, newList],
    })
  }

  function deleteList(listId: string): void {
    const currentState = readPlannerState()
    const remainingLists = currentState.armyLists.filter(
      (list) => list.id !== listId,
    )
    const normalizedState = normalizeState({
      activeArmyListId: remainingLists[0]?.id ?? createListId(),
      armyLists: remainingLists,
    })

    savePlannerState(normalizedState)
  }

  function updateListName(name: string): boolean {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return false
    }

    saveActiveList({
      ...activeList,
      name: trimmedName,
    })

    return true
  }

  function updateListFaction(faction?: Faction): void {
    saveActiveList({
      ...activeList,
      faction: faction?.name,
      factionType: faction?.factionType,
      units: faction
        ? activeList.units.filter((unit) => unit.faction === faction.name)
        : activeList.units,
    })
  }

  function addUnitToList(listId: string, unit: Unit): boolean {
    const currentState = readPlannerState()
    const targetList = currentState.armyLists.find((list) => list.id === listId)

    if (!targetList) {
      showToast({
        message: 'That army list could not be found.',
        actionLabel: 'View army',
        actionTo: '/army-planner',
      })
      return false
    }

    const listFaction = targetList.faction ?? targetList.units[0]?.faction

    if (listFaction && listFaction !== unit.faction) {
      showToast({
        message: `This army list is for ${listFaction}. This version supports one faction per list.`,
        actionLabel: 'View army',
        actionTo: '/army-planner',
      })
      return false
    }

    const newUnit = toArmyPlannerUnit(unit)
    const unitKey = getUnitKey(newUnit)
    const existingUnit = targetList.units.find(
      (armyUnit) => getUnitKey(armyUnit) === unitKey,
    )
    const updatedUnits = existingUnit
      ? targetList.units.map((armyUnit) =>
          getUnitKey(armyUnit) === unitKey
            ? { ...armyUnit, quantity: armyUnit.quantity + 1 }
            : armyUnit,
        )
      : [...targetList.units, newUnit]
    const updatedQuantity = existingUnit ? existingUnit.quantity + 1 : 1

    saveList(
      {
        ...targetList,
        faction: targetList.faction ?? listFaction ?? unit.faction,
        factionType: targetList.factionType ?? unit.factionType,
        units: updatedUnits,
      },
      currentState.activeArmyListId,
    )
    showToast({
      message: `${unit.name} added to ${getDisplayListName(targetList)} (x${updatedQuantity}).`,
      actionLabel: 'View army',
      actionTo: '/army-planner',
    })

    return true
  }

  function addUnit(unit: Unit): void {
    addUnitToList(activeList.id, unit)
  }

  function getUnitQuantity(unit: Unit): number {
    const unitKey = getUnitKey(toArmyPlannerUnit(unit))
    const existingUnit = activeList.units.find(
      (armyUnit) => getUnitKey(armyUnit) === unitKey,
    )

    return existingUnit?.quantity ?? 0
  }

  function updateQuantity(unit: ArmyPlannerUnit, quantity: number): void {
    const safeQuantity = Math.max(1, Math.floor(quantity))
    const unitKey = getUnitKey(unit)
    const updatedUnits = activeList.units.map((armyUnit) =>
      getUnitKey(armyUnit) === unitKey
        ? { ...armyUnit, quantity: safeQuantity }
        : armyUnit,
    )

    saveActiveList({ ...activeList, units: updatedUnits })
  }

  function removeUnit(unit: ArmyPlannerUnit): void {
    const unitKey = getUnitKey(unit)
    const updatedUnits = activeList.units.filter(
      (armyUnit) => getUnitKey(armyUnit) !== unitKey,
    )

    saveActiveList({ ...activeList, units: updatedUnits })
  }

  function clearList(): void {
    saveActiveList({
      ...activeList,
      units: [],
    })
  }

  const totalUnits = activeList.units.reduce(
    (total, unit) => total + unit.quantity,
    0,
  )
  const totalPoints = activeList.units.reduce(
    (total, unit) => total + (unit.points ?? 0) * unit.quantity,
    0,
  )

  return {
    activeList,
    lists: plannerState.armyLists,
    totalUnits,
    totalPoints,
    setActiveListId,
    createList,
    deleteList,
    updateListName,
    updateListFaction,
    addUnit,
    addUnitToList,
    getUnitQuantity,
    updateQuantity,
    removeUnit,
    clearList,
  }
}

export { ARMY_PLANNER_TOAST_EVENT }
