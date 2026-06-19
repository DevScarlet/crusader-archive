import { useEffect, useState } from 'react'
import { getFactions, getUnits } from '../api/openHammerApi'
import UnitCard from '../components/UnitCard'
import { useComparison } from '../hooks/useComparison'
import { useFavorites } from '../hooks/useFavorites'
import type { Faction } from '../types/faction'
import type { Unit } from '../types/unit'

type UnitSortOption = 'name-asc' | 'name-desc' | 'points-asc' | 'points-desc'
type UnitViewOption = 'all' | 'favorites-only' | 'favorites-first'
type PageButton = number | 'ellipsis'

const defaultPageSize = 25
const pageSizeOptions = [10, 25, 50]
const unitTypes = ['model', 'unit']

function getUniqueSortedValues(values: string[]): string[] {
  return Array.from(new Set(values)).sort((firstValue, secondValue) =>
    firstValue.localeCompare(secondValue),
  )
}

function getSortBy(sortOption: UnitSortOption): string {
  if (sortOption === 'name-desc') {
    return '-name'
  }

  if (sortOption === 'points-asc') {
    return 'points'
  }

  if (sortOption === 'points-desc') {
    return '-points'
  }

  return 'name'
}

function getPageButtons(
  currentPage: number,
  totalPages: number | null,
  hasNextPage: boolean,
): PageButton[] {
  if (totalPages === null) {
    const nearbyPages = currentPage === 1 ? [1] : [1, currentPage]

    return hasNextPage ? [...nearbyPages, currentPage + 1] : nearbyPages
  }

  const pageNumbers = new Set<number>([1, totalPages])

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pageNumbers.add(page)
    }
  }

  if (currentPage <= 3) {
    pageNumbers.add(2)
    pageNumbers.add(3)
  }

  if (currentPage >= totalPages - 2) {
    pageNumbers.add(totalPages - 1)
    pageNumbers.add(totalPages - 2)
  }

  const sortedPages = Array.from(pageNumbers)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((firstPage, secondPage) => firstPage - secondPage)
  const pageButtons: PageButton[] = []

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1]

    if (previousPage !== undefined && page - previousPage > 1) {
      pageButtons.push('ellipsis')
    }

    pageButtons.push(page)
  })

  return pageButtons
}

function getResultSummary(
  visibleUnitCount: number,
  fetchedUnitCount: number,
  currentPage: number,
  pageSize: number,
  totalCount: number | null,
  viewOption: UnitViewOption,
): string {
  if (fetchedUnitCount === 0) {
    return totalCount === null
      ? 'Showing 0 units'
      : `Showing 0 of ${totalCount} units`
  }

  const startResult = (currentPage - 1) * pageSize + 1
  const endResult = startResult + fetchedUnitCount - 1

  if (viewOption !== 'all') {
    const totalText =
      totalCount === null
        ? 'the current API page'
        : `${startResult}–${endResult} of ${totalCount} units`

    return `Showing ${visibleUnitCount} units from ${totalText}`
  }

  if (totalCount === null) {
    return `Showing ${startResult}–${endResult} units`
  }

  return `Showing ${startResult}–${endResult} of ${totalCount} units`
}

function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(
    null,
  )
  const [requestNumber, setRequestNumber] = useState(0)
  const [factions, setFactions] = useState<Faction[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFaction, setSelectedFaction] = useState('')
  const [selectedFactionType, setSelectedFactionType] = useState('')
  const [selectedUnitType, setSelectedUnitType] = useState('')
  const [viewOption, setViewOption] = useState<UnitViewOption>('all')
  const [sortOption, setSortOption] = useState<UnitSortOption>('name-asc')
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isCompared, canAddUnit, toggleComparison } = useComparison()

  useEffect(() => {
    const controller = new AbortController()

    async function loadFilterOptions() {
      setFilterOptionsError(null)

      try {
        const fetchedFactions = await getFactions(controller.signal)
        setFactions(fetchedFactions)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setFilterOptionsError(
          'Faction filter options could not load. You can still browse units.',
        )
      }
    }

    void loadFilterOptions()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const offset = (currentPage - 1) * pageSize
    const trimmedSearchTerm = searchTerm.trim()

    async function loadUnits() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const result = await getUnits(
          {
            limit: pageSize,
            offset,
            name: trimmedSearchTerm || undefined,
            faction: selectedFaction || undefined,
            factionType: selectedFactionType || undefined,
            unitType: selectedUnitType || undefined,
            sortBy: getSortBy(sortOption),
          },
          controller.signal,
        )

        setUnits(result.units)
        setTotalCount(result.totalCount)
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
  }, [
    currentPage,
    pageSize,
    requestNumber,
    searchTerm,
    selectedFaction,
    selectedFactionType,
    selectedUnitType,
    sortOption,
  ])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  function resetToFirstPage() {
    setCurrentPage(1)
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedFaction('')
    setSelectedFactionType('')
    setSelectedUnitType('')
    setViewOption('all')
    setSortOption('name-asc')
    setPageSize(defaultPageSize)
    setCurrentPage(1)
  }

  function clearFactionTypeFilter() {
    setSelectedFactionType('')
    resetToFirstPage()
  }

  function clearUnitTypeFilter() {
    setSelectedUnitType('')
    resetToFirstPage()
  }

  const factionNames = factions.map((faction) => faction.name)
  const factionTypes = getUniqueSortedValues(
    factions.map((faction) => faction.factionType),
  )
  const activeAdvancedFilterCount =
    Number(Boolean(selectedFactionType)) + Number(Boolean(selectedUnitType))
  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(selectedFaction) ||
    Boolean(selectedFactionType) ||
    Boolean(selectedUnitType) ||
    viewOption !== 'all'
  // Favorites live in localStorage, so the API cannot sort or filter by them.
  // Keep that behavior limited to the units already fetched for this page.
  const visibleUnits = units
    .filter((unit) => viewOption !== 'favorites-only' || isFavorite(unit))
    .sort((firstUnit, secondUnit) => {
      if (viewOption !== 'favorites-first') {
        return 0
      }

      return Number(isFavorite(secondUnit)) - Number(isFavorite(firstUnit))
    })
  const totalPages =
    totalCount === null ? null : Math.max(1, Math.ceil(totalCount / pageSize))
  const hasNextPage =
    totalPages === null ? units.length === pageSize : currentPage < totalPages
  const hasPreviousPage = currentPage > 1
  const pageButtons = getPageButtons(currentPage, totalPages, hasNextPage)
  const resultSummary = getResultSummary(
    visibleUnits.length,
    units.length,
    currentPage,
    pageSize,
    totalCount,
    viewOption,
  )

  return (
    <section aria-labelledby="units-heading">
      <h1 id="units-heading">Units</h1>
      <p className="page-introduction">
        Browse units from every faction in the OpenHammer archive.
      </p>

      {filterOptionsError && (
        <p className="error-message" role="alert">
          {filterOptionsError}
        </p>
      )}

      <div className="unit-controls global-unit-controls">
        <div className="form-field global-unit-controls__search">
          <label htmlFor="global-unit-search">Search units</label>
          <input
            id="global-unit-search"
            type="search"
            placeholder="Search by unit name"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              resetToFirstPage()
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="global-unit-faction">Faction</label>
          <select
            id="global-unit-faction"
            value={selectedFaction}
            onChange={(event) => {
              setSelectedFaction(event.target.value)
              resetToFirstPage()
            }}
          >
            <option value="">All factions</option>
            {factionNames.map((faction) => (
              <option key={faction} value={faction}>
                {faction}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="global-unit-view">View</label>
          <select
            id="global-unit-view"
            value={viewOption}
            onChange={(event) => {
              setViewOption(event.target.value as UnitViewOption)
              resetToFirstPage()
            }}
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
            onChange={(event) => {
              setSortOption(event.target.value as UnitSortOption)
              resetToFirstPage()
            }}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="points-asc">Points low-high</option>
            <option value="points-desc">Points high-low</option>
          </select>
        </div>

        <button
          type="button"
          className="more-filters-button"
          aria-expanded={isMoreFiltersOpen}
          aria-controls="global-unit-more-filters"
          onClick={() =>
            setIsMoreFiltersOpen((currentIsMoreFiltersOpen) =>
              !currentIsMoreFiltersOpen,
            )
          }
        >
          More filters
          {activeAdvancedFilterCount > 0
            ? ` (${activeAdvancedFilterCount})`
            : ''}
        </button>
      </div>

      {activeAdvancedFilterCount > 0 && (
        <div className="active-filter-chips" aria-label="Active filters">
          <span>Active filters:</span>

          {selectedFactionType && (
            <button type="button" onClick={clearFactionTypeFilter}>
              {selectedFactionType} ×
            </button>
          )}

          {selectedUnitType && (
            <button type="button" onClick={clearUnitTypeFilter}>
              {selectedUnitType} ×
            </button>
          )}

          <button type="button" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {isMoreFiltersOpen && (
        <div
          className="more-filters-panel"
          id="global-unit-more-filters"
        >
          <div className="form-field">
            <label htmlFor="global-unit-faction-type">Faction type</label>
            <select
              id="global-unit-faction-type"
              value={selectedFactionType}
              onChange={(event) => {
                setSelectedFactionType(event.target.value)
                resetToFirstPage()
              }}
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
              onChange={(event) => {
                setSelectedUnitType(event.target.value)
                resetToFirstPage()
              }}
            >
              <option value="">All unit types</option>
              {unitTypes.map((unitType) => (
                <option key={unitType} value={unitType}>
                  {unitType}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="clear-filters-button"
            disabled={!hasActiveFilters}
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

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

      {!errorMessage && (
        <>
          <div className="results-toolbar">
            <p className="results-count" role="status">
              {resultSummary}
            </p>

            <div className="form-field results-per-page-field">
              <label htmlFor="global-unit-page-size">Results per page</label>
              <select
                id="global-unit-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  resetToFirstPage()
                }}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isLoading && units.length === 0 && (
            <p className="status-message">
              No units match the current search and filters.
            </p>
          )}

          {!isLoading && units.length > 0 && visibleUnits.length === 0 && (
            <p className="status-message">
              No units on this page match the current favorites view.
            </p>
          )}

          {visibleUnits.length > 0 && (
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

          {units.length > 0 && (
            <nav className="pagination-controls" aria-label="Unit pages">
              <button
                type="button"
                disabled={!hasPreviousPage || isLoading}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                Previous
              </button>

              {pageButtons.map((pageButton, index) =>
                pageButton === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} aria-hidden="true">
                    ...
                  </span>
                ) : (
                  <button
                    type="button"
                    key={pageButton}
                    aria-current={
                      pageButton === currentPage ? 'page' : undefined
                    }
                    disabled={pageButton === currentPage || isLoading}
                    onClick={() => setCurrentPage(pageButton)}
                  >
                    {pageButton}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={!hasNextPage || isLoading}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}

export default Units
