

import { getItems } from './components/actions'
import { ItemsTableWrapper } from './components/items-table-wrapper'

async function Items() {
    const items = await getItems()


    return <ItemsTableWrapper data={items} />
}

export default Items 
