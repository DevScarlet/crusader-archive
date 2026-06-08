import { Link } from 'react-router-dom'
import type { Faction } from '../types/faction'

interface FactionCardProps {
  faction: Faction
}

function FactionCard({ faction }: FactionCardProps) {
  return (
    <article className="faction-card">
      <p className="faction-card__type">{faction.factionType}</p>
      <h2>{faction.name}</h2>
      <p>
        {faction.unitCount} {faction.unitCount === 1 ? 'unit' : 'units'}
      </p>
      <Link to={`/factions/${encodeURIComponent(faction.name)}`}>
        View faction
      </Link>
    </article>
  )
}

export default FactionCard
