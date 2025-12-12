
import { getClientLocations } from './components/actions'
import { TiposInformeTableWrapper   } from './components/clientLocations-table-wrapper'

async function ClientLocations() {
    const clientLocations = await getClientLocations()

    return <TiposInformeTableWrapper data={clientLocations} />
}

export default ClientLocations 
