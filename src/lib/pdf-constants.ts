// Constantes para el PDF de propuestas
export const SINERGIA_CONTACT = {
    email: 'info@sinergiaambiental.com.ar',
    phones: ['(54) 299-4730768', '299-4193381'],
    address: 'Ing. Silvio Tosello 1531 - Neuquén'
}

export const PDF_COLORS = {
    primary: '#2398A1',
    secondary: '#84B631',
    darkBlue: '#02334b',
    textDarkBlue: '#02334b',
    lightGray: '#efefef',
    cream: '#d4cfcb',
    darkGray: '#c6c6c6',
    yellow: '#FFE082', // Para resaltar datos faltantes
    white: '#FFFFFF',
    textDark: '#333333'
}

export interface CondicionesParticulares {
    id: number 
    type: string
    title: string
    description: string
}

export const CONSIDERACIONES_GENERALES = [
    'Las tareas serán efectuadas por profesionales inscriptos en el Registro Provincial de Prestadores de Servicios Ambientales (RePPSA) y matriculados en el Colegio Profesional de Ambiente de la Provincia de Neuquén (CPAN).',
    'Los costos de sellados y tasas que surjan de dependencias públicas y/o privadas, quedan exceptuadas de este presupuesto.',
    'Los valores en pesos argentinos consignados en la presente propuesta quedan sujetos a incremento según el aumento de costos o inflación, en cuyo caso se reanalizará con la empresa.',
    'Los valores establecidos en esta propuesta son fijados de acuerdo a lo establecido por la tabla de honorarios profesionales sugerida por el Colegio de Profesionales del Ambiente de Neuquén (CPAN).',
    'Esta Propuesta tiene validez por 10 días desde la fecha indicada en el encabezado.'
]

export const NOTAS_PIE = [
    'NOTA 1: LOS VALORES ESTABLECIDOS EN ESTA PROPUESTA SON FIJADOS DE ACUERDO A LO ESTABLECIDO POR LA TABLA DE HONORARIOS PROFESIONALES SUGERIDA POR EL COLEGIO DE PROFESIONALES DEL AMBIENTE DE NEUQUÉN (CPAN).',
    'NOTA 2: LOS VALORES PRECEDENTES NO INCLUYEN IVA.',
    'NOTA 3: EL VALOR COTIZADO EN EL PRESENTE PRESUPUESTO TENDRÁ UN AJUSTE TRIMESTRAL DEL 20%.'
]

const SACADOS = [
    'El servicio considera una (1) visita mensual, la cuál será establecida en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.',
        'La confección de Estudios de Impacto Ambiental, Auditorías Ambientales e Informes Ambientales no están incluidos en la presente Oferta Técnica Económica. Los mismos pueden solicitarse en un presupuesto independiente.',
    'La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a DOCE MESES, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo período con nuevos objetivos.',
    'La Facturación Tipo A del servicio es mensual. Los valores en pesos argentinos consignados en la presente propuesta quedan sujetos a incremento según el aumento de costos o inflación, en cuyo caso se reanalizará con la empresa.',
    'Las condiciones de pago son a 30 días.',

]

export const CONDICIONES_PARTICULARES: CondicionesParticulares[] = [
    {
        id: 1,
        type: 'Visitas',
        title: 'Visita mensual (1)',
        description: 'El servicio considera una (1) actividad ambiental mensual, las cuales estarán establecidas en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.'
    },
    {
        id: 2,
        type: 'Visitas',
        title: 'Visita mensual (2)',
        description: 'El servicio considera dos (2) actividades ambientales mensuales, las cuales estarán establecidas en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.'
    },
    {
        id: 3,
        type: 'Incluye',
        title: 'Estudios no incluidos',
        description: 'La confección de Estudios de Impacto Ambiental, Auditorías Ambientales e Informes Ambientales no están incluidos en la presente Oferta Técnica Económica. Los mismos pueden solicitarse en un presupuesto independiente.'
    },
    {
        id: 4,
        type: 'Plazos',
        title: 'Plazo de entrega (30 días)',
        description: 'El plazo de entrega del Estudio / Informe / Auditoría Ambiental es de 30 días hábiles a partir de la fecha de aprobación de la presente Oferta Técnica.'
    },
    {
        id: 5,
        type:'Incluye',
        title: 'Incluye ampliaciones',
        description: 'El costo total de la propuesta incluye las ampliaciones y otras solicitudes que pudieran surgir por la autoridad de aplicación respecto a lo presentado.'
    },
    {
        id: 6,
        type: 'Incluye',
        title: 'Visados incluidos',
        description: 'Los costos de visados del Colegio de Profesionales del Ambiente de Neuquén están incluidos en esta Oferta Técnica Económica.'
    },
    {
        id: 7,
        type: 'Plazos',
        title: 'Acuerdo de Trabajo (12 meses)',
        description: 'La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a doce (12) meses, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo periodo con nuevos objetivos.'
    },
    {
        id: 8,
        type:'Plazos',
        title: 'Acuerdo de Trabajo (6 meses)',
        description: 'La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a seis (6) meses, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo periodo con nuevos objetivos.'
    },
    {
        id: 9,
        type: 'Facturación',
        title: 'Facturación Tipo A',
        description: 'La Facturación Tipo A del servicio es mensual. '
    },
    {
        id: 10,
        type: 'Facturación',
        title: 'IVA no incluido',
        description: 'El presente presupuesto no incluye IVA.'
    },
    {
        id: 11,
        type: 'Facturación',
        title: 'Facturación Tipo C',
        description: 'La Facturación Tipo C del servicio es mensual.'
    },
    {
        id: 12,
        type: 'Condiciones de Pago',
        title: 'Condición de Pago 30 días',
        description: 'La condición de pago es a 30 días.'
    },
    {
        id: 13,
        type:'Condiciones de Pago',
        title: 'Condiciones de Pago',
        description: 'Las condiciones de pago son a contra factura y contra entrega del Informe Ambiental.'
    },
    {
        id: 14,
        type: 'Ajuste',
        title: "Ajuste Trimestral 10%",
        description: "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 10"
    },
    {
        id: 15,
        type: 'Ajuste',
        title: "Ajuste Trimestral 20%",
        description: "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 20"
    },
    {
        id: 16,
        type: 'Ajuste',
        title: "Ajuste Trimestral IPC",
        description: "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral por IPC"
    }

]