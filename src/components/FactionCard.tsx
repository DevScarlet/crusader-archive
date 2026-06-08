import { Link } from 'react-router-dom'
import type { Faction } from '../types/faction'

interface FactionCardProps {
  faction: Faction
}

function FactionCard({ faction }: FactionCardProps) {
  return (
    <Link
      className="faction-card"
      to={`/factions/${encodeURIComponent(faction.name)}`}
    >
      <article>
        <p className="faction-card__type">{faction.factionType}</p>
        <h2>{faction.name}</h2>
        <p>
          {faction.unitCount} {faction.unitCount === 1 ? 'unit' : 'units'}
        </p>
        <span className="card-link-text">View faction</span>
      </article>
    </Link>
  )
}

export default FactionCard
