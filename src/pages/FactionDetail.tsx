import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUnitsByFaction } from '../api/openHammerApi'
import FavoriteButton from '../components/FavoriteButton'
import UnitCard from '../components/UnitCard'
import { useFavorites } from '../hooks/useFavorites'
import type { Faction } from '../types/faction'
import type { Unit } from '../types/unit'

type SortOption = 'name-asc' | 'name-desc' | 'points-asc' | 'points-desc'
type UnitViewOption = 'all' | 'favorites-only' | 'favorites-first'

function FactionDetail() {
  const { factionName: encodedFactionName } = useParams<{
    factionName: string
  }>()
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('name-asc')
  const [viewOption, setViewOption] = useState<UnitViewOption>('all')
  const {
    isFavorite,
    toggleFavorite,
    isFactionFavorite,
    toggleFactionFavorite,
  } = useFavorites()

  let factionName: string | null = null

  if (encodedFactionName) {
    try {
      factionName = decodeURIComponent(encodedFactionName)
    } catch {
      factionName = null
    }
  }

  useEffect(() => {
    if (!factionName) {
      return
    }

    const selectedFactionName = factionName
    const controller = new AbortController()

    async function loadUnits() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const fetchedUnits = await getUnitsByFaction(
          selectedFactionName,
          controller.signal,
        )
        setUnits(fetchedUnits)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          `We could not load units for ${selectedFactionName}. Check your connection and try again.`,
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadUnits()

    return () => controller.abort()
  }, [factionName, requestNumber])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedType('')
    setSortOption('name-asc')
    setViewOption('all')
  }

  const factionTypes = Array.from(
    new Set(units.map((unit) => unit.factionType)),
  ).sort((firstType, secondType) => firstType.localeCompare(secondType))

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const visibleUnits = units
    .filter((unit) => {
      const matchesSearch = unit.name
        .toLowerCase()
        .includes(normalizedSearchTerm)
      const matchesType =
        selectedType === '' || unit.factionType === selectedType
      const matchesView =
        viewOption !== 'favorites-only' || isFavorite(unit)

      return matchesSearch && matchesType && matchesView
    })
    .sort((firstUnit, secondUnit) => {
      if (viewOption === 'favorites-first') {
        const favoriteDifference =
          Number(isFavorite(secondUnit)) - Number(isFavorite(firstUnit))

        if (favoriteDifference !== 0) {
          return favoriteDifference
        }
      }

      if (sortOption === 'name-asc') {
        return firstUnit.name.localeCompare(secondUnit.name)
      }

      if (sortOption === 'name-desc') {
        return secondUnit.name.localeCompare(firstUnit.name)
      }

      if (firstUnit.basePoints === undefined) {
        return secondUnit.basePoints === undefined ? 0 : 1
      }

      if (secondUnit.basePoints === undefined) {
        return -1
      }

      return sortOption === 'points-asc'
        ? firstUnit.basePoints - secondUnit.basePoints
        : secondUnit.basePoints - firstUnit.basePoints
    })

  const selectedFaction: Faction | null =
    factionName && units.length > 0
      ? {
          name: factionName,
          factionType: units[0].factionType,
          unitCount: units.length,
        }
      : null

  return (
    <section aria-labelledby="faction-heading">
      <Link className="back-link" to="/factions">
        Back to factions
      </Link>
      <div className="page-heading-row">
        <h1 id="faction-heading">{factionName ?? 'Faction'}</h1>
        {selectedFaction && (
          <FavoriteButton
            isFavorite={isFactionFavorite(selectedFaction)}
            label={selectedFaction.name}
            onClick={() => toggleFactionFavorite(selectedFaction)}
          />
        )}
      </div>

      {!factionName && (
        <div className="error-message" role="alert">
          <p>This faction name is not valid.</p>
        </div>
      )}

      {factionName && isLoading && (
        <p className="status-message" role="status">
          Loading units...
        </p>
      )}

      {factionName && !isLoading && errorMessage && (
        <div className="error-message" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={retryRequest}>
            Try again
          </button>
        </div>
      )}

      {factionName && !isLoading && !errorMessage && units.length === 0 && (
        <p className="status-message">
          No units are currently available for this faction.
        </p>
      )}

      {factionName && !isLoading && !errorMessage && units.length > 0 && (
        <>
          <div className="unit-controls">
            <div className="form-field unit-controls__search">
              <label htmlFor="unit-search">Search units</label>
              <input
                id="unit-search"
                type="search"
                placeholder="Search by unit name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="faction-type-filter">Faction type</label>
              <select
                id="faction-type-filter"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
              >
                <option value="">All types</option>
                {factionTypes.map((factionType) => (
                  <option key={factionType} value={factionType}>
                    {factionType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="unit-view">View</label>
              <select
                id="unit-view"
                value={viewOption}
                onChange={(event) =>
                  setViewOption(event.target.value as UnitViewOption)
                }
              >
                <option value="all">All units</option>
                <option value="favorites-only">Favorites only</option>
                <option value="favorites-first">Favorites first</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="unit-sort">Sort by</label>
              <select
                id="unit-sort"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="points-asc">Points low-high</option>
                <option value="points-desc">Points high-low</option>
              </select>
            </div>

            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>

          <p className="results-count" role="status">
            Showing {visibleUnits.length} of {units.length} units
          </p>

          {visibleUnits.length === 0 ? (
            <p className="status-message">
              No units match the current search and filters.
            </p>
          ) : (
            <div className="unit-grid">
              {visibleUnits.map((unit, index) => (
                <UnitCard
                  key={unit.id ?? `${unit.name}-${index}`}
                  unit={unit}
                  isFavorite={isFavorite(unit)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default FactionDetail
