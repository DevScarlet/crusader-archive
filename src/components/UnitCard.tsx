import type { Unit, UnitStats } from '../types/unit'

interface UnitCardProps {
  unit: Unit
}

const statLabels: Array<[keyof UnitStats, string]> = [
  ['movement', 'M'],
  ['toughness', 'T'],
  ['save', 'SV'],
  ['wounds', 'W'],
  ['leadership', 'LD'],
  ['objectiveControl', 'OC'],
]

function UnitCard({ unit }: UnitCardProps) {
  const availableStats = statLabels.filter(
    ([statName]) => unit.stats?.[statName] !== undefined,
  )

  return (
    <article className="unit-card">
      <p className="unit-card__type">{unit.factionType}</p>
      <h2>{unit.name}</h2>
      <p className="unit-card__faction">{unit.faction}</p>

      {unit.basePoints !== undefined && (
        <p>
          <strong>{unit.basePoints}</strong> base points
        </p>
      )}

      {availableStats.length > 0 && (
        <dl className="unit-stats" aria-label={`${unit.name} stats`}>
          {availableStats.map(([statName, label]) => (
            <div key={statName}>
              <dt>{label}</dt>
              <dd>{unit.stats?.[statName]}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}

export default UnitCard
