"use server";

import { getTiposVariante } from "./components/actions";
import { TipoVarianteTableWrapper } from "./components/tipoVariante-table-wrapper";

async function TiposVariante() {
  const tiposVariante = await getTiposVariante();

  return <TipoVarianteTableWrapper data={tiposVariante} />;
}

export default TiposVariante;
