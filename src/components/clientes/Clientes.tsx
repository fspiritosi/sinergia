import React from 'react'
import { getClientes } from './components/actions'
import { ClientesTableWrapper } from './components/clientes-table-wrapper'

async function Clientes() {
    const clientes = await getClientes()

    return <ClientesTableWrapper data={clientes} />
}

export default Clientes