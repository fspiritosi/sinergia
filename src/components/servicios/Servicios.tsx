
import { getServicios } from './components/actions'
import { ServiciosTableWrapper } from './components/servicios-table-wrapper'

async function Servicios() {
    const servicios = await getServicios()

    return <ServiciosTableWrapper data={servicios} />
}

export default Servicios 
