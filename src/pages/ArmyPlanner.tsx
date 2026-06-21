import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFactions } from '../api/openHammerApi'
import {
  type ArmyPlannerUnit,
  type ArmyList,
  useArmyPlanner,
} from '../hooks/useArmyPlanner'
import type { Faction } from '../types/faction'

function getSubtotal(unit: ArmyPlannerUnit): number {
  return (unit.points ?? 0) * unit.quantity
}

function getDisplayName(list: ArmyList): string {
  return list.name.trim() || 'Untitled army list'
}

interface ArmyListNameFieldProps {
  activeList: ArmyList
  onSaveName: (name: string) => boolean
}

function ArmyListNameField({
  activeList,
  onSaveName,
}: ArmyListNameFieldProps) {
  const [draftName, setDraftName] = useState(activeList.name)
  const [showNameError, setShowNameError] = useState(false)

  function saveName() {
    const saved = onSaveName(draftName)
    setShowNameError(!saved)
  }

  return (
    <div className="form-field">
      <label htmlFor="army-list-name">Army list name</label>
      <input
        id="army-list-name"
        value={draftName}
        onChange={(event) => {
          setDraftName(event.target.value)
          setShowNameError(false)
        }}
        onBlur={saveName}
      />
      {showNameError && (
        <p className="field-error" role="alert">
          Army list name is required.
        </p>
      )}
    </div>
  )
}

function ArmyPlanner() {
  const [factions, setFactions] = useState<Faction[]>([])
  const [factionsError, setFactionsError] = useState<string | null>(null)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const {
    activeList,
    lists,
    totalUnits,
    totalPoints,
    setActiveListId,
    createList,
    deleteList,
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

  function handleDeleteList() {
    if (!deleteListId) {
      return
    }

    deleteList(deleteListId)
    setDeleteListId(null)
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

      <div className="army-list-selector-row">
        <div className="form-field">
          <label htmlFor="active-army-list">Active army list</label>
          <select
            id="active-army-list"
            value={activeList.id}
            onChange={(event) => {
              setActiveListId(event.target.value)
              setDeleteListId(null)
              setIsConfirmingClear(false)
            }}
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {getDisplayName(list)}
              </option>
            ))}
          </select>
        </div>

        <button type="button" onClick={createList}>
          + New list
        </button>

        {deleteListId === activeList.id ? (
          <div className="delete-list-confirmation">
            <span>Delete this list?</span>
            <button type="button" onClick={handleDeleteList}>
              Yes, delete it
            </button>
            <button type="button" onClick={() => setDeleteListId(null)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setDeleteListId(activeList.id)}>
            Delete list
          </button>
        )}
      </div>

      <div className="army-list-settings">
        <ArmyListNameField
          key={activeList.id}
          activeList={activeList}
          onSaveName={updateListName}
        />

        <div className="form-field">
          <label htmlFor="army-list-faction">Faction</label>
          <select
            id="army-list-faction"
            value={activeList.faction ?? ''}
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
          <h2>{getDisplayName(activeList)}</h2>
          <p>{activeList.faction ?? 'No faction selected yet'}</p>
        </div>

        {activeList.units.length > 0 && (
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

      {activeList.units.length === 0 ? (
        <div className="empty-army-list status-message">
          <p>
            This army list is empty. Browse units to add something to the
            roster, or browse factions if you want to pick a theme first.
          </p>
          <div>
            <Link className="button-link button-link--primary" to="/units">
              Browse units
            </Link>
            <Link className="text-link" to="/factions">
              Browse factions
            </Link>
          </div>
        </div>
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
              {activeList.units.map((unit) => (
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
