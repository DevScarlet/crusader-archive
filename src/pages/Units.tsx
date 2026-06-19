import { useEffect, useState } from 'react'
import { getUnits } from '../api/openHammerApi'
import UnitCard from '../components/UnitCard'
import { useComparison } from '../hooks/useComparison'
import { useFavorites } from '../hooks/useFavorites'
import type { Unit } from '../types/unit'
import { compareOptionalNumbers } from '../utils/sort'

type UnitSortOption = 'name-asc' | 'name-desc' | 'points-asc' | 'points-desc'
type UnitViewOption = 'all' | 'favorites-only' | 'favorites-first'

function getUniqueSortedValues(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  ).sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))
}

function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFaction, setSelectedFaction] = useState('')
  const [selectedFactionType, setSelectedFactionType] = useState('')
  const [selectedUnitType, setSelectedUnitType] = useState('')
  const [viewOption, setViewOption] = useState<UnitViewOption>('all')
  const [sortOption, setSortOption] = useState<UnitSortOption>('name-asc')
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isCompared, canAddUnit, toggleComparison } = useComparison()

  useEffect(() => {
    const controller = new AbortController()

    async function loadUnits() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const fetchedUnits = await getUnits(controller.signal)
        setUnits(fetchedUnits)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          'We could not load the units. Check your connection and try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadUnits()

    return () => controller.abort()
  }, [requestNumber])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedFaction('')
    setSelectedFactionType('')
    setSelectedUnitType('')
    setViewOption('all')
    setSortOption('name-asc')
  }

  const factions = getUniqueSortedValues(units.map((unit) => unit.faction))
  const factionTypes = getUniqueSortedValues(
    units.map((unit) => unit.factionType),
  )
  const unitTypes = getUniqueSortedValues(units.map((unit) => unit.unitType))
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const visibleUnits = units
    .filter((unit) => {
      const matchesSearch = unit.name
        .toLowerCase()
        .includes(normalizedSearchTerm)
      const matchesFaction =
        selectedFaction === '' || unit.faction === selectedFaction
      const matchesFactionType =
        selectedFactionType === '' || unit.factionType === selectedFactionType
      const matchesUnitType =
        selectedUnitType === '' || unit.unitType === selectedUnitType
      const matchesView =
        viewOption !== 'favorites-only' || isFavorite(unit)

      return (
        matchesSearch &&
        matchesFaction &&
        matchesFactionType &&
        matchesUnitType &&
        matchesView
      )
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

      return compareOptionalNumbers(
        firstUnit.basePoints,
        secondUnit.basePoints,
        sortOption === 'points-asc' ? 'asc' : 'desc',
      )
    })

  return (
    <section aria-labelledby="units-heading">
      <h1 id="units-heading">Units</h1>
      <p className="page-introduction">
        Browse units from every faction in the OpenHammer archive.
      </p>

      {isLoading && (
        <p className="status-message" role="status">
          Loading units...
        </p>
      )}

      {!isLoading && errorMessage && (
        <div className="error-message" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={retryRequest}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && units.length === 0 && (
        <p className="status-message">No units are currently available.</p>
      )}

      {!isLoading && !errorMessage && units.length > 0 && (
        <>
          <div className="unit-controls global-unit-controls">
            <div className="form-field global-unit-controls__search">
              <label htmlFor="global-unit-search">Search units</label>
              <input
                id="global-unit-search"
                type="search"
                placeholder="Search by unit name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="global-unit-faction">Faction</label>
              <select
                id="global-unit-faction"
                value={selectedFaction}
                onChange={(event) => setSelectedFaction(event.target.value)}
              >
                <option value="">All factions</option>
                {factions.map((faction) => (
                  <option key={faction} value={faction}>
                    {faction}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="global-unit-faction-type">Faction type</label>
              <select
                id="global-unit-faction-type"
                value={selectedFactionType}
                onChange={(event) =>
                  setSelectedFactionType(event.target.value)
                }
              >
                <option value="">All faction types</option>
                {factionTypes.map((factionType) => (
                  <option key={factionType} value={factionType}>
                    {factionType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="global-unit-type">Unit type</label>
              <select
                id="global-unit-type"
                value={selectedUnitType}
                onChange={(event) => setSelectedUnitType(event.target.value)}
              >
                <option value="">All unit types</option>
                {unitTypes.map((unitType) => (
                  <option key={unitType} value={unitType}>
                    {unitType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="global-unit-view">View</label>
              <select
                id="global-unit-view"
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
              <label htmlFor="global-unit-sort">Sort by</label>
              <select
                id="global-unit-sort"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as UnitSortOption)
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
                  key={unit.id ?? `${unit.faction}-${unit.name}-${index}`}
                  unit={unit}
                  isFavorite={isFavorite(unit)}
                  onToggleFavorite={toggleFavorite}
                  isCompared={isCompared(unit)}
                  canCompareMore={canAddUnit(unit)}
                  onToggleCompare={toggleComparison}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Units
