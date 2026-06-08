import { useEffect, useState } from 'react'
import { getFactions } from '../api/openHammerApi'
import FactionCard from '../components/FactionCard'
import type { Faction } from '../types/faction'

function Factions() {
  const [factions, setFactions] = useState<Faction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFactions() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const fetchedFactions = await getFactions(controller.signal)
        setFactions(fetchedFactions)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setErrorMessage(
          'We could not load the factions. Check your connection and try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadFactions()

    return () => controller.abort()
  }, [requestNumber])

  function retryRequest() {
    setRequestNumber((currentRequest) => currentRequest + 1)
  }

  return (
    <section aria-labelledby="factions-heading">
      <h1 id="factions-heading">Factions</h1>
      <p className="page-introduction">
        Browse the factions available in the OpenHammer archive.
      </p>

      {isLoading && (
        <p className="status-message" role="status">
          Loading factions...
        </p>
      )}

      {!isLoading && errorMessage && (
        <div className="error-message" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={retryRequest}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && factions.length === 0 && (
        <p className="status-message">No factions are currently available.</p>
      )}

      {!isLoading && !errorMessage && factions.length > 0 && (
        <div className="faction-grid">
          {factions.map((faction) => (
            <FactionCard key={faction.name} faction={faction} />
          ))}
        </div>
      )}
    </section>
  )
}

export default Factions
