import { useEffect, useState } from 'react'
import { getFactions } from '../api/openHammerApi'
import FactionCard from '../components/FactionCard'
import { useFavorites } from '../hooks/useFavorites'
import type { Faction } from '../types/faction'
import { compareOptionalNumbers } from '../utils/sort'

type FactionViewOption = 'all' | 'favorites-only' | 'favorites-first'
type FactionSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'unit-count-asc'
  | 'unit-count-desc'

function Factions() {
  const [factions, setFactions] = useState<Faction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewOption, setViewOption] = useState<FactionViewOption>('all')
  const [sortOption, setSortOption] =
    useState<FactionSortOption>('name-asc')
  const { isFactionFavorite, toggleFactionFavorite } = useFavorites()

  useEffect(() => {
    const controller = new AbortController()

    async function loadFactions() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const fetchedFactions = await getFactions(controller.signal)
        setFactions(fetchedFactions)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          'We could not load the factions. Check your connection and try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadFactions()

    return () => controller.abort()
  }, [requestNumber])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  function clearFilters() {
    setSearchTerm('')
    setViewOption('all')
    setSortOption('name-asc')
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const visibleFactions = factions
    .filter((faction) => {
      const matchesSearch = faction.name
        .toLowerCase()
        .includes(normalizedSearchTerm)
      const matchesView =
        viewOption !== 'favorites-only' || isFactionFavorite(faction)

      return matchesSearch && matchesView
    })
    .sort((firstFaction, secondFaction) => {
      if (viewOption === 'favorites-first') {
        const favoriteDifference =
          Number(isFactionFavorite(secondFaction)) -
          Number(isFactionFavorite(firstFaction))

        if (favoriteDifference !== 0) {
          return favoriteDifference
        }
      }

      if (sortOption === 'name-asc') {
        return firstFaction.name.localeCompare(secondFaction.name)
      }

      if (sortOption === 'name-desc') {
        return secondFaction.name.localeCompare(firstFaction.name)
      }

      return compareOptionalNumbers(
        firstFaction.unitCount,
        secondFaction.unitCount,
        sortOption === 'unit-count-asc' ? 'asc' : 'desc',
      )
    })

  return (
    <section aria-labelledby="factions-heading">
      <h1 id="factions-heading">Factions</h1>
      <p className="page-introduction">
        Browse the factions available in the OpenHammer archive.
      </p>

      {isLoading && (
        <p className="status-message" role="status">
          Loading factions...
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

      {!isLoading && !errorMessage && factions.length === 0 && (
        <p className="status-message">No factions are currently available.</p>
      )}

      {!isLoading && !errorMessage && factions.length > 0 && (
        <>
          <div className="browse-controls factions-controls">
            <div className="form-field browse-controls__search">
              <label htmlFor="faction-search">Search factions</label>
              <input
                id="faction-search"
                type="search"
                placeholder="Search by faction name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="faction-view">View</label>
              <select
                id="faction-view"
                value={viewOption}
                onChange={(event) =>
                  setViewOption(event.target.value as FactionViewOption)
                }
              >
                <option value="all">All factions</option>
                <option value="favorites-only">Favorites only</option>
                <option value="favorites-first">Favorites first</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="faction-sort">Sort by</label>
              <select
                id="faction-sort"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as FactionSortOption)
                }
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="unit-count-asc">Unit count low-high</option>
                <option value="unit-count-desc">Unit count high-low</option>
              </select>
            </div>

            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>

          <p className="results-count" role="status">
            Showing {visibleFactions.length} of {factions.length} factions
          </p>

          {visibleFactions.length === 0 ? (
            <p className="status-message">
              No factions match the current search and filters.
            </p>
          ) : (
            <div className="faction-grid">
              {visibleFactions.map((faction) => (
                <FactionCard
                  key={faction.name}
                  faction={faction}
                  isFavorite={isFactionFavorite(faction)}
                  onToggleFavorite={toggleFactionFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Factions
