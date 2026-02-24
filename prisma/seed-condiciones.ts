import { PrismaClient, CondicionTipo } from "../src/generated/client";
import { config } from "dotenv";

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding condiciones...");

  // Condiciones Generales
  const condicionesGenerales = [
    {
      tipo: CondicionTipo.general,
      title: "Profesionales Matriculados",
      description:
        "Las tareas serán efectuadas por profesionales inscriptos en el Registro Provincial de Prestadores de Servicios Ambientales (RePPSA) y matriculados en el Colegio Profesional de Ambiente de la Provincia de Neuquén (CPAN).",
      category: null,
      order: 1,
      is_active: true,
    },
    {
      tipo: CondicionTipo.general,
      title: "Honorarios Públicos Excluidos",
      description:
        "Los costos de sellados y tasas que surjan de dependencias públicas y/o privadas, quedan exceptuadas de este presupuesto.",
      category: null,
      order: 2,
      is_active: true,
    },
    {
      tipo: CondicionTipo.general,
      title: "Ajuste por Inflación",
      description:
        "Los valores en pesos argentinos consignados en la presente propuesta quedan sujetos a incremento según el aumento de costos o inflación, en cuyo caso se reanalizará con la empresa.",
      category: null,
      order: 3,
      is_active: true,
    },
    {
      tipo: CondicionTipo.general,
      title: "Tabla de Honorarios",
      description:
        "Los valores establecidos en esta propuesta son fijados de acuerdo a lo establecido por la tabla de honorarios profesionales sugerida por el Colegio de Profesionales del Ambiente de Neuquén (CPAN).",
      category: null,
      order: 4,
      is_active: true,
    },
    {
      tipo: CondicionTipo.general,
      title: "Validez",
      description:
        "Esta Propuesta tiene validez por 10 días desde la fecha indicada en el encabezado.",
      category: null,
      order: 5,
      is_active: true,
    },
  ];

  // Condiciones Particulares
  const condicionesParticulares = [
    {
      tipo: CondicionTipo.particular,
      title: "Visita mensual (1)",
      description:
        "El servicio considera una (1) actividad ambiental mensual, las cuales estarán establecidas en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.",
      category: "Visitas",
      order: 1,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Visita mensual (2)",
      description:
        "El servicio considera dos (2) actividades ambientales mensuales, las cuales estarán establecidas en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.",
      category: "Visitas",
      order: 2,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Estudios no incluidos",
      description:
        "La confección de Estudios de Impacto Ambiental, Auditorías Ambientales e Informes Ambientales no están incluidos en la presente Oferta Técnica Económica. Los mismos pueden solicitarse en un presupuesto independiente.",
      category: "Incluye",
      order: 3,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Plazo de entrega (30 días)",
      description:
        "El plazo de entrega del Estudio / Informe / Auditoría Ambiental es de 30 días hábiles a partir de la fecha de aprobación de la presente Oferta Técnica.",
      category: "Plazos",
      order: 4,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Incluye ampliaciones",
      description:
        "El costo total de la propuesta incluye las ampliaciones y otras solicitudes que pudieran surgir por la autoridad de aplicación respecto a lo presentado.",
      category: "Incluye",
      order: 5,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Visados incluidos",
      description:
        "Los costos de visados del Colegio de Profesionales del Ambiente de Neuquén están incluidos en esta Oferta Técnica Económica.",
      category: "Incluye",
      order: 6,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Acuerdo de Trabajo (12 meses)",
      description:
        "La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a doce (12) meses, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo periodo con nuevos objetivos.",
      category: "Plazos",
      order: 7,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Acuerdo de Trabajo (6 meses)",
      description:
        "La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a seis (6) meses, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo periodo con nuevos objetivos.",
      category: "Plazos",
      order: 8,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Facturación Tipo A",
      description: "La Facturación Tipo A del servicio es mensual.",
      category: "Facturación",
      order: 9,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "IVA no incluido",
      description: "El presente presupuesto no incluye IVA.",
      category: "Facturación",
      order: 10,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Facturación Tipo C",
      description: "La Facturación Tipo C del servicio es mensual.",
      category: "Facturación",
      order: 11,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Condición de Pago 30 días",
      description: "La condición de pago es a 30 días.",
      category: "Condiciones de Pago",
      order: 12,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Condiciones de Pago",
      description:
        "Las condiciones de pago son a contra factura y contra entrega del Informe Ambiental.",
      category: "Condiciones de Pago",
      order: 13,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Ajuste Trimestral 10%",
      description:
        "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 10%.",
      category: "Ajuste",
      order: 14,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Ajuste Trimestral 12%",
      description:
        "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 12%.",
      category: "Ajuste",
      order: 15,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Ajuste Trimestral 15%",
      description:
        "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 15%.",
      category: "Ajuste",
      order: 16,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Ajuste Trimestral 20%",
      description:
        "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 20%.",
      category: "Ajuste",
      order: 17,
      is_active: true,
    },
    {
      tipo: CondicionTipo.particular,
      title: "Ajuste Trimestral IPC",
      description:
        "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral por IPC.",
      category: "Ajuste",
      order: 18,
      is_active: true,
    },
  ];

  // Insert condiciones generales
  for (const condicion of condicionesGenerales) {
    await prisma.condicion.create({
      data: condicion,
    });
  }
  console.log(`✅ ${condicionesGenerales.length} condiciones generales creadas`);

  // Insert condiciones particulares
  for (const condicion of condicionesParticulares) {
    await prisma.condicion.create({
      data: condicion,
    });
  }
  console.log(`✅ ${condicionesParticulares.length} condiciones particulares creadas`);

  console.log("✨ Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
