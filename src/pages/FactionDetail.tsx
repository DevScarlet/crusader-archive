import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUnitsByFaction } from '../api/openHammerApi'
import UnitCard from '../components/UnitCard'
import type { Unit } from '../types/unit'

function FactionDetail() {
  const { factionName: encodedFactionName } = useParams<{
    factionName: string
  }>()
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)

  let factionName: string | null = null

  if (encodedFactionName) {
    try {
      factionName = decodeURIComponent(encodedFactionName)
    } catch {
      factionName = null
    }
  }

  useEffect(() => {
    if (!factionName) {
      return
    }

    const selectedFactionName = factionName
    const controller = new AbortController()

    async function loadUnits() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const fetchedUnits = await getUnitsByFaction(
          selectedFactionName,
          controller.signal,
        )
        setUnits(fetchedUnits)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          `We could not load units for ${selectedFactionName}. Check your connection and try again.`,
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadUnits()

    return () => controller.abort()
  }, [factionName, requestNumber])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  return (
    <section aria-labelledby="faction-heading">
      <Link className="back-link" to="/factions">
        Back to factions
      </Link>
      <h1 id="faction-heading">{factionName ?? 'Faction'}</h1>

      {!factionName && (
        <div className="error-message" role="alert">
          <p>This faction name is not valid.</p>
        </div>
      )}

      {factionName && isLoading && (
        <p className="status-message" role="status">
          Loading units...
        </p>
      )}

      {factionName && !isLoading && errorMessage && (
        <div className="error-message" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={retryRequest}>
            Try again
          </button>
        </div>
      )}

      {factionName && !isLoading && !errorMessage && units.length === 0 && (
        <p className="status-message">
          No units are currently available for this faction.
        </p>
      )}

      {factionName && !isLoading && !errorMessage && units.length > 0 && (
        <div className="unit-grid">
          {units.map((unit, index) => (
            <UnitCard key={unit.id ?? `${unit.name}-${index}`} unit={unit} />
          ))}
        </div>
      )}
    </section>
  )
}

export default FactionDetail
