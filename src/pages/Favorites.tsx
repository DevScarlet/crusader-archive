import UnitCard from '../components/UnitCard'
import { useFavorites } from '../hooks/useFavorites'

function Favorites() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites()

  return (
    <section aria-labelledby="favorites-heading">
      <h1 id="favorites-heading">Favorites</h1>
      <p className="page-introduction">
        Units you save will be available here on this device.
      </p>

      {favorites.length === 0 ? (
        <p className="status-message">
          You have not saved any favorite units yet.
        </p>
      ) : (
        <div className="unit-grid">
          {favorites.map((unit) => (
            <UnitCard
              key={unit.id ?? `${unit.faction}:${unit.name}`}
              unit={unit}
              isFavorite={isFavorite(unit)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default Favorites
