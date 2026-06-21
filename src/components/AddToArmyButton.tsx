import { useEffect, useState } from 'react'
import {
  type ArmyList,
  useArmyPlanner,
} from '../hooks/useArmyPlanner'
import type { Unit } from '../types/unit'

interface AddToArmyButtonProps {
  unit: Unit
}

function getDisplayName(list: ArmyList): string {
  return list.name.trim() || 'Untitled army list'
}

function getListPoints(list: ArmyList): number {
  return list.units.reduce(
    (total, unit) => total + (unit.points ?? 0) * unit.quantity,
    0,
  )
}

function getListFactionLabel(list: ArmyList): string {
  return list.faction || 'No faction selected'
}

function AddToArmyButton({ unit }: AddToArmyButtonProps) {
  const { addUnit, addUnitToList, getUnitQuantity, lists } = useArmyPlanner()
  const [isChooserOpen, setIsChooserOpen] = useState(false)
  const armyQuantity = getUnitQuantity(unit)

  useEffect(() => {
    if (!isChooserOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsChooserOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isChooserOpen])

  function handleAddClick() {
    if (lists.length <= 1) {
      addUnit(unit)
      return
    }

    setIsChooserOpen(true)
  }

  function handleChooseList(listId: string) {
    const wasAdded = addUnitToList(listId, unit)

    if (wasAdded) {
      setIsChooserOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="army-planner-add-button"
        onClick={handleAddClick}
      >
        {armyQuantity > 0
          ? `Add another (added x${armyQuantity})`
          : 'Add to army'}
      </button>

      {isChooserOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setIsChooserOpen(false)}
        >
          <div
            className="dialog-card army-list-chooser"
            role="dialog"
            aria-modal="true"
            aria-labelledby="army-list-chooser-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="army-list-chooser-title">
              Add {unit.name} to which army list?
            </h2>
            <div className="army-list-choice-list">
              {lists.map((list) => {
                const isIncompatible =
                  Boolean(list.faction) && list.faction !== unit.faction

                return (
                  <button
                    key={list.id}
                    type="button"
                    className="army-list-choice"
                    disabled={isIncompatible}
                    onClick={() => handleChooseList(list.id)}
                  >
                    <span>{getDisplayName(list)}</span>
                    <small>
                      {getListFactionLabel(list)} - {getListPoints(list)} points
                    </small>
                    {isIncompatible && (
                      <small>
                        This list is for {list.faction}, not {unit.faction}.
                      </small>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setIsChooserOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddToArmyButton
