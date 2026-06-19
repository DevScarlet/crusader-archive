import { Link } from 'react-router-dom'
import HelpTooltip from '../components/HelpTooltip'
import { glossary } from '../data/glossary'
import {
  MAX_COMPARISON_UNITS,
  useComparison,
} from '../hooks/useComparison'
import type { Unit, UnitStats } from '../types/unit'

type RankClass = 'compare-cell--best' | 'compare-cell--worst' | ''
type StatDirection = 'higher-is-better' | 'lower-is-better'

interface CompareRow {
  label: string
  statName?: keyof UnitStats
  glossaryEntry?: (typeof glossary)[keyof typeof glossary]
  direction?: StatDirection
}

const compareRows: CompareRow[] = [
  {
    label: 'Points',
    glossaryEntry: glossary.points,
  },
  {
    label: 'M',
    statName: 'movement',
    glossaryEntry: glossary.movement,
    direction: 'higher-is-better',
  },
  {
    label: 'T',
    statName: 'toughness',
    glossaryEntry: glossary.toughness,
    direction: 'higher-is-better',
  },
  {
    label: 'SV',
    statName: 'save',
    glossaryEntry: glossary.save,
    direction: 'lower-is-better',
  },
  {
    label: 'W',
    statName: 'wounds',
    glossaryEntry: glossary.wounds,
    direction: 'higher-is-better',
  },
  {
    label: 'LD',
    statName: 'leadership',
    glossaryEntry: glossary.leadership,
    direction: 'lower-is-better',
  },
  {
    label: 'OC',
    statName: 'objectiveControl',
    glossaryEntry: glossary.objectiveControl,
    direction: 'higher-is-better',
  },
]

function getUnitIdentifier(unit: Unit): string {
  return unit.id ?? unit.name
}

function getDisplayValue(unit: Unit, row: CompareRow): string {
  if (!row.statName) {
    return unit.basePoints === undefined ? '-' : String(unit.basePoints)
  }

  return unit.stats?.[row.statName] ?? '-'
}

function parseStatValue(value: string): number | null {
  const firstNumber = value.match(/\d+/)?.[0]

  if (!firstNumber) {
    return null
  }

  return Number(firstNumber)
}

function getRankClasses(
  units: Unit[],
  row: CompareRow,
): Record<string, RankClass> {
  if (!row.statName || !row.direction || units.length < 2) {
    return {}
  }

  const statName = row.statName
  const parsedValues = units
    .map((unit) => {
      const rawValue = unit.stats?.[statName]
      const parsedValue = rawValue ? parseStatValue(rawValue) : null

      return {
        unit,
        parsedValue,
      }
    })
    .filter(
      (entry): entry is { unit: Unit; parsedValue: number } =>
        entry.parsedValue !== null,
    )

  if (parsedValues.length < 2) {
    return {}
  }

  const values = parsedValues.map((entry) => entry.parsedValue)
  const bestValue =
    row.direction === 'higher-is-better'
      ? Math.max(...values)
      : Math.min(...values)
  const worstValue =
    row.direction === 'higher-is-better'
      ? Math.min(...values)
      : Math.max(...values)

  if (bestValue === worstValue) {
    return {}
  }

  return parsedValues.reduce<Record<string, RankClass>>((classes, entry) => {
    const unitKey = getUnitIdentifier(entry.unit)

    if (entry.parsedValue === bestValue) {
      classes[unitKey] = 'compare-cell--best'
    } else if (entry.parsedValue === worstValue) {
      classes[unitKey] = 'compare-cell--worst'
    }

    return classes
  }, {})
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

          <div className="compare-legend" aria-label="Comparison legend">
            <span className="legend-item legend-item--best">
              Best: stronger stat
            </span>
            <span className="legend-item legend-item--worst">
              Weakest: weaker stat
            </span>
            <span>Points are not color-ranked.</span>
          </div>

          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">Stat</th>
                  {comparisonUnits.map((unit) => (
                    <th scope="col" key={getUnitIdentifier(unit)}>
                      <Link
                        className="compare-unit-link"
                        to={`/units/${encodeURIComponent(getUnitIdentifier(unit))}`}
                      >
                        {unit.name}
                      </Link>
                      <span>{unit.faction}</span>
                      <span>{unit.factionType}</span>
                      <button
                        type="button"
                        onClick={() => removeFromComparison(unit)}
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => {
                  const rankClasses = getRankClasses(comparisonUnits, row)

                  return (
                    <tr key={row.label}>
                      <th scope="row">
                        {row.glossaryEntry ? (
                          <HelpTooltip
                            entry={row.glossaryEntry}
                            triggerText={row.label}
                          />
                        ) : (
                          row.label
                        )}
                      </th>
                      {comparisonUnits.map((unit) => {
                        const unitKey = getUnitIdentifier(unit)
                        const rankClass = rankClasses[unitKey] ?? ''

                        return (
                          <td className={rankClass} key={unitKey}>
                            <strong>{getDisplayValue(unit, row)}</strong>
                            {rankClass === 'compare-cell--best' && (
                              <span>Best</span>
                            )}
                            {rankClass === 'compare-cell--worst' && (
                              <span>Weakest</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default Compare
