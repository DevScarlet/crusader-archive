import { useParams } from 'react-router-dom'

function UnitDetail() {
  const { unitId } = useParams<{ unitId: string }>()

  return (
    <section>
      <h1>Unit Detail</h1>
      <p>Details for unit {unitId ?? 'unknown'} will appear here.</p>
    </section>
  )
}

export default UnitDetail
