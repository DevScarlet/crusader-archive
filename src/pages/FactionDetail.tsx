import { useParams } from 'react-router-dom'

function FactionDetail() {
  const { factionId } = useParams<{ factionId: string }>()

  return (
    <section>
      <h1>Faction Detail</h1>
      <p>Details for faction {factionId ?? 'unknown'} will appear here.</p>
    </section>
  )
}

export default FactionDetail
