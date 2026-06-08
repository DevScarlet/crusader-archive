import { useEffect, useState } from 'react'
import type { Faction } from '../types/faction'
import type { Unit, UnitStats } from '../types/unit'

const UNIT_FAVORITES_STORAGE_KEY = 'crusader-archive-favorites'
const FACTION_FAVORITES_STORAGE_KEY = 'crusader-archive-favorite-factions'
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

function parseFavoriteUnit(value: unknown): Unit | null {
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

function parseFavoriteFaction(value: unknown): Faction | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const favorite = value as Record<string, unknown>

  if (
    typeof favorite.name !== 'string' ||
    typeof favorite.factionType !== 'string' ||
    typeof favorite.unitCount !== 'number'
  ) {
    return null
  }

  return {
    name: favorite.name,
    factionType: favorite.factionType,
    unitCount: favorite.unitCount,
  }
}

function readFavoriteUnits(): Unit[] {
  try {
    const storedFavorites = localStorage.getItem(UNIT_FAVORITES_STORAGE_KEY)

    if (!storedFavorites) {
      return []
    }

    const parsedFavorites: unknown = JSON.parse(storedFavorites)

    if (!Array.isArray(parsedFavorites)) {
      return []
    }

    return parsedFavorites
      .map(parseFavoriteUnit)
      .filter((favorite): favorite is Unit => favorite !== null)
  } catch {
    return []
  }
}

function readFavoriteFactions(): Faction[] {
  try {
    const storedFavorites = localStorage.getItem(FACTION_FAVORITES_STORAGE_KEY)

    if (!storedFavorites) {
      return []
    }

    const parsedFavorites: unknown = JSON.parse(storedFavorites)

    if (!Array.isArray(parsedFavorites)) {
      return []
    }

    return parsedFavorites
      .map(parseFavoriteFaction)
      .filter((favorite): favorite is Faction => favorite !== null)
  } catch {
    return []
  }
}

function notifyFavoritesUpdated(): void {
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT))
}

export function useFavorites() {
  const [favoriteUnits, setFavoriteUnits] =
    useState<Unit[]>(readFavoriteUnits)
  const [favoriteFactions, setFavoriteFactions] =
    useState<Faction[]>(readFavoriteFactions)

  useEffect(() => {
    function refreshFavorites() {
      setFavoriteUnits(readFavoriteUnits())
      setFavoriteFactions(readFavoriteFactions())
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
    return favoriteUnits.some((favorite) => getUnitKey(favorite) === unitKey)
  }

  function addFavorite(unit: Unit): void {
    const currentFavorites = readFavoriteUnits()
    const unitKey = getUnitKey(unit)

    if (currentFavorites.some((favorite) => getUnitKey(favorite) === unitKey)) {
      return
    }

    localStorage.setItem(
      UNIT_FAVORITES_STORAGE_KEY,
      JSON.stringify([
      ...currentFavorites,
      {
        id: unit.id,
        name: unit.name,
        faction: unit.faction,
        factionType: unit.factionType,
        basePoints: unit.basePoints,
        stats: unit.stats,
      },
      ]),
    )
    notifyFavoritesUpdated()
  }

  function removeFavorite(unit: Unit): void {
    const unitKey = getUnitKey(unit)
    const remainingFavorites = readFavoriteUnits().filter(
      (favorite) => getUnitKey(favorite) !== unitKey,
    )

    localStorage.setItem(
      UNIT_FAVORITES_STORAGE_KEY,
      JSON.stringify(remainingFavorites),
    )
    notifyFavoritesUpdated()
  }

  function toggleFavorite(unit: Unit): void {
    if (isFavorite(unit)) {
      removeFavorite(unit)
    } else {
      addFavorite(unit)
    }
  }

  function isFactionFavorite(faction: Faction): boolean {
    return favoriteFactions.some(
      (favorite) => favorite.name === faction.name,
    )
  }

  function toggleFactionFavorite(faction: Faction): void {
    const currentFavorites = readFavoriteFactions()
    const alreadyFavorite = currentFavorites.some(
      (favorite) => favorite.name === faction.name,
    )
    const updatedFavorites = alreadyFavorite
      ? currentFavorites.filter((favorite) => favorite.name !== faction.name)
      : [...currentFavorites, faction]

    localStorage.setItem(
      FACTION_FAVORITES_STORAGE_KEY,
      JSON.stringify(updatedFavorites),
    )
    notifyFavoritesUpdated()
  }

  return {
    favoriteUnits,
    favoriteFactions,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    isFactionFavorite,
    toggleFactionFavorite,
  }
}
