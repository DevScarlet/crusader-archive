import FactionCard from '../components/FactionCard'
import HelpTooltip from '../components/HelpTooltip'
import UnitCard from '../components/UnitCard'
import { glossary } from '../data/glossary'
import { useFavorites } from '../hooks/useFavorites'
import { compareOptionalNumbers } from '../utils/sort'
import { useState } from 'react'

type FactionSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'unit-count-asc'
  | 'unit-count-desc'

type UnitSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'points-asc'
  | 'points-desc'

function Favorites() {
  const [factionSearchTerm, setFactionSearchTerm] = useState('')
  const [factionSortOption, setFactionSortOption] =
    useState<FactionSortOption>('name-asc')
  const [unitSearchTerm, setUnitSearchTerm] = useState('')
  const [selectedUnitType, setSelectedUnitType] = useState('')
  const [unitSortOption, setUnitSortOption] =
    useState<UnitSortOption>('name-asc')
  const {
    favoriteUnits,
    favoriteFactions,
    isFavorite,
    toggleFavorite,
    isFactionFavorite,
    toggleFactionFavorite,
  } = useFavorites()

  function clearFactionFilters() {
    setFactionSearchTerm('')
    setFactionSortOption('name-asc')
  }

  function clearUnitFilters() {
    setUnitSearchTerm('')
    setSelectedUnitType('')
    setUnitSortOption('name-asc')
  }

  const normalizedFactionSearch = factionSearchTerm.trim().toLowerCase()
  const visibleFavoriteFactions = favoriteFactions
    .filter((faction) =>
      faction.name.toLowerCase().includes(normalizedFactionSearch),
    )
    .sort((firstFaction, secondFaction) => {
      if (factionSortOption === 'name-asc') {
        return firstFaction.name.localeCompare(secondFaction.name)
      }

      if (factionSortOption === 'name-desc') {
        return secondFaction.name.localeCompare(firstFaction.name)
      }

      return compareOptionalNumbers(
        firstFaction.unitCount,
        secondFaction.unitCount,
        factionSortOption === 'unit-count-asc' ? 'asc' : 'desc',
      )
    })

  const favoriteUnitTypes = Array.from(
    new Set(favoriteUnits.map((unit) => unit.factionType)),
  ).sort((firstType, secondType) => firstType.localeCompare(secondType))

  const normalizedUnitSearch = unitSearchTerm.trim().toLowerCase()
  const visibleFavoriteUnits = favoriteUnits
    .filter((unit) => {
      const matchesSearch = unit.name
        .toLowerCase()
        .includes(normalizedUnitSearch)
      const matchesType =
        selectedUnitType === '' || unit.factionType === selectedUnitType

      return matchesSearch && matchesType
    })
    .sort((firstUnit, secondUnit) => {
      if (unitSortOption === 'name-asc') {
        return firstUnit.name.localeCompare(secondUnit.name)
      }

      if (unitSortOption === 'name-desc') {
        return secondUnit.name.localeCompare(firstUnit.name)
      }

      return compareOptionalNumbers(
        firstUnit.basePoints,
        secondUnit.basePoints,
        unitSortOption === 'points-asc' ? 'asc' : 'desc',
      )
    })

  const unitsByFaction = visibleFavoriteUnits.reduce<
    Record<string, typeof favoriteUnits>
  >((groups, unit) => {
    const factionUnits = groups[unit.faction] ?? []
    groups[unit.faction] = [...factionUnits, unit]
    return groups
  }, {})

  const factionNames = Object.keys(unitsByFaction).sort((first, second) =>
    first.localeCompare(second),
  )

  return (
    <section aria-labelledby="favorites-heading">
      <h1 id="favorites-heading">Favorites</h1>
      <p className="page-introduction">
        Factions and units you save will be available here on this device.
      </p>

      <section className="favorites-section">
        <h2>Favorite Factions</h2>

        <div className="browse-controls">
          <div className="form-field browse-controls__search">
            <label htmlFor="favorite-faction-search">
              Search favorite factions
            </label>
            <input
              id="favorite-faction-search"
              type="search"
              placeholder="Search by faction name"
              value={factionSearchTerm}
              onChange={(event) => setFactionSearchTerm(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="favorite-faction-sort">Sort by</label>
            <select
              id="favorite-faction-sort"
              value={factionSortOption}
              onChange={(event) =>
                setFactionSortOption(event.target.value as FactionSortOption)
              }
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="unit-count-asc">Unit count low-high</option>
              <option value="unit-count-desc">Unit count high-low</option>
            </select>
          </div>

          <button type="button" onClick={clearFactionFilters}>
            Clear filters
          </button>
        </div>

        <p className="results-count" role="status">
          Showing {visibleFavoriteFactions.length} of {favoriteFactions.length}{' '}
          favorite factions
        </p>

        {visibleFavoriteFactions.length === 0 ? (
          <p className="status-message">
            {favoriteFactions.length === 0
              ? 'You have not saved any favorite factions yet.'
              : 'No favorite factions match the current filters.'}
          </p>
        ) : (
          <div className="faction-grid">
            {visibleFavoriteFactions.map((faction) => (
              <FactionCard
                key={faction.name}
                faction={faction}
                isFavorite={isFactionFavorite(faction)}
                onToggleFavorite={toggleFactionFavorite}
              />
            ))}
          </div>
        )}
      </section>

      <section className="favorites-section">
        <h2>Favorite Units</h2>

        <div className="favorite-unit-controls">
          <div className="form-field favorite-unit-controls__search">
            <label htmlFor="favorite-unit-search">Search favorite units</label>
            <input
              id="favorite-unit-search"
              type="search"
              placeholder="Search by unit name"
              value={unitSearchTerm}
              onChange={(event) => setUnitSearchTerm(event.target.value)}
            />
          </div>

          <div className="form-field">
            <div className="label-with-help">
              <label htmlFor="favorite-unit-type">Faction type</label>
              <HelpTooltip entry={glossary.factionType} />
            </div>
            <select
              id="favorite-unit-type"
              value={selectedUnitType}
              onChange={(event) => setSelectedUnitType(event.target.value)}
            >
              <option value="">All types</option>
              {favoriteUnitTypes.map((factionType) => (
                <option key={factionType} value={factionType}>
                  {factionType}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="favorite-unit-sort">Sort by</label>
            <select
              id="favorite-unit-sort"
              value={unitSortOption}
              onChange={(event) =>
                setUnitSortOption(event.target.value as UnitSortOption)
              }
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="points-asc">Points low-high</option>
              <option value="points-desc">Points high-low</option>
            </select>
          </div>

          <button type="button" onClick={clearUnitFilters}>
            Clear filters
          </button>
        </div>

        <p className="results-count" role="status">
          Showing {visibleFavoriteUnits.length} of {favoriteUnits.length}{' '}
          favorite units
        </p>

        {visibleFavoriteUnits.length === 0 ? (
          <p className="status-message">
            {favoriteUnits.length === 0
              ? 'You have not saved any favorite units yet.'
              : 'No favorite units match the current filters.'}
          </p>
        ) : (
          factionNames.map((factionName) => (
            <section className="favorite-unit-group" key={factionName}>
              <h3>{factionName}</h3>
              <div className="unit-grid">
                {unitsByFaction[factionName].map((unit) => (
                  <UnitCard
                    key={unit.id ?? `${unit.faction}:${unit.name}`}
                    unit={unit}
                    isFavorite={isFavorite(unit)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </section>
  )
}

export default Favorites
