import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFactions } from '../api/openHammerApi'
import UnitMetadataBadges from '../components/UnitMetadataBadges'
import {
  type ArmyPlannerUnit,
  type ArmyList,
  ARMY_PLANNER_TOAST_EVENT,
  type ArmyPlannerToast,
  useArmyPlanner,
} from '../hooks/useArmyPlanner'
import { useUnitMetadata } from '../hooks/useUnitMetadata'
import type { Faction } from '../types/faction'
import {
  decodeArmyListShareCode,
  encodeArmyListShareCode,
  formatArmyListText,
} from '../utils/armyListSharing'

function getSubtotal(unit: ArmyPlannerUnit): number {
  return (unit.points ?? 0) * unit.quantity
}

function getDisplayName(list: ArmyList): string {
  return list.name.trim() || 'Untitled army list'
}

const targetPointPresets = [500, 1000, 1500, 2000, 3000]

interface ArmyListNameFieldProps {
  activeList: ArmyList
  onSaveName: (name: string) => boolean
}

interface TargetPointsFieldProps {
  targetPoints: number
  onSaveTargetPoints: (targetPoints: number) => void
}

type DestructiveConfirmation =
  | { type: 'clear-list' }
  | { type: 'delete-list' }
  | { type: 'remove-unit'; unit: ArmyPlannerUnit }
  | null

function getUnitKey(unit: ArmyPlannerUnit): string {
  return unit.id ?? `${unit.faction}:${unit.name}`
}

function showToast(toast: ArmyPlannerToast): void {
  window.dispatchEvent(
    new CustomEvent<ArmyPlannerToast>(ARMY_PLANNER_TOAST_EVENT, {
      detail: toast,
    }),
  )
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

function TargetPointsField({
  targetPoints,
  onSaveTargetPoints,
}: TargetPointsFieldProps) {
  const [draftTargetPoints, setDraftTargetPoints] = useState(
    String(targetPoints),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function saveTargetPoints(value: string) {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      setErrorMessage('Enter a target points value.')
      return
    }

    const parsedTargetPoints = Number(trimmedValue)

    if (
      !/^\d+$/.test(trimmedValue) ||
      !Number.isFinite(parsedTargetPoints) ||
      parsedTargetPoints < 0
    ) {
      setErrorMessage('Target points must be a whole number of 0 or more.')
      return
    }

    setErrorMessage(null)
    onSaveTargetPoints(parsedTargetPoints)
  }

  function handlePresetClick(preset: number) {
    setDraftTargetPoints(String(preset))
    setErrorMessage(null)
    onSaveTargetPoints(preset)
  }

  return (
    <div className="form-field target-points-field">
      <label htmlFor="army-list-target-points">Target points</label>
      <input
        id="army-list-target-points"
        type="number"
        min="0"
        step="1"
        value={draftTargetPoints}
        onChange={(event) => {
          setDraftTargetPoints(event.target.value)
          saveTargetPoints(event.target.value)
        }}
        onBlur={() => saveTargetPoints(draftTargetPoints)}
      />
      <div className="target-points-presets" aria-label="Target point presets">
        {targetPointPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            className="button-secondary"
            onClick={() => handlePresetClick(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      {errorMessage && (
        <p className="field-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

function ArmyPlanner() {
  const [factions, setFactions] = useState<Faction[]>([])
  const [factionsError, setFactionsError] = useState<string | null>(null)
  const [destructiveConfirmation, setDestructiveConfirmation] =
    useState<DestructiveConfirmation>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [shareCodeInput, setShareCodeInput] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
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
    updateTargetPoints,
    updateQuantity,
    removeUnit,
    clearList,
    importArmyList,
  } = useArmyPlanner()
  const { getMetadataForKey } = useUnitMetadata()
  const sortedFactions = useMemo(
    () =>
      [...factions].sort((firstFaction, secondFaction) =>
        firstFaction.name.localeCompare(secondFaction.name),
      ),
    [factions],
  )
  const targetPoints = activeList.targetPoints
  const budgetDifference = targetPoints - totalPoints
  const isOverTarget = budgetDifference < 0
  const budgetStatusText = isOverTarget
    ? `${Math.abs(budgetDifference)} pts over`
    : `${budgetDifference} pts remaining`
  const progressTargetPoints = Math.max(targetPoints, 1)
  const progressValue = Math.min(
    100,
    Math.round((totalPoints / progressTargetPoints) * 100),
  )

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
          'OpenHammer API request failed. Faction choices could not load. You can still use the current list.',
        )
      }
    }

    void loadFactions()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDestructiveConfirmation(null)
        setIsImportOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleFactionChange(factionName: string) {
    const selectedFaction = factions.find(
      (faction) => faction.name === factionName,
    )

    updateListFaction(selectedFaction)
  }

  function handleClearList() {
    clearList()
    setDestructiveConfirmation(null)
  }

  function handleDeleteList() {
    deleteList(activeList.id)
    setDestructiveConfirmation(null)
  }

  function handleRemoveUnit(unit: ArmyPlannerUnit) {
    if (
      destructiveConfirmation?.type !== 'remove-unit' ||
      getUnitKey(destructiveConfirmation.unit) !== getUnitKey(unit)
    ) {
      return
    }

    removeUnit(unit)
    setDestructiveConfirmation(null)
  }

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      showToast({ message: successMessage })
    } catch (error) {
      console.error('Army list copy failed.', { error })
      showToast({
        message:
          'Copy failed. Check your browser permissions and try again.',
      })
    }
  }

  function handleCopyText() {
    if (activeList.units.length === 0) {
      showToast({ message: 'Add at least one unit before copying a list.' })
      return
    }

    void copyToClipboard(
      formatArmyListText(activeList),
      'Army list text copied.',
    )
  }

  function handleCopyShareCode() {
    if (activeList.units.length === 0) {
      showToast({ message: 'Add at least one unit before copying a share code.' })
      return
    }

    void copyToClipboard(
      encodeArmyListShareCode(activeList),
      'Army list share code copied.',
    )
  }

  function handleOpenImport() {
    setShareCodeInput('')
    setImportError(null)
    setDestructiveConfirmation(null)
    setIsImportOpen(true)
  }

  function handleImportList() {
    const decodedShareCode = decodeArmyListShareCode(shareCodeInput)

    if (!decodedShareCode.list) {
      setImportError(
        decodedShareCode.errorMessage ??
          'That share code could not be imported.',
      )
      return
    }

    importArmyList(decodedShareCode.list)
    setShareCodeInput('')
    setImportError(null)
    setIsImportOpen(false)
  }

  return (
    <section aria-labelledby="army-planner-heading">
      <h1 id="army-planner-heading">Army Planner</h1>
      <p className="page-introduction">
        Build a simple personal roster and track your selected units and points.
      </p>

      <p className="status-message planner-rules-note">
        This planner does not validate official army-list rules.
      </p>

      {factionsError && (
        <p className="error-message" role="alert">
          {factionsError}
        </p>
      )}

      <div className="army-planner-toolbar">
        <div className="form-field">
          <label htmlFor="active-army-list">Active army list</label>
          <select
            id="active-army-list"
            value={activeList.id}
            onChange={(event) => {
              setActiveListId(event.target.value)
              setDestructiveConfirmation(null)
            }}
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {getDisplayName(list)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setDestructiveConfirmation(null)
            createList()
          }}
        >
          + New list
        </button>

        <div className="toolbar-confirmation-slot">
          {destructiveConfirmation?.type === 'delete-list' ? (
            <div className="inline-confirmation">
              <span>Delete this list?</span>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setDestructiveConfirmation(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={handleDeleteList}
              >
                Delete list
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button-danger"
              onClick={() => setDestructiveConfirmation({ type: 'delete-list' })}
            >
              Delete list
            </button>
          )}
        </div>
      </div>

      <div className="army-list-details-card">
        <div className="army-section-heading">
          <h2>List settings</h2>
          <p>Set the basics for this roster.</p>
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
              {sortedFactions.map((faction) => (
                <option key={faction.name} value={faction.name}>
                  {faction.name}
                </option>
              ))}
            </select>
          </div>

          <TargetPointsField
            key={`${activeList.id}-target-points`}
            targetPoints={targetPoints}
            onSaveTargetPoints={updateTargetPoints}
          />
        </div>
      </div>

      <div className="army-planner-summary" aria-label="Army list summary">
        <div>
          <p className="summary-label">Total points</p>
          <p className="summary-value">{totalPoints}</p>
        </div>
        <div>
          <p className="summary-label">Selected units</p>
          <p className="summary-value">{totalUnits}</p>
        </div>
        <div className="budget-summary">
          <p className="summary-label">Budget</p>
          <div>
            <p className="budget-summary__value">
              {totalPoints} / {targetPoints} pts
            </p>
            <p
              className={
                isOverTarget
                  ? 'budget-summary__status budget-summary__status--over'
                  : 'budget-summary__status'
              }
            >
              {budgetStatusText}
            </p>
          </div>
          <div
            className={
              isOverTarget
                ? 'budget-progress budget-progress--over'
                : 'budget-progress'
            }
            role="progressbar"
            aria-label="Army list points progress"
            aria-valuemin={0}
            aria-valuemax={progressTargetPoints}
            aria-valuenow={Math.min(totalPoints, progressTargetPoints)}
          >
            <div
              className="budget-progress__bar"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </div>

      <div className="army-roster-card">
        <div className="army-list-heading-row">
          <div>
            <h2>{getDisplayName(activeList)}</h2>
            <p>{activeList.faction ?? 'No faction selected yet'}</p>
          </div>

          <div className="army-list-header-actions">
            <button
              type="button"
              className="button-secondary"
              disabled={activeList.units.length === 0}
              onClick={handleCopyText}
            >
              Copy text
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={activeList.units.length === 0}
              onClick={handleCopyShareCode}
            >
              Copy share code
            </button>
            <button type="button" onClick={handleOpenImport}>
              Import list
            </button>
            {activeList.units.length > 0 &&
              (destructiveConfirmation?.type === 'clear-list' ? (
                <div className="inline-confirmation roster-clear-confirmation">
                  <span>Clear this list?</span>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setDestructiveConfirmation(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={handleClearList}
                  >
                    Yes, clear it
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="button-danger"
                  onClick={() =>
                    setDestructiveConfirmation({ type: 'clear-list' })
                  }
                >
                  Clear list
                </button>
              ))}
          </div>
        </div>

        {activeList.units.length === 0 && (
          <p className="export-helper-text">
            Add units before copying this list.
          </p>
        )}

        {isImportOpen && (
          <div className="import-list-panel">
            <div className="form-field">
              <label htmlFor="army-list-share-code">Share code</label>
              <textarea
                id="army-list-share-code"
                value={shareCodeInput}
                rows={4}
                placeholder="Paste a Crusader Archive share code"
                onChange={(event) => {
                  setShareCodeInput(event.target.value)
                  setImportError(null)
                }}
              />
            </div>

            {importError && (
              <p className="field-error" role="alert">
                {importError}
              </p>
            )}

            <div className="dialog-actions import-list-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setIsImportOpen(false)
                  setImportError(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!shareCodeInput.trim()}
                onClick={handleImportList}
              >
                Import list
              </button>
            </div>
          </div>
        )}

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
                      <UnitMetadataBadges
                        metadata={getMetadataForKey(
                          unit.id ?? unit.routeIdentifier,
                        )}
                        compact
                        maxTags={2}
                      />
                    </th>
                    <td>
                      <div className="quantity-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (unit.quantity <= 1) {
                              setDestructiveConfirmation({
                                type: 'remove-unit',
                                unit,
                              })
                              return
                            }

                            updateQuantity(unit, unit.quantity - 1)
                          }}
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
                      {destructiveConfirmation?.type === 'remove-unit' &&
                      getUnitKey(destructiveConfirmation.unit) ===
                        getUnitKey(unit) ? (
                        <div className="row-action-confirmation">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => setDestructiveConfirmation(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => handleRemoveUnit(unit)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="button-danger"
                          onClick={() =>
                            setDestructiveConfirmation({
                              type: 'remove-unit',
                              unit,
                            })
                          }
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default ArmyPlanner
