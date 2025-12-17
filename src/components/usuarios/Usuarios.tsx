
import { getUsers } from './components/actions'
import { UsersTableWrapper } from './components/user-table-wrapper'

async function Usuarios() {
    const users = await getUsers()

    return <UsersTableWrapper data={users} />
}

export default Usuarios 
