import React from 'react'
import { getPropuestas } from './components/actions'
import { PropuestasTableWrapper } from '@/components/propuestas/components/propuestas-table-wrapper'

async function Propuestas() {
    const propuestas = await getPropuestas()

    return <PropuestasTableWrapper data={propuestas} />
}

export default Propuestas