import { getInformes } from "./components/actions"
import { InformesTableWrapper } from "./components/informes-table-wrapper"

async function Informes() {
  const informes = await getInformes()

  return <InformesTableWrapper data={informes} />
}

export default Informes
