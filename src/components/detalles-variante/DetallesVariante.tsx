"use server";

import { getDetallesVariante } from "./components/actions";
import { DetalleVarianteTableWrapper } from "./components/detalleVariante-table-wrapper";

async function DetallesVariante() {
  const detalles = await getDetallesVariante();

  return <DetalleVarianteTableWrapper data={detalles} />;
}

export default DetallesVariante;
