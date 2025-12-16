import { getPlanesTrabajo } from "./components/actions"
import { PlanesTrabajoTableWrapper } from "./components/planes-table-wrapper"

async function PlanesTrabajo() {
  const planes = await getPlanesTrabajo()

  return <PlanesTrabajoTableWrapper data={planes} />
}

export default PlanesTrabajo
