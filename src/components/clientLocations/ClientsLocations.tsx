
import { getClientLocations } from './components/actions'
import { ClientLocationTableWrapper   } from './components/clientLocations-table-wrapper'

async function ClientLocations() {
    const clientLocations = await getClientLocations()

    return <ClientLocationTableWrapper data={clientLocations} />
}

export default ClientLocations 
