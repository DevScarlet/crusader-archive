import { useEffect, useState } from 'react'
import type { Unit, UnitStats } from '../types/unit'

const FAVORITES_STORAGE_KEY = 'crusader-archive-favorites'
const FAVORITES_UPDATED_EVENT = 'crusader-archive-favorites-updated'

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

function parseFavorite(value: unknown): Unit | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const favorite = value as Record<string, unknown>

  if (
    typeof favorite.name !== 'string' ||
    typeof favorite.faction !== 'string' ||
    typeof favorite.factionType !== 'string'
  ) {
    return null
  }

  return {
    id: getOptionalString(favorite.id),
    name: favorite.name,
    faction: favorite.faction,
    factionType: favorite.factionType,
    basePoints:
      typeof favorite.basePoints === 'number'
        ? favorite.basePoints
        : undefined,
    stats: parseStats(favorite.stats),
  }
}

function readFavorites(): Unit[] {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)

    if (!storedFavorites) {
      return []
    }

    const parsedFavorites: unknown = JSON.parse(storedFavorites)

    if (!Array.isArray(parsedFavorites)) {
      return []
    }

    return parsedFavorites
      .map(parseFavorite)
      .filter((favorite): favorite is Unit => favorite !== null)
  } catch {
    return []
  }
}

function saveFavorites(favorites: Unit[]): void {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Unit[]>(readFavorites)

  useEffect(() => {
    function refreshFavorites() {
      setFavorites(readFavorites())
    }

    window.addEventListener('storage', refreshFavorites)
    window.addEventListener(FAVORITES_UPDATED_EVENT, refreshFavorites)

    return () => {
      window.removeEventListener('storage', refreshFavorites)
      window.removeEventListener(FAVORITES_UPDATED_EVENT, refreshFavorites)
    }
  }, [])

  function isFavorite(unit: Unit): boolean {
    const unitKey = getUnitKey(unit)
    return favorites.some((favorite) => getUnitKey(favorite) === unitKey)
  }

  function addFavorite(unit: Unit): void {
    const currentFavorites = readFavorites()
    const unitKey = getUnitKey(unit)

    if (currentFavorites.some((favorite) => getUnitKey(favorite) === unitKey)) {
      return
    }

    saveFavorites([
      ...currentFavorites,
      {
        id: unit.id,
        name: unit.name,
        faction: unit.faction,
        factionType: unit.factionType,
        basePoints: unit.basePoints,
        stats: unit.stats,
      },
    ])
  }

  function removeFavorite(unit: Unit): void {
    const unitKey = getUnitKey(unit)
    const remainingFavorites = readFavorites().filter(
      (favorite) => getUnitKey(favorite) !== unitKey,
    )

    saveFavorites(remainingFavorites)
  }

  function toggleFavorite(unit: Unit): void {
    if (isFavorite(unit)) {
      removeFavorite(unit)
    } else {
      addFavorite(unit)
    }
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  }
}
