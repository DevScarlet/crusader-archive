import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFactions } from '../api/openHammerApi'
import {
  type ArmyPlannerUnit,
  useArmyPlanner,
} from '../hooks/useArmyPlanner'
import type { Faction } from '../types/faction'

function getSubtotal(unit: ArmyPlannerUnit): number {
  return (unit.points ?? 0) * unit.quantity
}

function ArmyPlanner() {
  const [factions, setFactions] = useState<Faction[]>([])
  const [factionsError, setFactionsError] = useState<string | null>(null)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const {
    armyList,
    totalUnits,
    totalPoints,
    updateListName,
    updateListFaction,
    updateQuantity,
    removeUnit,
    clearList,
  } = useArmyPlanner()

  useEffect(() => {
    const controller = new AbortController()

    async function loadFactions() {
      setFactionsError(null)

      try {
        const fetchedFactions = await getFactions(controller.signal)
        setFactions(fetchedFactions)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setFactionsError(
          'Faction choices could not load. You can still use the current list.',
        )
      }
    }

    void loadFactions()

    return () => controller.abort()
  }, [])

  function handleFactionChange(factionName: string) {
    const selectedFaction = factions.find(
      (faction) => faction.name === factionName,
    )

    updateListFaction(selectedFaction)
  }

  function handleClearList() {
    clearList()
    setIsConfirmingClear(false)
  }

  return (
    <section aria-labelledby="army-planner-heading">
      <h1 id="army-planner-heading">Army Planner</h1>
      <p className="page-introduction">
        Build a simple personal roster and track your selected units and points.
      </p>

      <p className="status-message">
        This planner does not validate official army-list rules.
      </p>

      {factionsError && (
        <p className="error-message" role="alert">
          {factionsError}
        </p>
      )}

      <div className="army-planner-summary">
        <div>
          <p className="summary-label">Total points</p>
          <p className="summary-value">{totalPoints}</p>
        </div>
        <div>
          <p className="summary-label">Selected units</p>
          <p className="summary-value">{totalUnits}</p>
        </div>
      </div>

      <div className="army-list-settings">
        <div className="form-field">
          <label htmlFor="army-list-name">Army list name</label>
          <input
            id="army-list-name"
            value={armyList.name}
            onChange={(event) => updateListName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="army-list-faction">Faction</label>
          <select
            id="army-list-faction"
            value={armyList.faction ?? ''}
            onChange={(event) => handleFactionChange(event.target.value)}
          >
            <option value="">Choose a faction</option>
            {factions.map((faction) => (
              <option key={faction.name} value={faction.name}>
                {faction.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="army-list-heading-row">
        <div>
          <h2>{armyList.name}</h2>
          <p>{armyList.faction ?? 'No faction selected yet'}</p>
        </div>

        {armyList.units.length > 0 && (
          <div className="clear-list-actions">
            {isConfirmingClear ? (
              <>
                <span>Clear this list?</span>
                <button type="button" onClick={handleClearList}>
                  Yes, clear it
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
              >
                Clear list
              </button>
            )}
          </div>
        )}
      </div>

      {armyList.units.length === 0 ? (
        <p className="status-message">
          Your army list is empty. <Link to="/units">Browse units</Link> to add
          something to the roster.
        </p>
      ) : (
        <div className="army-list-table-wrapper">
          <table className="army-list-table">
            <thead>
              <tr>
                <th scope="col">Unit</th>
                <th scope="col">Quantity</th>
                <th scope="col">Points</th>
                <th scope="col">Subtotal</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {armyList.units.map((unit) => (
                <tr key={unit.id ?? `${unit.faction}-${unit.name}`}>
                  <th scope="row">
                    <Link
                      to={`/units/${encodeURIComponent(unit.routeIdentifier)}`}
                    >
                      {unit.name}
                    </Link>
                    <span>{unit.faction}</span>
                  </th>
                  <td>
                    <div className="quantity-controls">
                      <button
                        type="button"
                        disabled={unit.quantity <= 1}
                        onClick={() =>
                          updateQuantity(unit, unit.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span>{unit.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(unit, unit.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{unit.points ?? 0}</td>
                  <td>{getSubtotal(unit)}</td>
                  <td>
                    <button type="button" onClick={() => removeUnit(unit)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ArmyPlanner
