import { Link } from 'react-router-dom'
import { glossary } from '../data/glossary'
import type { Unit, UnitStats } from '../types/unit'
import AddToArmyButton from './AddToArmyButton'
import FavoriteButton from './FavoriteButton'
import HelpTooltip from './HelpTooltip'

interface UnitCardProps {
  unit: Unit
  isFavorite?: boolean
  onToggleFavorite?: (unit: Unit) => void
  isCompared?: boolean
  canCompareMore?: boolean
  onToggleCompare?: (unit: Unit) => void
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
  isCompared = false,
  canCompareMore = true,
  onToggleCompare,
}: UnitCardProps) {
  const unitIdentifier = unit.id ?? unit.name
  const availableStats = statLabels.filter(
    ([statName]) => unit.stats?.[statName] !== undefined,
  )

  return (
    <article className="unit-card">
      <div className="card-heading-row">
        <div className="unit-card__heading-link">
          <p className="unit-card__type">{unit.factionType}</p>
          <h2>
            <Link to={`/units/${encodeURIComponent(unitIdentifier)}`}>
              {unit.name}
            </Link>
          </h2>
        </div>

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

        <div className="unit-card-actions">
          <AddToArmyButton unit={unit} />

          {onToggleCompare && (
            <button
              type="button"
              className="compare-toggle"
              aria-pressed={isCompared}
              disabled={!isCompared && !canCompareMore}
              onClick={() => onToggleCompare(unit)}
            >
              {isCompared
                ? 'Remove from compare'
                : canCompareMore
                  ? 'Compare'
                  : 'Compare limit reached'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default UnitCard
