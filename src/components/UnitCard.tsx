import { Link } from 'react-router-dom'
import { glossary } from '../data/glossary'
import type { Unit, UnitStats } from '../types/unit'
import FavoriteButton from './FavoriteButton'
import HelpTooltip from './HelpTooltip'

interface UnitCardProps {
  unit: Unit
  isFavorite?: boolean
  onToggleFavorite?: (unit: Unit) => void
}

const statLabels: Array<
  [keyof UnitStats, string, (typeof glossary)[keyof typeof glossary]]
> = [
  ['movement', 'M', glossary.movement],
  ['toughness', 'T', glossary.toughness],
  ['save', 'SV', glossary.save],
  ['wounds', 'W', glossary.wounds],
  ['leadership', 'LD', glossary.leadership],
  ['objectiveControl', 'OC', glossary.objectiveControl],
]

function UnitCard({
  unit,
  isFavorite = false,
  onToggleFavorite,
}: UnitCardProps) {
  const unitIdentifier = unit.id ?? unit.name
  const availableStats = statLabels.filter(
    ([statName]) => unit.stats?.[statName] !== undefined,
  )

  return (
    <article className="unit-card">
      <div className="card-heading-row">
        <Link
          className="unit-card__heading-link"
          to={`/units/${encodeURIComponent(unitIdentifier)}`}
        >
          <p className="unit-card__type">{unit.factionType}</p>
          <h2>{unit.name}</h2>
        </Link>

        {onToggleFavorite && (
          <FavoriteButton
            isFavorite={isFavorite}
            label={unit.name}
            onClick={() => onToggleFavorite(unit)}
          />
        )}
      </div>

      <div>
        <p className="unit-card__faction">{unit.faction}</p>

        {unit.basePoints !== undefined && (
          <p>
            <strong>{unit.basePoints}</strong> base points{' '}
            <HelpTooltip entry={glossary.points} />
          </p>
        )}

        {availableStats.length > 0 && (
          <dl className="unit-stats" aria-label={`${unit.name} stats`}>
            {availableStats.map(([statName, label, glossaryEntry]) => (
              <div key={statName}>
                <dt>
                  <HelpTooltip
                    entry={glossaryEntry}
                    triggerText={label}
                  />
                </dt>
                <dd>{unit.stats?.[statName]}</dd>
              </div>
            ))}
          </dl>
        )}

        <Link
          className="card-link-text"
          to={`/units/${encodeURIComponent(unitIdentifier)}`}
        >
          View unit
        </Link>
      </div>
    </article>
  )
}

export default UnitCard
