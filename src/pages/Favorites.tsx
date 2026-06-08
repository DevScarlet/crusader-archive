import FactionCard from '../components/FactionCard'
import UnitCard from '../components/UnitCard'
import { useFavorites } from '../hooks/useFavorites'
import { useState } from 'react'

function Favorites() {
  const [searchTerm, setSearchTerm] = useState('')
  const {
    favoriteUnits,
    favoriteFactions,
    isFavorite,
    toggleFavorite,
    isFactionFavorite,
    toggleFactionFavorite,
  } = useFavorites()

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const visibleFavoriteFactions = favoriteFactions.filter((faction) =>
    faction.name.toLowerCase().includes(normalizedSearchTerm),
  )
  const visibleFavoriteUnits = favoriteUnits.filter(
    (unit) =>
      unit.name.toLowerCase().includes(normalizedSearchTerm) ||
      unit.faction.toLowerCase().includes(normalizedSearchTerm),
  )
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

      <div className="browse-controls favorites-search">
        <div className="form-field browse-controls__search">
          <label htmlFor="favorites-search">Search favorites</label>
          <input
            id="favorites-search"
            type="search"
            placeholder="Search factions or units"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <section className="favorites-section">
        <h2>Favorite Factions</h2>
        {visibleFavoriteFactions.length === 0 ? (
          <p className="status-message">
            {favoriteFactions.length === 0
              ? 'You have not saved any favorite factions yet.'
              : 'No favorite factions match your search.'}
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
        {visibleFavoriteUnits.length === 0 ? (
          <p className="status-message">
            {favoriteUnits.length === 0
              ? 'You have not saved any favorite units yet.'
              : 'No favorite units match your search.'}
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
