
import { getTiposInforme } from './components/actions'
import { TiposInformeTableWrapper   } from './components/tipoInforme-table-wrapper'

async function TiposInforme() {
    const tiposInforme = await getTiposInforme()

    return <TiposInformeTableWrapper data={tiposInforme} />
}

export default TiposInforme 
