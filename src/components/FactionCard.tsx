import { Link } from 'react-router-dom'
import type { Faction } from '../types/faction'
import FavoriteButton from './FavoriteButton'

interface FactionCardProps {
  faction: Faction
  isFavorite?: boolean
  onToggleFavorite?: (faction: Faction) => void
}

function FactionCard({
  faction,
  isFavorite = false,
  onToggleFavorite,
}: FactionCardProps) {
  const factionPath = `/factions/${encodeURIComponent(faction.name)}`

  return (
    <article className="faction-card">
      <div className="card-heading-row">
        <Link className="faction-card__heading-link" to={factionPath}>
          <p className="faction-card__type">{faction.factionType}</p>
          <h2>{faction.name}</h2>
        </Link>

        {onToggleFavorite && (
          <FavoriteButton
            isFavorite={isFavorite}
            label={faction.name}
            onClick={() => onToggleFavorite(faction)}
          />
        )}
      </div>

      <p>
        {faction.unitCount} {faction.unitCount === 1 ? 'unit' : 'units'}
      </p>
      <Link className="card-link-text" to={factionPath}>
        View faction
      </Link>
    </article>
  )
}

export default FactionCard
