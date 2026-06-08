import FactionCard from '../components/FactionCard'
import UnitCard from '../components/UnitCard'
import { useFavorites } from '../hooks/useFavorites'

function Favorites() {
  const {
    favoriteUnits,
    favoriteFactions,
    isFavorite,
    toggleFavorite,
    isFactionFavorite,
    toggleFactionFavorite,
  } = useFavorites()

  const unitsByFaction = favoriteUnits.reduce<Record<string, typeof favoriteUnits>>(
    (groups, unit) => {
      const factionUnits = groups[unit.faction] ?? []
      groups[unit.faction] = [...factionUnits, unit]
      return groups
    },
    {},
  )

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
        {favoriteFactions.length === 0 ? (
          <p className="status-message">
            You have not saved any favorite factions yet.
          </p>
        ) : (
          <div className="faction-grid">
            {favoriteFactions.map((faction) => (
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
        {favoriteUnits.length === 0 ? (
          <p className="status-message">
            You have not saved any favorite units yet.
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
