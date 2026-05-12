# Formulario de Inspección Ambiental — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un formulario digital de inspección ambiental con ~39 preguntas SI/NO/NA, acciones correctivas por checkbox, autoguardado continuo, accesible desde dashboard y URL tablet.

**Architecture:** Modelo relacional normalizado con tablas de catálogo (secciones, preguntas, acciones correctivas) populadas por seed + tablas operativas (formulario, respuestas, acciones seleccionadas). Componente `<InspeccionForm>` compartido entre layout dashboard y layout tablet minimalista. Autoguardado vía upsert por pregunta con debounce.

**Tech Stack:** Prisma (schema + seed), React Hook Form (NO — toggles directos), React Query (mutations para autoguardado), Sonner (feedback), shadcn/ui (acordeón, checkbox, toggle group, skeleton).

**Spec:** `docs/superpowers/specs/2026-05-12-formulario-inspeccion-ambiental-design.md`

---

## File Structure

### New Files

| File                                                                    | Responsibility                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| `prisma/seed-inspecciones.ts`                                           | Seed de secciones, preguntas y acciones correctivas |
| `src/repositories/inspeccion.repository.ts`                             | Data access para InspeccionFormulario con includes  |
| `src/dtos/inspeccion.dto.ts`                                            | DTOs para formulario, respuesta, pregunta           |
| `src/components/inspecciones/Inspecciones.tsx`                          | Wrapper con React Query para listado                |
| `src/components/inspecciones/components/actions.ts`                     | Server actions de lectura                           |
| `src/components/inspecciones/components/inspeccion-actions.ts`          | Server actions mutantes con requirePermission       |
| `src/components/inspecciones/components/inspecciones-table.tsx`         | Tabla paginada                                      |
| `src/components/inspecciones/components/inspecciones-table-wrapper.tsx` | Card wrapper con botón crear                        |
| `src/components/inspecciones/components/columns.tsx`                    | Columnas de la tabla                                |
| `src/components/inspecciones/components/inspeccion-crear.tsx`           | Dialog para crear inspección                        |
| `src/components/inspecciones/components/inspeccion-form.tsx`            | Formulario principal (autoguardado)                 |
| `src/components/inspecciones/components/inspeccion-seccion.tsx`         | Acordeón por sección                                |
| `src/components/inspecciones/components/inspeccion-pregunta.tsx`        | Pregunta individual con toggles                     |
| `src/app/dashboard/inspecciones/page.tsx`                               | Listado dashboard                                   |
| `src/app/dashboard/inspecciones/nueva/page.tsx`                         | Crear nueva                                         |
| `src/app/dashboard/inspecciones/[id]/page.tsx`                          | Formulario dashboard                                |
| `src/app/dashboard/inspecciones/loading.tsx`                            | Loading state                                       |
| `src/app/dashboard/inspecciones/error.tsx`                              | Error boundary                                      |
| `src/app/inspeccion/layout.tsx`                                         | Layout tablet minimalista                           |
| `src/app/inspeccion/page.tsx`                                           | Landing tablet                                      |
| `src/app/inspeccion/[id]/page.tsx`                                      | Formulario tablet                                   |

### Modified Files

| File                             | Change                                                                      |
| -------------------------------- | --------------------------------------------------------------------------- |
| `prisma/schema.prisma`           | 6 modelos + 3 enums + relaciones en Cliente, User, ClientLocations, Informe |
| `src/lib/rbac/permissions.ts`    | Agregar INSPECCIONES_VIEW/CREATE/UPDATE/DELETE                              |
| `src/lib/rbac/route-guards.ts`   | Agregar /dashboard/inspecciones                                             |
| `prisma/seed-rbac.ts`            | Agregar permisos inspecciones al catálogo + mappings por rol                |
| `src/components/app-sidebar.tsx` | Entrada "Inspecciones" en grupo Planificación                               |
| `src/dtos/index.ts`              | Exportar DTOs de inspección                                                 |

---

### Task 1: Schema Prisma — modelos y enums

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Agregar enums de inspección**

En `prisma/schema.prisma`, antes del cierre del archivo (después del enum `CondicionTipo`), agregar:

```prisma
enum InspeccionEstado {
  borrador
  completada
}

enum InspeccionTipo {
  inspeccion_base
  inspeccion_equipo
}

enum RespuestaValor {
  si
  no
  na
}
```

- [ ] **Step 2: Agregar modelos de catálogo**

Después de `RolePermission` y antes de los enums, agregar:

```prisma
// Inspecciones Ambientales — Catálogo

model SeccionInspeccion {
  id        String @id @default(uuid())
  codigo    String @unique
  titulo    String
  parentId  String?
  parent    SeccionInspeccion?  @relation("SeccionHija", fields: [parentId], references: [id])
  hijas     SeccionInspeccion[] @relation("SeccionHija")
  orden     Int
  preguntas PreguntaInspeccion[]

  @@index([parentId])
  @@index([orden])
}

model PreguntaInspeccion {
  id                  String @id @default(uuid())
  codigo              String @unique
  texto               String
  seccionId           String
  seccion             SeccionInspeccion @relation(fields: [seccionId], references: [id])
  orden               Int
  parentPreguntaId    String?
  parentPregunta      PreguntaInspeccion?  @relation("PreguntaCondicional", fields: [parentPreguntaId], references: [id])
  hijasCondicionales  PreguntaInspeccion[] @relation("PreguntaCondicional")
  condicionRespuesta  String?

  acciones   AccionCorrectivaInspeccion[]
  respuestas InspeccionRespuesta[]

  @@index([seccionId])
  @@index([parentPreguntaId])
  @@index([orden])
}

model AccionCorrectivaInspeccion {
  id          String @id @default(uuid())
  preguntaId  String
  pregunta    PreguntaInspeccion @relation(fields: [preguntaId], references: [id])
  texto       String
  orden       Int

  selecciones InspeccionAccionSeleccionada[]

  @@index([preguntaId])
  @@index([orden])
}
```

- [ ] **Step 3: Agregar modelos operativos**

```prisma
// Inspecciones Ambientales — Operativo

model InspeccionFormulario {
  id               String            @id @default(uuid())
  clienteId        String
  cliente          Cliente           @relation(fields: [clienteId], references: [id])
  tipo             InspeccionTipo
  fecha            DateTime          @default(now())
  estado           InspeccionEstado   @default(borrador)
  realizadoPorId   String
  realizadoPor     User              @relation(fields: [realizadoPorId], references: [id])
  clientLocationId String?
  clientLocation   ClientLocations?  @relation(fields: [clientLocationId], references: [id])
  lugarTexto       String?
  informeId        String?           @unique
  informe          Informe?          @relation(fields: [informeId], references: [id])
  respuestas       InspeccionRespuesta[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([clienteId])
  @@index([realizadoPorId])
  @@index([estado])
  @@index([tipo])
  @@index([fecha])
  @@index([clientLocationId])
}

model InspeccionRespuesta {
  id             String              @id @default(uuid())
  formularioId   String
  formulario     InspeccionFormulario @relation(fields: [formularioId], references: [id], onDelete: Cascade)
  preguntaId     String
  pregunta       PreguntaInspeccion  @relation(fields: [preguntaId], references: [id])
  valor          RespuestaValor
  observaciones  String?
  accionesSeleccionadas InspeccionAccionSeleccionada[]
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  @@unique([formularioId, preguntaId])
  @@index([formularioId])
  @@index([preguntaId])
}

model InspeccionAccionSeleccionada {
  respuestaId String
  respuesta   InspeccionRespuesta        @relation(fields: [respuestaId], references: [id], onDelete: Cascade)
  accionId    String
  accion      AccionCorrectivaInspeccion  @relation(fields: [accionId], references: [id])

  @@id([respuestaId, accionId])
  @@index([respuestaId])
}
```

- [ ] **Step 4: Agregar relaciones inversas en modelos existentes**

En el modelo `Cliente`, después de `planesTrabajo PlanTrabajo[]`, agregar:

```prisma
  inspecciones InspeccionFormulario[]
```

En el modelo `User`, después de `updatedAt DateTime @updatedAt`, agregar:

```prisma
  inspecciones InspeccionFormulario[]
```

En el modelo `ClientLocations`, después de `planesTrabajoProgramaciones PlanTrabajoProgramacion[]`, agregar:

```prisma
  inspecciones InspeccionFormulario[]
```

En el modelo `Informe`, después de `updatedAt DateTime @default(now())`, agregar:

```prisma
  inspeccion InspeccionFormulario?
```

- [ ] **Step 5: Generar Prisma client y verificar**

```bash
npx prisma generate
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/generated/
git commit -m "feat(inspecciones): add schema models for inspection forms"
```

---

### Task 2: Migración + seed de preguntas

**Files:**

- Create: `prisma/seed-inspecciones.ts`

- [ ] **Step 1: Crear migración**

```bash
npx prisma migrate dev --name add_inspecciones
```

- [ ] **Step 2: Crear seed de inspecciones**

Crear `prisma/seed-inspecciones.ts`. El archivo es largo (~600 líneas) por las ~39 preguntas y ~120 acciones correctivas. Estructura:

```typescript
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
```

- [ ] **Step 3: Correr el seed**

```bash
npx tsx prisma/seed-inspecciones.ts
```

Expected output:

```
🌱 Seeding Inspecciones…
  ✓ 7 secciones listas
  ✓ 39 preguntas listas
  ✓ ~120 acciones correctivas listas
✅ Inspecciones seed completado
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(inspecciones): add migration and seed for inspection questions"
```

---

### Task 3: Permisos RBAC + sidebar + route-guards

**Files:**

- Modify: `src/lib/rbac/permissions.ts`
- Modify: `src/lib/rbac/route-guards.ts`
- Modify: `prisma/seed-rbac.ts`
- Modify: `src/components/app-sidebar.tsx`

- [ ] **Step 1: Agregar constantes de permisos**

En `src/lib/rbac/permissions.ts`, antes de `} as const;`, agregar:

```typescript
  // Inspecciones
  INSPECCIONES_VIEW: "inspecciones:view",
  INSPECCIONES_CREATE: "inspecciones:create",
  INSPECCIONES_UPDATE: "inspecciones:update",
  INSPECCIONES_DELETE: "inspecciones:delete",
```

- [ ] **Step 2: Agregar route-guard**

En `src/lib/rbac/route-guards.ts`, agregar dentro de `ROUTE_GUARDS`:

```typescript
  "/dashboard/inspecciones": [
    ROLES.ADMIN,
    ROLES.GERENTE,
    ROLES.TECNICO,
    ROLES.LECTURA,
  ],
```

- [ ] **Step 3: Agregar permisos al seed RBAC**

En `prisma/seed-rbac.ts`:

a) En el array `PERMISSIONS`, agregar después de los permisos de informes:

```typescript
  ...crudPermissions("inspecciones"),
```

b) En `ROLE_PERMISSIONS.gerente`, agregar:

```typescript
    "inspecciones:view",
    "inspecciones:create",
    "inspecciones:update",
```

c) En `ROLE_PERMISSIONS.tecnico`, agregar:

```typescript
    "inspecciones:view",
    "inspecciones:create",
    "inspecciones:update",
```

d) En `ROLE_PERMISSIONS.lectura`, agregar:

```typescript
    "inspecciones:view",
```

- [ ] **Step 4: Agregar al sidebar**

En `src/components/app-sidebar.tsx`, dentro del grupo "Planificación", después del item "Informes", agregar:

```typescript
      {
        title: "Inspecciones",
        url: "/dashboard/inspecciones",
        requiredPermission: PERMISSIONS.INSPECCIONES_VIEW,
      },
```

- [ ] **Step 5: Correr seed RBAC actualizado**

```bash
npx tsx prisma/seed-rbac.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/rbac/ prisma/seed-rbac.ts src/components/app-sidebar.tsx
git commit -m "feat(inspecciones): add RBAC permissions, route-guard and sidebar entry"
```

---

### Task 4: Repository + DTOs + server actions

**Files:**

- Create: `src/repositories/inspeccion.repository.ts`
- Create: `src/dtos/inspeccion.dto.ts`
- Modify: `src/dtos/index.ts`
- Create: `src/components/inspecciones/components/actions.ts`
- Create: `src/components/inspecciones/components/inspeccion-actions.ts`

- [ ] **Step 1: Crear repository**

Crear `src/repositories/inspeccion.repository.ts`:

```typescript
import { InspeccionFormulario } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";
import prisma from "@/lib/db";

export type InspeccionCreateInput = {
  clienteId: string;
  tipo: "inspeccion_base" | "inspeccion_equipo";
  realizadoPorId: string;
  clientLocationId?: string | null;
  lugarTexto?: string | null;
  informeId?: string | null;
};

export type InspeccionUpdateInput = Partial<
  Omit<InspeccionCreateInput, "realizadoPorId" | "clienteId">
> & {
  estado?: "borrador" | "completada";
};

export class InspeccionRepository extends BaseRepository<
  InspeccionFormulario,
  InspeccionCreateInput,
  InspeccionUpdateInput
> {
  protected modelName = "InspeccionFormulario";

  protected getDelegate() {
    return this.prisma.inspeccionFormulario;
  }

  protected getDefaultInclude() {
    return {
      cliente: { select: { id: true, name: true } },
      realizadoPor: { select: { id: true, name: true, email: true } },
      clientLocation: { select: { id: true, name: true } },
      informe: { select: { id: true, estado: true } },
    };
  }

  protected getDefaultOrderBy() {
    return { fecha: "desc" as const };
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { cliente: { name: { contains: search, mode: "insensitive" as const } } },
        { lugarTexto: { contains: search, mode: "insensitive" as const } },
      ],
    };
  }

  async findByIdWithRespuestas(id: string) {
    try {
      return await this.prisma.inspeccionFormulario.findUnique({
        where: { id },
        include: {
          ...this.getDefaultInclude(),
          respuestas: {
            include: {
              pregunta: true,
              accionesSeleccionadas: {
                include: { accion: true },
              },
            },
          },
        },
      });
    } catch (error) {
      dbLogger.error({ error, id }, "Error finding inspeccion with respuestas");
      throw error;
    }
  }

  async findBorradorByUser(userId: string) {
    try {
      return await this.prisma.inspeccionFormulario.findMany({
        where: { realizadoPorId: userId, estado: "borrador" },
        include: this.getDefaultInclude(),
        orderBy: { updatedAt: "desc" },
      });
    } catch (error) {
      dbLogger.error({ error, userId }, "Error finding borradores by user");
      throw error;
    }
  }
}

export const inspeccionRepository = new InspeccionRepository();
```

- [ ] **Step 2: Crear DTOs**

Crear `src/dtos/inspeccion.dto.ts`:

```typescript
export interface InspeccionSummaryDto {
  id: string;
  clienteNombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  realizadoPorNombre: string | null;
  lugarNombre: string | null;
  createdAt: string;
}

export interface InspeccionRespuestaDto {
  id: string;
  preguntaId: string;
  preguntaCodigo: string;
  valor: string;
  observaciones: string | null;
  accionesSeleccionadasIds: string[];
}

export interface InspeccionDetalleDto {
  id: string;
  clienteId: string;
  clienteNombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  realizadoPorId: string;
  realizadoPorNombre: string | null;
  clientLocationId: string | null;
  clientLocationNombre: string | null;
  lugarTexto: string | null;
  informeId: string | null;
  respuestas: InspeccionRespuestaDto[];
}
```

Agregar exports en `src/dtos/index.ts`:

```typescript
// Inspeccion DTOs
export type {
  InspeccionSummaryDto,
  InspeccionRespuestaDto,
  InspeccionDetalleDto,
} from "./inspeccion.dto";
```

- [ ] **Step 3: Crear server actions de lectura**

Crear `src/components/inspecciones/components/actions.ts`:

```typescript
"use server";

import prisma from "@/lib/db";
import { inspeccionRepository } from "@/repositories/inspeccion.repository";
import { dbLogger } from "@/lib/logger";

export async function getInspeccionesPaginated(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, any>;
}) {
  try {
    const skip = (params.page - 1) * params.pageSize;
    const where: any = {};

    if (params.search) {
      where.OR = [
        { cliente: { name: { contains: params.search, mode: "insensitive" as const } } },
        { lugarTexto: { contains: params.search, mode: "insensitive" as const } },
      ];
    }

    if (
      params.filters?.estado &&
      Array.isArray(params.filters.estado) &&
      params.filters.estado.length > 0
    ) {
      where.estado = { in: params.filters.estado };
    }

    if (
      params.filters?.tipo &&
      Array.isArray(params.filters.tipo) &&
      params.filters.tipo.length > 0
    ) {
      where.tipo = { in: params.filters.tipo };
    }

    const [data, total, estadoGroupBy] = await Promise.all([
      prisma.inspeccionFormulario.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          cliente: { select: { id: true, name: true } },
          realizadoPor: { select: { id: true, name: true, email: true } },
          clientLocation: { select: { id: true, name: true } },
        },
        orderBy: { fecha: "desc" },
      }),
      prisma.inspeccionFormulario.count({ where }),
      prisma.inspeccionFormulario.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    const facetCounts: Record<string, Record<string, number>> = {
      estado: Object.fromEntries(estadoGroupBy.map((r) => [r.estado, r._count._all])),
    };

    return {
      data: data.map((i) => ({
        id: i.id,
        clienteNombre: i.cliente.name,
        tipo: i.tipo,
        fecha: i.fecha.toISOString(),
        estado: i.estado,
        realizadoPorNombre: i.realizadoPor.name ?? i.realizadoPor.email,
        lugarNombre: i.clientLocation?.name ?? i.lugarTexto ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
      total,
      pageCount: Math.ceil(total / params.pageSize),
      facetCounts,
    };
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener inspecciones paginadas");
    throw error;
  }
}

export async function getInspeccionById(id: string) {
  const inspeccion = await inspeccionRepository.findByIdWithRespuestas(id);
  if (!inspeccion) return null;
  return inspeccion;
}

export async function getSeccionesConPreguntas() {
  return prisma.seccionInspeccion.findMany({
    where: { parentId: null },
    include: {
      hijas: {
        include: {
          preguntas: {
            where: { parentPreguntaId: null },
            include: {
              acciones: { orderBy: { orden: "asc" } },
              hijasCondicionales: {
                include: {
                  acciones: { orderBy: { orden: "asc" } },
                },
                orderBy: { orden: "asc" },
              },
            },
            orderBy: { orden: "asc" },
          },
        },
        orderBy: { orden: "asc" },
      },
      preguntas: {
        where: { parentPreguntaId: null },
        include: {
          acciones: { orderBy: { orden: "asc" } },
          hijasCondicionales: {
            include: {
              acciones: { orderBy: { orden: "asc" } },
            },
            orderBy: { orden: "asc" },
          },
        },
        orderBy: { orden: "asc" },
      },
    },
    orderBy: { orden: "asc" },
  });
}

export async function getMisBorradores(userId: string) {
  return inspeccionRepository.findBorradorByUser(userId);
}
```

- [ ] **Step 4: Crear server actions mutantes**

Crear `src/components/inspecciones/components/inspeccion-actions.ts`:

```typescript
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { dbLogger } from "@/lib/logger";

export async function crearInspeccion(data: {
  clienteId: string;
  tipo: "inspeccion_base" | "inspeccion_equipo";
  clientLocationId?: string | null;
  lugarTexto?: string | null;
  informeId?: string | null;
}) {
  const user = await requirePermission(PERMISSIONS.INSPECCIONES_CREATE);

  try {
    const inspeccion = await prisma.inspeccionFormulario.create({
      data: {
        clienteId: data.clienteId,
        tipo: data.tipo,
        realizadoPorId: user.id,
        clientLocationId: data.tipo === "inspeccion_base" ? (data.clientLocationId ?? null) : null,
        lugarTexto: data.tipo === "inspeccion_equipo" ? (data.lugarTexto ?? null) : null,
        informeId: data.informeId ?? null,
      },
    });

    revalidatePath("/dashboard/inspecciones");
    return { success: true, id: inspeccion.id };
  } catch (error) {
    dbLogger.error({ error }, "Error al crear inspección");
    throw error;
  }
}

export async function guardarRespuesta(data: {
  formularioId: string;
  preguntaId: string;
  valor: "si" | "no" | "na";
  observaciones?: string | null;
  accionIds?: string[];
}) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    const respuesta = await prisma.inspeccionRespuesta.upsert({
      where: {
        formularioId_preguntaId: {
          formularioId: data.formularioId,
          preguntaId: data.preguntaId,
        },
      },
      update: {
        valor: data.valor,
        observaciones: data.observaciones ?? null,
      },
      create: {
        formularioId: data.formularioId,
        preguntaId: data.preguntaId,
        valor: data.valor,
        observaciones: data.observaciones ?? null,
      },
    });

    // Sincronizar acciones correctivas
    await prisma.inspeccionAccionSeleccionada.deleteMany({
      where: { respuestaId: respuesta.id },
    });

    if (data.valor === "no" && data.accionIds?.length) {
      await prisma.inspeccionAccionSeleccionada.createMany({
        data: data.accionIds.map((accionId) => ({
          respuestaId: respuesta.id,
          accionId,
        })),
        skipDuplicates: true,
      });
    }

    // Actualizar updatedAt del formulario
    await prisma.inspeccionFormulario.update({
      where: { id: data.formularioId },
      data: { updatedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    dbLogger.error({ error, data }, "Error al guardar respuesta");
    throw error;
  }
}

export async function finalizarInspeccion(formularioId: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    await prisma.inspeccionFormulario.update({
      where: { id: formularioId },
      data: { estado: "completada" },
    });

    revalidatePath("/dashboard/inspecciones");
    revalidatePath(`/dashboard/inspecciones/${formularioId}`);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, formularioId }, "Error al finalizar inspección");
    throw error;
  }
}

export async function eliminarInspeccion(id: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_DELETE);

  try {
    await prisma.inspeccionFormulario.delete({ where: { id } });
    revalidatePath("/dashboard/inspecciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, id }, "Error al eliminar inspección");
    throw error;
  }
}
```

- [ ] **Step 5: Lint + typecheck**

```bash
npx eslint src/repositories/inspeccion.repository.ts src/dtos/inspeccion.dto.ts src/components/inspecciones/
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/repositories/inspeccion.repository.ts src/dtos/inspeccion.dto.ts src/dtos/index.ts src/components/inspecciones/
git commit -m "feat(inspecciones): add repository, DTOs and server actions"
```

---

### Task 5: Páginas dashboard + listado + componentes tabla

**Files:**

- Create: todas las páginas bajo `src/app/dashboard/inspecciones/`
- Create: componentes de tabla bajo `src/components/inspecciones/`

- [ ] **Step 1: Crear página de listado, loading y error**

El listado sigue exactamente el mismo patrón que `src/app/dashboard/clientes/page.tsx` y `src/components/clientes/Clientes.tsx`. Crear:

`src/app/dashboard/inspecciones/page.tsx`:

```typescript
import { Inspecciones } from "@/components/inspecciones/Inspecciones";

export const revalidate = 0;

export default function InspeccionesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Inspecciones Ambientales</h1>
        <p className="text-sm text-muted-foreground">
          Formularios de inspección ambiental completados y en progreso.
        </p>
      </div>
      <Inspecciones />
    </div>
  );
}
```

`src/app/dashboard/inspecciones/loading.tsx`:

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[300px]" />
      <Skeleton className="h-4 w-[450px]" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
```

`src/app/dashboard/inspecciones/error.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function InspeccionesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Inspecciones error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">Error en inspecciones</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "Ocurrió un error inesperado."}
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Crear componentes de tabla**

Seguir los patrones de `src/components/clientes/` para crear:

- `src/components/inspecciones/Inspecciones.tsx` — wrapper con React Query y paginación usando `getInspeccionesPaginated`.
- `src/components/inspecciones/components/inspecciones-table-wrapper.tsx` — Card con header + botón "Nueva inspección".
- `src/components/inspecciones/components/inspecciones-table.tsx` — DataTable con columns.
- `src/components/inspecciones/components/columns.tsx` — columnas: Fecha, Cliente, Tipo (badge), Lugar, Realizado por, Estado (badge borrador/completada), Acciones (link a detalle).

Los tipos de inspección y estado deben mostrarse con badges: `borrador` → outline/amarillo, `completada` → verde, `inspeccion_base` → "Inspección de Base", `inspeccion_equipo` → "Inspección de Equipo".

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/inspecciones/ src/components/inspecciones/
git commit -m "feat(inspecciones): add dashboard listing page with paginated table"
```

---

### Task 6: Formulario de creación

**Files:**

- Create: `src/components/inspecciones/components/inspeccion-crear.tsx`
- Create: `src/app/dashboard/inspecciones/nueva/page.tsx`

- [ ] **Step 1: Crear componente de creación**

`src/components/inspecciones/components/inspeccion-crear.tsx` — formulario con:

- Dropdown de clientes (usar `getClientes` existente de `src/components/clientes/components/actions.ts`).
- Select de tipo: Inspección de Base / Inspección de Equipo.
- Si tipo = `inspeccion_base` → dropdown de `ClientLocations` filtrado por cliente seleccionado (usar `getActiveClientLocations` de `src/components/clientLocations/components/actions.ts`).
- Si tipo = `inspeccion_equipo` → input de texto libre para lugar.
- Dropdown opcional de informes pendientes del cliente (para vincular).
- Botón "Crear y comenzar inspección" → llama `crearInspeccion` → redirect a `/dashboard/inspecciones/<id>`.

Usar React Hook Form + Zod para validación. El schema Zod:

```typescript
const crearInspeccionSchema = z
  .object({
    clienteId: z.string().min(1, "El cliente es requerido"),
    tipo: z.enum(["inspeccion_base", "inspeccion_equipo"]),
    clientLocationId: z.string().optional(),
    lugarTexto: z.string().optional(),
    informeId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "inspeccion_base") return !!data.clientLocationId;
      if (data.tipo === "inspeccion_equipo") return !!data.lugarTexto;
      return true;
    },
    { message: "El lugar es requerido", path: ["clientLocationId"] }
  );
```

- [ ] **Step 2: Crear página**

`src/app/dashboard/inspecciones/nueva/page.tsx`:

```typescript
import { InspeccionCrear } from "@/components/inspecciones/components/inspeccion-crear";

export default function NuevaInspeccionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nueva inspección</h1>
        <p className="text-sm text-muted-foreground">
          Seleccioná el cliente, tipo de inspección y lugar para comenzar.
        </p>
      </div>
      <InspeccionCrear redirectBase="/dashboard/inspecciones" />
    </div>
  );
}
```

El `redirectBase` prop permite reusar el mismo componente para la ruta tablet (`/inspeccion`).

- [ ] **Step 3: Commit**

```bash
git add src/components/inspecciones/components/inspeccion-crear.tsx src/app/dashboard/inspecciones/nueva/
git commit -m "feat(inspecciones): add creation form with client/type/location selection"
```

---

### Task 7: Formulario de inspección (componente principal + autoguardado)

**Files:**

- Create: `src/components/inspecciones/components/inspeccion-form.tsx`
- Create: `src/components/inspecciones/components/inspeccion-seccion.tsx`
- Create: `src/components/inspecciones/components/inspeccion-pregunta.tsx`
- Create: `src/app/dashboard/inspecciones/[id]/page.tsx`

Este es el task más complejo. El componente `<InspeccionForm>` carga las secciones/preguntas del catálogo + las respuestas existentes del formulario, y renderiza todo en acordeones con autoguardado.

- [ ] **Step 1: Crear componente `<InspeccionPregunta>`**

`src/components/inspecciones/components/inspeccion-pregunta.tsx`:

Renderiza una pregunta individual con:

- Código + texto.
- 3 botones toggle (SÍ/NO/NA) usando `ToggleGroup` de shadcn o 3 `Button` con variant cambiante.
- Si NO → expandir panel con checkboxes de acciones correctivas + textarea de observaciones.
- Si SÍ y tiene `hijasCondicionales` → renderizar `<InspeccionPregunta>` recursivamente para cada hija.
- Textarea de observaciones (siempre visible, colapsable).
- Al cambiar cualquier valor → llama `onSave(preguntaId, valor, observaciones, accionIds)` (callback del padre).
- Props: `pregunta`, `respuesta` (estado actual), `readOnly`, `onSave`, `isSaving`.

- [ ] **Step 2: Crear componente `<InspeccionSeccion>`**

`src/components/inspecciones/components/inspeccion-seccion.tsx`:

Usa `Collapsible` de shadcn. Muestra:

- Título de sección con código.
- Contador de preguntas respondidas / total.
- Si tiene sub-secciones → renderiza `<InspeccionSeccion>` recursivamente.
- Si tiene preguntas directas → renderiza `<InspeccionPregunta>` para cada una.

- [ ] **Step 3: Crear componente `<InspeccionForm>`**

`src/components/inspecciones/components/inspeccion-form.tsx`:

Componente principal. Carga datos con React Query:

- Query `["secciones-inspeccion"]` → `getSeccionesConPreguntas()`.
- Query `["inspeccion", id]` → `getInspeccionById(id)`.

Estado local: `Map<preguntaId, { valor, observaciones, accionIds }>` inicializado con las respuestas existentes.

Mutation para autoguardado:

```typescript
const saveMutation = useMutation({
  mutationFn: guardarRespuesta,
  onError: () => toast.error("Error al guardar"),
});
```

Callback `handleSave` con debounce de 500ms para observaciones:

```typescript
function handleSave(
  preguntaId: string,
  valor: string,
  observaciones?: string,
  accionIds?: string[]
) {
  setRespuestas((prev) => {
    /* actualizar Map local */
  });
  saveMutation.mutate({
    formularioId: inspeccion.id,
    preguntaId,
    valor: valor as "si" | "no" | "na",
    observaciones,
    accionIds: valor === "no" ? accionIds : [],
  });
}
```

Indicador de estado: "Guardado ✓" / "Guardando..." / "Error al guardar".

Botón "Finalizar inspección" al final:

- Valida que todas las preguntas visibles tengan respuesta.
- Llama `finalizarInspeccion(id)`.
- Muestra confirmación.

Si `estado === "completada"` → todo en modo `readOnly`.

Cabecera del formulario muestra: cliente, tipo, fecha, lugar, realizado por, estado.

- [ ] **Step 4: Crear página del formulario**

`src/app/dashboard/inspecciones/[id]/page.tsx`:

```typescript
import { InspeccionForm } from "@/components/inspecciones/components/inspeccion-form";

export const revalidate = 0;

export default async function InspeccionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InspeccionForm inspeccionId={id} />;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/inspecciones/components/inspeccion-pregunta.tsx \
  src/components/inspecciones/components/inspeccion-seccion.tsx \
  src/components/inspecciones/components/inspeccion-form.tsx \
  src/app/dashboard/inspecciones/\[id\]/
git commit -m "feat(inspecciones): add inspection form with autosave and conditional questions"
```

---

### Task 8: Layout y rutas tablet

**Files:**

- Create: `src/app/inspeccion/layout.tsx`
- Create: `src/app/inspeccion/page.tsx`
- Create: `src/app/inspeccion/[id]/page.tsx`

- [ ] **Step 1: Crear layout minimalista para tablet**

`src/app/inspeccion/layout.tsx`:

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUserPermissions } from "@/lib/auth";
import { PermissionsProvider } from "@/components/rbac/PermissionsProvider";
import Image from "next/image";
import Link from "next/link";

export default async function InspeccionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { role, codes } = await getCurrentUserPermissions();

  return (
    <PermissionsProvider role={role} codes={codes}>
      <div className="min-h-screen bg-background">
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <Link href="/inspeccion">
            <Image
              src="/LogoHorizontal.webp"
              alt="Sinergia"
              width={140}
              height={45}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </header>
        <main className="p-4 max-w-4xl mx-auto">{children}</main>
      </div>
    </PermissionsProvider>
  );
}
```

- [ ] **Step 2: Crear landing tablet**

`src/app/inspeccion/page.tsx`:

```typescript
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentDbUser } from "@/lib/auth";
import { getMisBorradores } from "@/components/inspecciones/components/actions";

export const revalidate = 0;

export default async function InspeccionLandingPage() {
  const user = await getCurrentDbUser();
  if (!user) return null;

  const borradores = await getMisBorradores(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inspecciones</h1>
        <Button asChild>
          <Link href="/inspeccion/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva inspección
          </Link>
        </Button>
      </div>

      {borradores.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">En progreso</h2>
          {borradores.map((b) => (
            <Link
              key={b.id}
              href={`/inspeccion/${b.id}`}
              className="block rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="font-medium">{(b as any).cliente?.name}</div>
              <div className="text-sm text-muted-foreground">
                {b.tipo === "inspeccion_base" ? "Inspección de Base" : "Inspección de Equipo"}
                {" · "}
                {(b as any).clientLocation?.name ?? b.lugarTexto ?? "—"}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No tenés inspecciones en progreso.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Crear páginas de nueva y detalle tablet**

`src/app/inspeccion/nueva/page.tsx` (página de creación tablet que reusa InspeccionCrear pero redirige a `/inspeccion/<id>`):

```typescript
import { InspeccionCrear } from "@/components/inspecciones/components/inspeccion-crear";

export default function NuevaInspeccionTabletPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nueva inspección</h1>
      <InspeccionCrear redirectBase="/inspeccion" />
    </div>
  );
}
```

`src/app/inspeccion/[id]/page.tsx` (reusa InspeccionForm):

```typescript
import { InspeccionForm } from "@/components/inspecciones/components/inspeccion-form";

export const revalidate = 0;

export default async function InspeccionTabletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InspeccionForm inspeccionId={id} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/inspeccion/
git commit -m "feat(inspecciones): add tablet layout and routes"
```

---

### Task 9: Verificación final

- [ ] **Step 1: Lint + typecheck**

```bash
npx eslint src/components/inspecciones src/app/dashboard/inspecciones src/app/inspeccion src/repositories/inspeccion.repository.ts src/dtos/inspeccion.dto.ts
npx tsc --noEmit
```

- [ ] **Step 2: Test manual**

1. `npm run dev` → navegar a `/dashboard/inspecciones` → tabla vacía.
2. Click "Nueva inspección" → elegir cliente, tipo base, locación → "Crear" → redirect al formulario.
3. Responder algunas preguntas SÍ/NO/NA → verificar que aparece "Guardado ✓".
4. Responder NO en 1.1.1 → checkboxes de acciones correctivas visibles → seleccionar algunas.
5. Responder SÍ en 1.2.1 → sub-preguntas 1.2.1.1 a 1.2.1.6 visibles.
6. Cerrar pestaña → reabrir → respuestas persistidas.
7. Finalizar inspección → pasa a solo lectura con colores SI=verde, NO=rojo, NA=gris.
8. Abrir `/inspeccion` en otra pestaña → landing tablet con borradores.
9. Crear inspección tipo equipo → campo de texto para lugar.
10. Verificar permisos: login como lectura → puede ver pero no crear.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat(inspecciones): complete environmental inspection form module"
```
