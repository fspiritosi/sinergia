import { PrismaClient } from "../src/generated/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient();

type SeccionSeed = {
  codigo: string;
  titulo: string;
  orden: number;
  parentCodigo?: string;
};

type PreguntaSeed = {
  codigo: string;
  texto: string;
  seccionCodigo: string;
  orden: number;
  parentPreguntaCodigo?: string;
  condicionRespuesta?: string;
  acciones: string[];
};

const SECCIONES: SeccionSeed[] = [
  { codigo: "1", titulo: "Gestión de Residuos y Efluentes", orden: 1 },
  { codigo: "1.1", titulo: "Residuos", orden: 1, parentCodigo: "1" },
  { codigo: "1.2", titulo: "Efluentes Cloacales", orden: 2, parentCodigo: "1" },
  { codigo: "1.3", titulo: "Efluentes Industriales", orden: 3, parentCodigo: "1" },
  { codigo: "2", titulo: "Gestión de Insumos / Productos Químicos", orden: 2 },
  { codigo: "3", titulo: "Control de Derrames", orden: 3 },
  { codigo: "4", titulo: "Aspectos Operativos", orden: 4 },
];

const PREGUNTAS: PreguntaSeed[] = [
  // 1.1 RESIDUOS
  {
    codigo: "1.1.1",
    texto: "¿Las áreas de acopio de residuos están ordenadas y libres de derrames y manchas?",
    seccionCodigo: "1.1",
    orden: 1,
    acciones: [
      "Realizar el orden y limpieza del área de acopio de residuos.",
      "Realizar la recolección de residuos dispersos en el área.",
      "Retirar del recinto de residuos los insumos y/o materiales ajenos al sector.",
      "Realizar limpieza y/o vaciado de canaletas y cámaras del recinto de acopio de residuos.",
      "Designar y acondicionar un sector específico para el acopio transitorio de residuos acopiados a granel.",
      "Asegurar el acopio de residuos dentro del recinto destinado para tal fin.",
      "No obstruir el acceso a los recipientes / contenedores de residuos especiales.",
    ],
  },
  {
    codigo: "1.1.2",
    texto:
      "¿Los residuos se separan adecuadamente y se colocan en recipientes / contenedores según la clasificación interna establecida?",
    seccionCodigo: "1.1",
    orden: 2,
    acciones: [
      "Realizar la correcta clasificación de los residuos.",
      "Reforzar capacitación del personal respecto a la clasificación de los residuos.",
      "Garantizar el uso exclusivo del recinto para el acopio de residuos especiales.",
    ],
  },
  {
    codigo: "1.1.3",
    texto: "¿Los recipientes / contenedores de residuos están debidamente identificados?",
    seccionCodigo: "1.1",
    orden: 3,
    acciones: [
      "Colocar cartelería de identificación correspondiente a todos los recipientes destinados al acopio de residuos.",
      "En el caso de acopio de residuos especiales deben poseer el detalle de la categoría sometida a control correspondiente (Y).",
      "Recambiar la cartelería de los recipientes / contenedores de residuos que se encuentran deterioradas.",
      "Colocar cartelería de identificación de residuos y rezagos acopiados a granel.",
    ],
  },
  {
    codigo: "1.1.4",
    texto:
      "¿Los contenedores para acopio de residuos cuentan con algún sistema de cierre superior para evitar la infiltración de agua de lluvia o dispersión de residuos?",
    seccionCodigo: "1.1",
    orden: 4,
    acciones: [
      "Colocar tapas o sistema similar a los todos los recipientes / contenedores de acopio de residuos para asegurar el cierre superior de los mismos.",
      "Asegurar la correcta colocación de tapas en todos los recipientes / contenedores de acopio de residuos.",
      "Mantener cerrados con tapas todos los recipientes de acopio de residuos.",
    ],
  },
  {
    codigo: "1.1.5",
    texto:
      "¿Los recipientes / contenedores se encuentran en correcto estado de conservación (integridad / limpieza / hermeticidad)?",
    seccionCodigo: "1.1",
    orden: 5,
    acciones: [
      "Realizar el recambio de recipientes / contenedores que se encuentran deteriorados.",
    ],
  },
  {
    codigo: "1.1.6",
    texto:
      "¿El recinto de acopio de residuos especiales cumple con las condiciones establecidas en la normativa legal vigente?",
    seccionCodigo: "1.1",
    orden: 6,
    acciones: [
      "Asegurar el acceso restringido al recinto de acopio de residuos especiales.",
      'Colocar cartelería de identificación de "Almacenamiento de residuos especiales".',
      "Acondicionar el recinto mediante colocación de piso o base impermeable.",
      "Acondicionar el recinto mediante colocación de techo o poseer medios para resguardar los residuos acopiados.",
      "Contar con sistema de colección, captación y contención de posibles derrames. Los sistemas deberán poseer tapa o rejilla.",
      "Realizar la separación de residuos no especiales de residuos especiales mediante la instalación de cordón de división en platea del recinto de acopio de residuos.",
    ],
  },
  {
    codigo: "1.1.7",
    texto:
      "¿Los recipientes de acopio de residuos líquidos se almacenan sobre sistemas de contención adecuados?",
    seccionCodigo: "1.1",
    orden: 7,
    acciones: [
      "Colocar todos los recipientes con residuos líquidos sobre sistema de contención.",
      "Asegurar que los sistemas de contención posean una capacidad del 110% del volumen del recipiente de mayor capacidad a contener.",
      "Realizar el vaciado de recipientes con restos de residuos líquidos y acopiarlos en forma horizontal.",
    ],
  },
  {
    codigo: "1.1.8",
    texto:
      "¿Todas las áreas de trabajo cuentan con los recipientes necesarios para el acopio de los residuos que generan?",
    seccionCodigo: "1.1",
    orden: 8,
    acciones: [
      "Instalar recipientes acordes al acopio de los residuos que se generan en el sector.",
    ],
  },
  {
    codigo: "1.1.9",
    texto: "¿El acopio de residuos se realiza acorde a la capacidad máxima de los recipientes?",
    seccionCodigo: "1.1",
    orden: 9,
    acciones: [
      "Instalar recipientes de tamaño acorde al tipo y volumen de residuos que se generan en el sector.",
      "No acopiar materiales o residuos sobre los recipientes de acopio de residuos.",
      "Realizar la compactación de latas de pinturas y solventes para optimizar la capacidad de acopio de los contenedores.",
    ],
  },
  {
    codigo: "1.1.10",
    texto:
      "¿Se evidencia la recolección frecuente de los residuos conforme a su tasa de generación?",
    seccionCodigo: "1.1",
    orden: 10,
    acciones: [
      "Se debe realizar el vaciado frecuente de los contenedores.",
      "Gestionar periódicamente la disposición final de los residuos acopiados.",
    ],
  },

  // 1.2 EFLUENTES CLOACALES
  {
    codigo: "1.2.1",
    texto: "¿Posee planta de tratamiento compacta (PTC) in situ?",
    seccionCodigo: "1.2",
    orden: 1,
    acciones: [],
  },
  {
    codigo: "1.2.1.1",
    texto: "¿La planta de tratamiento de efluentes cloacales funciona adecuadamente?",
    seccionCodigo: "1.2",
    orden: 2,
    parentPreguntaCodigo: "1.2.1",
    condicionRespuesta: "si",
    acciones: [
      "Verificar el correcto funcionamiento de la PTC.",
      "Realizar el mantenimiento preventivo / correctivo periódico de la PTC.",
    ],
  },
  {
    codigo: "1.2.1.2",
    texto:
      "¿La planta se encuentra ubicada vientos arriba de la zona de emplazamiento del proyecto?",
    seccionCodigo: "1.2",
    orden: 3,
    parentPreguntaCodigo: "1.2.1",
    condicionRespuesta: "si",
    acciones: [
      "Ubicar la PTC vientos arriba de la zona de emplazamiento del proyecto.",
      "Analizar zonas alternativas para la reubicación de la PTC.",
    ],
  },
  {
    codigo: "1.2.1.3",
    texto: "¿La zona de emplazamiento de la planta se encuentra libre de malos olores?",
    seccionCodigo: "1.2",
    orden: 4,
    parentPreguntaCodigo: "1.2.1",
    condicionRespuesta: "si",
    acciones: [
      "Verificar el correcto funcionamiento de la PTC.",
      "Realizar el mantenimiento preventivo / correctivo periódico de la PTC.",
    ],
  },
  {
    codigo: "1.2.1.4",
    texto: "¿La zona de descarga de la planta se encuentra libre de anegamientos?",
    seccionCodigo: "1.2",
    orden: 5,
    parentPreguntaCodigo: "1.2.1",
    condicionRespuesta: "si",
    acciones: [
      "El efluente cloacal tratado debe ser distribuido sobre la superficie del terreno, sin producir enlagunamientos ni escurrimientos, en una zona llana, con pendientes inferiores al 2 %, distante por lo menos cien (100) metros de cursos o cuerpos de agua.",
      "Instalar aspersores o sistema similar para la distribución correcta del efluente cloacal tratado.",
      "Realizar el mantenimiento periódico del sistema de distribución del efluente cloacal tratado.",
    ],
  },
  {
    codigo: "1.2.1.5",
    texto: "¿La ubicación de la zona de descarga de la planta es la adecuada?",
    seccionCodigo: "1.2",
    orden: 6,
    parentPreguntaCodigo: "1.2.1",
    condicionRespuesta: "si",
    acciones: [
      "Reubicar la zona de descarga de la PTC.",
      "Analizar zonas alternativas para la reubicación de la zona de descarga de la PTC.",
      "La zona de descarga de la PTC no debe sobrepasar los límites del área de emplazamiento del proyecto.",
    ],
  },
  {
    codigo: "1.2.1.6",
    texto: "¿Las conexiones de las cañerías se encuentran libres de fuga y en buen estado?",
    seccionCodigo: "1.2",
    orden: 7,
    parentPreguntaCodigo: "1.2.1",
    condicionRespuesta: "si",
    acciones: [
      "Realizar el mantenimiento preventivo / correctivo de las conexiones de las instalaciones sanitarias.",
    ],
  },
  {
    codigo: "1.2.2",
    texto:
      "¿Posee pozo absorbente, biodigestor y/o lecho nitrificante para la descarga de los efluentes cloacales generados?",
    seccionCodigo: "1.2",
    orden: 8,
    acciones: [],
  },
  {
    codigo: "1.2.2.1",
    texto:
      "¿El sistema instalado para la descarga de los efluentes cloacales funciona adecuadamente?",
    seccionCodigo: "1.2",
    orden: 9,
    parentPreguntaCodigo: "1.2.2",
    condicionRespuesta: "si",
    acciones: [
      "Verificar el correcto funcionamiento del sistema instalado.",
      "Realizar el mantenimiento preventivo / correctivo periódico del sistema instalado.",
    ],
  },

  // 1.3 EFLUENTES INDUSTRIALES
  {
    codigo: "1.3.1",
    texto: "¿Se desarrollan actividades que generen efluentes industriales?",
    seccionCodigo: "1.3",
    orden: 1,
    acciones: [],
  },
  {
    codigo: "1.3.1.1",
    texto:
      "¿Los sectores de generación cuentan con las instalaciones acondicionadas adecuadamente para la recepción de dichos efluentes?",
    seccionCodigo: "1.3",
    orden: 2,
    parentPreguntaCodigo: "1.3.1",
    condicionRespuesta: "si",
    acciones: [
      "Suspender las tareas que generen efluentes líquidos hasta que se realice el adecuado acondicionamiento del sector.",
      "Realizar el acondicionamiento adecuado del sector.",
      "Instalar un sistema adecuado de separación de sólidos, trampa de grasas/aceites, tratamiento físico-químico y reciclaje del agua tratada.",
    ],
  },
  {
    codigo: "1.3.1.2",
    texto:
      "¿Se evidencia el mantenimiento periódico de las instalaciones (vaciado y limpieza de cámaras y/o canaletas)?",
    seccionCodigo: "1.3",
    orden: 3,
    parentPreguntaCodigo: "1.3.1",
    condicionRespuesta: "si",
    acciones: [
      "Realizar limpieza y/o vaciado de canaletas y cámaras del sector.",
      "Realizar prueba de estanqueidad de cámaras de acopio de efluentes líquidos.",
      "Realizar el desagote preventivo de las cámaras de acopio de efluentes líquidos cuando hay pronóstico de lluvia abundante en la región.",
    ],
  },

  // 2. GESTIÓN DE INSUMOS / PRODUCTOS QUÍMICOS
  {
    codigo: "2.1",
    texto:
      "¿Las áreas de almacenamiento de productos químicos e insumos líquidos (agua de uso industrial) se encuentran acondicionadas adecuadamente?",
    seccionCodigo: "2",
    orden: 1,
    acciones: [
      "Colocar cartelería de identificación de productos químicos / insumos acopiados.",
      "Colocar hojas de seguridad de productos químicos acopiados.",
      "Instalar sistema de contención al sector de acopio de productos químicos.",
      "Asegurar que los sistemas de contención posean una capacidad del 110% del volumen del recipiente de mayor capacidad a contener.",
      "Instalar sistema de ventilación al sector de acopio de productos químicos.",
      "Instalar bandejas de contención sobre los estantes de acopio de productos químicos.",
      "Realizar la clasificación de recipientes de productos químicos, en uso y vacíos.",
      "Colocar cartelería de información de capacidad a tanque de acopio de productos químicos / Insumos.",
      "Colocar cartelería de información de riesgos a tanque de acopio de productos químicos.",
    ],
  },
  {
    codigo: "2.2",
    texto:
      "¿Los productos químicos que poseen características inflamables se encuentran al resguardo de la radiación solar?",
    seccionCodigo: "2",
    orden: 2,
    acciones: ["Asegurar el resguardo a la radiación solar de los productos químicos acopiados."],
  },
  {
    codigo: "2.3",
    texto:
      "¿Los recipientes que contienen productos químicos se encuentran en correcto estado de conservación (integridad / limpieza / hermeticidad)?",
    seccionCodigo: "2",
    orden: 3,
    acciones: [
      "Realizar inspecciones visuales periódicas para detectar posibles daños, fugas o signos de desgaste en los recipientes de acopio de productos químicos.",
      "Realizar prueba de estanqueidad periódica a tanque de acopio de productos químicos.",
      "Instalar sistema de medición de nivel en tanque de acopio de productos químicos / insumos líquidos.",
    ],
  },
  {
    codigo: "2.4",
    texto:
      "¿Los tambores o maxibidones que contienen productos químicos están apilados de manera que se minimice la posibilidad de vuelco, pinchadura o rotura y no más de 2 tambores de altura?",
    seccionCodigo: "2",
    orden: 4,
    acciones: ["Realizar la correcta estiba de recipientes."],
  },

  // 3. CONTROL DE DERRAMES
  {
    codigo: "3.1",
    texto: "¿El área que así lo requiera posee kit anti derrame?",
    seccionCodigo: "3",
    orden: 1,
    acciones: ["Colocar kit antiderrame."],
  },
  {
    codigo: "3.2",
    texto: "¿El kit antiderrame posee los elementos básicos de contención ante derrames?",
    seccionCodigo: "3",
    orden: 2,
    acciones: ["Asegurar el contenido completo de elementos básicos del kit antiderrame."],
  },
  {
    codigo: "3.3",
    texto: "¿El contenedor de transporte del kit se encuentra en buen estado?",
    seccionCodigo: "3",
    orden: 3,
    acciones: [
      "Realizar el recambio del contenedor del kit antiderrame.",
      "Realizar la limpieza del contenedor del kit antiderrame.",
    ],
  },
  {
    codigo: "3.4",
    texto: "¿El contenedor de transporte del kit se encuentra identificado?",
    seccionCodigo: "3",
    orden: 4,
    acciones: [
      "Colocar identificación del kit antiderrame.",
      "Realizar el recambio de identificación del kit antiderrame.",
    ],
  },
  {
    codigo: "3.5",
    texto: "¿El área de ubicación del kit anti derrame se encuentra libre y de fácil acceso?",
    seccionCodigo: "3",
    orden: 5,
    acciones: ["Asegurar el acceso al kit antiderrame.", "Reubicar el kit antiderrame."],
  },
  {
    codigo: "3.6",
    texto:
      "¿Están todas las válvulas, juntas de tuberías, bombas, tanque de reservorio de fluidos, etc. libres de fugas y en buenas condiciones?",
    seccionCodigo: "3",
    orden: 6,
    acciones: [
      "Realizar mantenimiento periódico de equipos para evitar la ocurrencia de derrames ocasionados por las pérdidas de fluidos.",
      "Asegurar el vaciado efectivo de tuberías / equipos.",
    ],
  },
  {
    codigo: "3.7",
    texto:
      "¿Están bien instalados los protectores contra salpicaduras y las bandejas de goteo, en uniones, válvulas, llaves, bombas, etc.?",
    seccionCodigo: "3",
    orden: 7,
    acciones: [
      "Instalar protectores contra salpicaduras.",
      "Colocar bandejas de contención / goteo en zonas críticas.",
    ],
  },
  {
    codigo: "3.8",
    texto:
      "¿Se encuentran los manguerotes de baja presión sin signos de deterioro (aplastamiento, rotura de cobertor, alambres visibles, perdida de simetría, etc.)?",
    seccionCodigo: "3",
    orden: 8,
    acciones: ["Realizar el recambio de manguerote."],
  },
  {
    codigo: "3.9",
    texto:
      "¿Los dispositivos de control de desbordamiento (medidores de nivel) en tanques de acopio funcionan adecuadamente?",
    seccionCodigo: "3",
    orden: 9,
    acciones: [
      "Instalar control de desbordamiento (medidores de nivel) en tanques de acopio.",
      "Realizar el mantenimiento preventivo / correctivo de los sistemas de control de desbordamiento (medidores de nivel) en tanques de acopio.",
    ],
  },
  {
    codigo: "3.10",
    texto:
      "¿Los sistemas y bandejas de contención se encuentran libres de fluidos, agua de lluvia y materiales?",
    seccionCodigo: "3",
    orden: 10,
    acciones: ["Realizar el vaciado periódico de los sistemas y bandejas de contención."],
  },

  // 4. ASPECTOS OPERATIVOS
  {
    codigo: "4.1",
    texto: "¿Es correcto el orden y limpieza de los sectores de trabajo?",
    seccionCodigo: "4",
    orden: 1,
    acciones: ["Realizar el orden y limpieza de los sectores de trabajo."],
  },
  {
    codigo: "4.2",
    texto: "¿Todas las tareas se están desarrollando en sectores debidamente acondicionados?",
    seccionCodigo: "4",
    orden: 2,
    acciones: [
      "Suspender la tarea hasta tanto se realice el acondicionamiento del sector.",
      "Realizar el acondicionamiento del sector acorde a la tarea a realizar.",
    ],
  },
  {
    codigo: "4.3",
    texto:
      "¿Es adecuado el estado general de las tablonadas (integridad, limpieza, uniones, etc.)?",
    seccionCodigo: "4",
    orden: 3,
    acciones: [
      "Realizar recambio de tablonadas en mal estado.",
      "Realizar limpieza de tablonadas.",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding Inspecciones…");

  // 1. Upsert secciones (padres primero, hijas después)
  const rootSections = SECCIONES.filter((s) => !s.parentCodigo);
  const childSections = SECCIONES.filter((s) => s.parentCodigo);

  for (const s of rootSections) {
    await prisma.seccionInspeccion.upsert({
      where: { codigo: s.codigo },
      update: { titulo: s.titulo, orden: s.orden },
      create: { codigo: s.codigo, titulo: s.titulo, orden: s.orden },
    });
  }
  for (const s of childSections) {
    const parent = await prisma.seccionInspeccion.findUniqueOrThrow({
      where: { codigo: s.parentCodigo! },
    });
    await prisma.seccionInspeccion.upsert({
      where: { codigo: s.codigo },
      update: { titulo: s.titulo, orden: s.orden, parentId: parent.id },
      create: { codigo: s.codigo, titulo: s.titulo, orden: s.orden, parentId: parent.id },
    });
  }
  console.log(`  ✓ ${SECCIONES.length} secciones listas`);

  // 2. Upsert preguntas (sin parent primero, con parent después)
  const rootPreguntas = PREGUNTAS.filter((p) => !p.parentPreguntaCodigo);
  const childPreguntas = PREGUNTAS.filter((p) => p.parentPreguntaCodigo);

  for (const p of rootPreguntas) {
    const seccion = await prisma.seccionInspeccion.findUniqueOrThrow({
      where: { codigo: p.seccionCodigo },
    });
    await prisma.preguntaInspeccion.upsert({
      where: { codigo: p.codigo },
      update: { texto: p.texto, orden: p.orden, seccionId: seccion.id },
      create: {
        codigo: p.codigo,
        texto: p.texto,
        seccionId: seccion.id,
        orden: p.orden,
      },
    });
  }
  for (const p of childPreguntas) {
    const seccion = await prisma.seccionInspeccion.findUniqueOrThrow({
      where: { codigo: p.seccionCodigo },
    });
    const parent = await prisma.preguntaInspeccion.findUniqueOrThrow({
      where: { codigo: p.parentPreguntaCodigo! },
    });
    await prisma.preguntaInspeccion.upsert({
      where: { codigo: p.codigo },
      update: {
        texto: p.texto,
        orden: p.orden,
        seccionId: seccion.id,
        parentPreguntaId: parent.id,
        condicionRespuesta: p.condicionRespuesta ?? null,
      },
      create: {
        codigo: p.codigo,
        texto: p.texto,
        seccionId: seccion.id,
        orden: p.orden,
        parentPreguntaId: parent.id,
        condicionRespuesta: p.condicionRespuesta ?? null,
      },
    });
  }
  console.log(`  ✓ ${PREGUNTAS.length} preguntas listas`);

  // 3. Upsert acciones correctivas
  let totalAcciones = 0;
  for (const p of PREGUNTAS) {
    if (!p.acciones.length) continue;

    const pregunta = await prisma.preguntaInspeccion.findUniqueOrThrow({
      where: { codigo: p.codigo },
    });

    // Borrar acciones existentes y recrear (para actualizar texto/orden)
    await prisma.accionCorrectivaInspeccion.deleteMany({
      where: { preguntaId: pregunta.id },
    });

    await prisma.accionCorrectivaInspeccion.createMany({
      data: p.acciones.map((texto, idx) => ({
        preguntaId: pregunta.id,
        texto,
        orden: idx + 1,
      })),
    });

    totalAcciones += p.acciones.length;
  }
  console.log(`  ✓ ${totalAcciones} acciones correctivas listas`);

  console.log("✅ Inspecciones seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
