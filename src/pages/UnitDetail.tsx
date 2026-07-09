import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUnit } from '../api/openHammerApi'
import AddToArmyButton from '../components/AddToArmyButton'
import FavoriteButton from '../components/FavoriteButton'
import HelpTooltip from '../components/HelpTooltip'
import { glossary } from '../data/glossary'
import { useFavorites } from '../hooks/useFavorites'
import { getUnitMetadataKey, useUnitMetadata } from '../hooks/useUnitMetadata'
import type { Unit, UnitStats, UnitWeapon } from '../types/unit'
import {
  type UnitMetadataTag,
  unitMetadataTagPresets,
} from '../types/unitMetadata'

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

interface WeaponListProps {
  title: string
  weapons: UnitWeapon[]
}

function WeaponList({ title, weapons }: WeaponListProps) {
  if (weapons.length === 0) {
    return null
  }

  return (
    <section className="detail-section">
      <h2>{title}</h2>
      <div className="weapon-list">
        {weapons.map((weapon, index) => (
          <article className="weapon-card" key={`${weapon.name}-${index}`}>
            <h3>{weapon.name}</h3>
            <dl>
              {weapon.range && (
                <div>
                  <dt>
                    <HelpTooltip
                      entry={glossary.range}
                      triggerText="Range"
                    />
                  </dt>
                  <dd>{weapon.range}</dd>
                </div>
              )}
              {weapon.attacks && (
                <div>
                  <dt>
                    <HelpTooltip
                      entry={glossary.attacks}
                      triggerText="A"
                    />
                  </dt>
                  <dd>{weapon.attacks}</dd>
                </div>
              )}
              {weapon.skill && (
                <div>
                  <dt>
                    <HelpTooltip
                      entry={glossary.skill}
                      triggerText="Skill"
                    />
                  </dt>
                  <dd>{weapon.skill}</dd>
                </div>
              )}
              {weapon.strength && (
                <div>
                  <dt>
                    <HelpTooltip
                      entry={glossary.strength}
                      triggerText="S"
                    />
                  </dt>
                  <dd>{weapon.strength}</dd>
                </div>
              )}
              {weapon.armorPenetration && (
                <div>
                  <dt>
                    <HelpTooltip
                      entry={glossary.armorPenetration}
                      triggerText="AP"
                    />
                  </dt>
                  <dd>{weapon.armorPenetration}</dd>
                </div>
              )}
              {weapon.damage && (
                <div>
                  <dt>
                    <HelpTooltip
                      entry={glossary.damage}
                      triggerText="D"
                    />
                  </dt>
                  <dd>{weapon.damage}</dd>
                </div>
              )}
            </dl>
            {weapon.keywords && <p>{weapon.keywords}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}

interface PersonalUnitNotesProps {
  unitKey: string
}

function PersonalUnitNotes({ unitKey }: PersonalUnitNotesProps) {
  const { metadata, saveNote, clearNote, toggleTag } =
    useUnitMetadata(unitKey)
  const [noteDraft, setNoteDraft] = useState({
    savedNote: metadata.note,
    unitKey,
    value: metadata.note,
  })
  const [saveMessage, setSaveMessage] = useState<{
    unitKey: string
    value: string
  } | null>(null)
  const draftNote =
    noteDraft.unitKey === unitKey && noteDraft.savedNote === metadata.note
      ? noteDraft.value
      : metadata.note
  const visibleSaveMessage =
    saveMessage?.unitKey === unitKey ? saveMessage.value : null

  function handleSaveNote() {
    saveNote(draftNote)
    setNoteDraft({
      savedNote: draftNote,
      unitKey,
      value: draftNote,
    })
    setSaveMessage({
      unitKey,
      value: 'Personal note saved.',
    })
  }

  function handleClearNote() {
    clearNote()
    setNoteDraft({
      savedNote: '',
      unitKey,
      value: '',
    })
    setSaveMessage({
      unitKey,
      value: 'Personal note cleared.',
    })
  }

  function handleToggleTag(tag: UnitMetadataTag) {
    toggleTag(tag)
    setSaveMessage({
      unitKey,
      value: 'Personal tags updated.',
    })
  }

  return (
    <section className="detail-section personal-notes-section">
      <h2>Personal notes</h2>
      <div className="personal-notes-card">
        <div className="form-field">
          <label htmlFor="unit-personal-note">Note</label>
          <textarea
            id="unit-personal-note"
            value={draftNote}
            rows={5}
            placeholder="Add reminders, loadout ideas, painting notes, or buying plans."
            onChange={(event) => {
              setNoteDraft({
                savedNote: metadata.note,
                unitKey,
                value: event.target.value,
              })
              setSaveMessage(null)
            }}
          />
        </div>

        <div className="personal-note-actions">
          <button
            type="button"
            disabled={draftNote === metadata.note}
            onClick={handleSaveNote}
          >
            Save note
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={!draftNote.trim() && !metadata.note.trim()}
            onClick={handleClearNote}
          >
            Clear note
          </button>
        </div>

        <div>
          <p className="personal-tags-label">Tags</p>
          <div className="unit-tag-toggle-list" aria-label="Personal tags">
            {unitMetadataTagPresets.map((tag) => (
              <button
                type="button"
                key={tag}
                className="unit-tag-toggle"
                aria-pressed={metadata.tags.includes(tag)}
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {visibleSaveMessage && (
          <p className="metadata-save-message" role="status">
            {visibleSaveMessage}
          </p>
        )}
      </div>
    </section>
  )
}

function UnitDetail() {
  const { unitIdentifier: encodedUnitIdentifier } = useParams<{
    unitIdentifier: string
  }>()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)
  const { isFavorite, toggleFavorite } = useFavorites()

  let unitIdentifier: string | null = null

  if (encodedUnitIdentifier) {
    try {
      unitIdentifier = decodeURIComponent(encodedUnitIdentifier)
    } catch {
      unitIdentifier = null
    }
  }

  useEffect(() => {
    if (!unitIdentifier) {
      return
    }

    const selectedUnitIdentifier = unitIdentifier
    const controller = new AbortController()

    async function loadUnit() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const fetchedUnit = await getUnit(
          selectedUnitIdentifier,
          controller.signal,
        )
        setUnit(fetchedUnit)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          'OpenHammer API request failed. We could not load this unit. Check your connection and try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadUnit()

    return () => controller.abort()
  }, [unitIdentifier, requestNumber])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  const availableStats = statLabels.filter(
    ([statName]) => unit?.stats?.[statName] !== undefined,
  )
  const unitMetadataKey = unit
    ? getUnitMetadataKey(unit)
    : unitIdentifier ?? undefined

  return (
    <section aria-labelledby="unit-heading">
      <Link
        className="back-link"
        to={
          unit
            ? `/factions/${encodeURIComponent(unit.faction)}`
            : '/factions'
        }
      >
        {unit ? `Back to ${unit.faction}` : 'Back to factions'}
      </Link>

      {!unitIdentifier && (
        <>
          <h1 id="unit-heading">Unit</h1>
          <div className="error-message" role="alert">
            <p>This unit identifier is not valid.</p>
          </div>
        </>
      )}

      {unitIdentifier && isLoading && (
        <>
          <h1 id="unit-heading">Unit</h1>
          <p className="status-message" role="status">
            Loading unit...
          </p>
        </>
      )}

      {unitIdentifier && !isLoading && errorMessage && (
        <>
          <h1 id="unit-heading">Unit</h1>
          <div className="error-message" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={retryRequest}>
              Try again
            </button>
          </div>
        </>
      )}

      {unitIdentifier && !isLoading && !errorMessage && !unit && (
        <>
          <h1 id="unit-heading">Unit not found</h1>
          <p className="status-message">
            No unit could be found for this address.
          </p>
        </>
      )}

      {unit && !isLoading && !errorMessage && (
        <>
          <div className="page-heading-row">
            <div>
              <p className="unit-detail__type">
                {unit.factionType}{' '}
                <HelpTooltip entry={glossary.factionType} />
              </p>
              <h1 id="unit-heading">{unit.name}</h1>
            </div>
            <FavoriteButton
              isFavorite={isFavorite(unit)}
              label={unit.name}
              onClick={() => toggleFavorite(unit)}
            />
          </div>
          <p className="unit-detail__faction">{unit.faction}</p>

          {unit.basePoints !== undefined && (
            <p className="unit-detail__points">
              <strong>{unit.basePoints}</strong> base points{' '}
              <HelpTooltip entry={glossary.points} />
            </p>
          )}

          <AddToArmyButton unit={unit} />

          {unitMetadataKey && <PersonalUnitNotes unitKey={unitMetadataKey} />}

          {availableStats.length > 0 && (
            <dl className="unit-stats unit-detail__stats">
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

          <WeaponList
            title="Ranged Weapons"
            weapons={unit.rangedWeapons ?? []}
          />
          <WeaponList
            title="Melee Weapons"
            weapons={unit.meleeWeapons ?? []}
          />

          {unit.abilities && unit.abilities.length > 0 && (
            <section className="detail-section">
              <h2 className="heading-with-help">
                Abilities <HelpTooltip entry={glossary.abilities} />
              </h2>
              <div className="ability-list">
                {unit.abilities.map((ability, index) => (
                  <article key={`${ability.name}-${index}`}>
                    <h3>{ability.name}</h3>
                    {ability.description && <p>{ability.description}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {unit.keywords && unit.keywords.length > 0 && (
            <section className="detail-section">
              <h2 className="heading-with-help">
                Keywords <HelpTooltip entry={glossary.keywords} />
              </h2>
              <ul className="keyword-list">
                {unit.keywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  )
}

export default UnitDetail
