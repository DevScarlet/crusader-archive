import { useEffect, useState } from 'react'
import type { Unit, UnitStats } from '../types/unit'

const COMPARISON_STORAGE_KEY = 'crusader-archive-comparison'
const COMPARISON_UPDATED_EVENT = 'crusader-archive-comparison-updated'
export const MAX_COMPARISON_UNITS = 3

function getUnitKey(unit: Unit): string {
  return unit.id ?? `${unit.faction}:${unit.name}`
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function parseStats(value: unknown): UnitStats | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const stats = value as Record<string, unknown>

  return {
    movement: getOptionalString(stats.movement),
    toughness: getOptionalString(stats.toughness),
    save: getOptionalString(stats.save),
    wounds: getOptionalString(stats.wounds),
    leadership: getOptionalString(stats.leadership),
    objectiveControl: getOptionalString(stats.objectiveControl),
  }
}

function parseComparisonUnit(value: unknown): Unit | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const unit = value as Record<string, unknown>

  if (
    typeof unit.name !== 'string' ||
    typeof unit.faction !== 'string' ||
    typeof unit.factionType !== 'string'
  ) {
    return null
  }

  return {
    id: getOptionalString(unit.id),
    name: unit.name,
    faction: unit.faction,
    factionType: unit.factionType,
    basePoints:
      typeof unit.basePoints === 'number' ? unit.basePoints : undefined,
    stats: parseStats(unit.stats),
  }
}

function readComparisonUnits(): Unit[] {
  try {
    const storedUnits = localStorage.getItem(COMPARISON_STORAGE_KEY)

    if (!storedUnits) {
      return []
    }

    const parsedUnits: unknown = JSON.parse(storedUnits)

    if (!Array.isArray(parsedUnits)) {
      return []
    }

    return parsedUnits
      .map(parseComparisonUnit)
      .filter((unit): unit is Unit => unit !== null)
      .slice(0, MAX_COMPARISON_UNITS)
  } catch {
    return []
  }
}

function saveComparisonUnits(units: Unit[]): void {
  localStorage.setItem(
    COMPARISON_STORAGE_KEY,
    JSON.stringify(
      units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        faction: unit.faction,
        factionType: unit.factionType,
        basePoints: unit.basePoints,
        stats: unit.stats,
      })),
    ),
  )
  window.dispatchEvent(new Event(COMPARISON_UPDATED_EVENT))
}

export function useComparison() {
  const [comparisonUnits, setComparisonUnits] =
    useState<Unit[]>(readComparisonUnits)

  useEffect(() => {
    function refreshComparisonUnits() {
      setComparisonUnits(readComparisonUnits())
    }

    window.addEventListener('storage', refreshComparisonUnits)
    window.addEventListener(COMPARISON_UPDATED_EVENT, refreshComparisonUnits)

    return () => {
      window.removeEventListener('storage', refreshComparisonUnits)
      window.removeEventListener(
        COMPARISON_UPDATED_EVENT,
        refreshComparisonUnits,
      )
    }
  }, [])

  function isCompared(unit: Unit): boolean {
    const unitKey = getUnitKey(unit)
    return comparisonUnits.some(
      (comparisonUnit) => getUnitKey(comparisonUnit) === unitKey,
    )
  }

  function canAddUnit(unit: Unit): boolean {
    return isCompared(unit) || comparisonUnits.length < MAX_COMPARISON_UNITS
  }

  function addToComparison(unit: Unit): void {
    const currentUnits = readComparisonUnits()
    const unitKey = getUnitKey(unit)

    if (currentUnits.some((currentUnit) => getUnitKey(currentUnit) === unitKey)) {
      return
    }

    if (currentUnits.length >= MAX_COMPARISON_UNITS) {
      return
    }

    saveComparisonUnits([...currentUnits, unit])
  }

  function removeFromComparison(unit: Unit): void {
    const unitKey = getUnitKey(unit)
    const remainingUnits = readComparisonUnits().filter(
      (comparisonUnit) => getUnitKey(comparisonUnit) !== unitKey,
    )

    saveComparisonUnits(remainingUnits)
  }

  function toggleComparison(unit: Unit): void {
    if (isCompared(unit)) {
      removeFromComparison(unit)
    } else {
      addToComparison(unit)
    }
  }

  function clearComparison(): void {
    saveComparisonUnits([])
  }

  return {
    comparisonUnits,
    isCompared,
    canAddUnit,
    toggleComparison,
    removeFromComparison,
    clearComparison,
  }
}
