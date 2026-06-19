import HelpTooltip from '../components/HelpTooltip'
import { glossary } from '../data/glossary'
import {
  MAX_COMPARISON_UNITS,
  useComparison,
} from '../hooks/useComparison'
import type { Unit, UnitStats } from '../types/unit'

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

interface CompareUnitCardProps {
  unit: Unit
  onRemove: (unit: Unit) => void
}

function CompareUnitCard({ unit, onRemove }: CompareUnitCardProps) {
  return (
    <article className="compare-card">
      <div>
        <p className="unit-card__type">{unit.factionType}</p>
        <h2>{unit.name}</h2>
        <p className="unit-card__faction">{unit.faction}</p>
      </div>

      <dl className="compare-details">
        <div>
          <dt>
            Points <HelpTooltip entry={glossary.points} />
          </dt>
          <dd>{unit.basePoints ?? 'Not listed'}</dd>
        </div>
      </dl>

      {unit.stats ? (
        <dl className="unit-stats" aria-label={`${unit.name} stats`}>
          {statLabels.map(([statName, label, glossaryEntry]) => (
            <div key={statName}>
              <dt>
                <HelpTooltip entry={glossaryEntry} triggerText={label} />
              </dt>
              <dd>{unit.stats?.[statName] ?? '-'}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="status-message">No basic stats are listed.</p>
      )}

      <button type="button" onClick={() => onRemove(unit)}>
        Remove from comparison
      </button>
    </article>
  )
}

function Compare() {
  const { comparisonUnits, removeFromComparison, clearComparison } =
    useComparison()

  return (
    <section aria-labelledby="compare-heading">
      <h1 id="compare-heading">Compare Units</h1>
      <p className="page-introduction">
        Compare up to {MAX_COMPARISON_UNITS} selected units side-by-side.
      </p>

      {comparisonUnits.length === 0 ? (
        <p className="status-message">
          No units are selected for comparison yet. Use Compare on a unit card
          to add one here.
        </p>
      ) : (
        <>
          <div className="compare-actions">
            <p className="results-count">
              Comparing {comparisonUnits.length} of {MAX_COMPARISON_UNITS}{' '}
              units
            </p>
            <button type="button" onClick={clearComparison}>
              Clear comparison
            </button>
          </div>

          <div className="compare-grid">
            {comparisonUnits.map((unit) => (
              <CompareUnitCard
                key={unit.id ?? `${unit.faction}:${unit.name}`}
                unit={unit}
                onRemove={removeFromComparison}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Compare
