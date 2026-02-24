import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for the extracted data
export const CoverageCategories = [
    'Servicios de Respuesta a incidentes',
    'Gastos de Mitigación',
    'Pérdida de Beneficios',
    'Extorsión Cibernética',
    'Gastos de Recuperación de Datos y Sistemas',
    'Protección de Equipos',
    'Responsabilidad Tecnológica / Responsabilidad Civil',
    'Fraude Tecnológico',
    'Ecrime / Suplantación de Identidad',
    'Sanciones Administrativas / Multas',
    'Restitución de la imagen / Reputación',
    'Notificación a los afectados',
    'Defensa Jurídica',
] as const;

export type CoverageCategory = typeof CoverageCategories[number];

const PolicyCoverageSchema = z.object({
    category: z.enum(CoverageCategories).describe('The exact name of the coverage category as defined in the list.'),
    isPresent: z.boolean().describe('Whether this coverage is mentioned in the policy'),
    details: z.string().describe('Detailed but concise summary in SPANISH.'),
    amount: z.string().describe('The monetary limit (Capital) for this coverage, e.g., "500.000€". Use "N/A" if not found.'),
    deductible: z.string().describe('The deductible (Franquicia) amount, e.g., "1.000€" or "24 horas". Use "N/A" if not found.'),
    scope: z.string().describe('Territorial scope (ámbito territorial) or scope of application in SPANISH.')
});

const PolicyAnalysisSchema = z.object({
    netPremium: z.string().describe('The net premium (Prima Neta) of the policy, e.g., "1.200,50€". Use "N/A" if not found.'),
    totalPremium: z.string().describe('The total premium including taxes (Prima Total), e.g., "1.450,00€". Use "N/A" if not found.'),
    coverages: z.array(PolicyCoverageSchema).length(13).describe('You MUST return exactly 13 coverage objects, one for each categorical mapping provided.')
});

export type PolicyAnalysis = z.infer<typeof PolicyAnalysisSchema>;

export async function analyzePolicyWithAI(pdfBuffer: Buffer): Promise<PolicyAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const systemPrompt = `Eres un suscriptor senior de seguros especializado en Ciberriesgos con capacidad de análisis de visión documental avanzada.

    TU MISIÓN: Realizar una lectura EXHAUSTIVA, COMPRENSIVA y PRECISA del documento PDF. Es CRÍTICO que la extracción de datos de las tablas sea exacta. Debes entender que los mismos conceptos se pueden llamar de diferente forma según la aseguradora, pero representan la misma cobertura técnica.

    REGLAS DE ANÁLISIS Y LECTURA:
    1. LÍMITES GENERALES: Al inicio de tu análisis, identifica y establece con claridad los límites generales de la póliza (Capital Asegurado Principal).
    2. MISMA LÍNEA (STRICT LINEARITY): En las tablas de garantías, el límite y la franquicia extraídos deben corresponder EXACTAMENTE a la fila del concepto analizado. No tomes valores de filas superiores o inferiores.
    3. INTERVALOS / RANGOS: Si el documento indica un INTERVALO (ej. "desde 600.000€ hasta 3.000.000€"), refléjalo EXACTAMENTE tal cual aparece. No inventes valores intermedios ni selecciones uno solo.

    REGLAS DE ANÁLISIS SEMÁNTICO Y JERARQUÍA (CASCADA):
    1. EQUIVALENCIAS: 
       - "Protección de Equipos" = "Hardware" / "Daños Materiales".
       - "Responsabilidad Tecnológica" = "Responsabilidad Civil" / "RC Profesional".
       - "Pérdida de Beneficios" = "pérdidas de beneficios" / "Interrupción del negocio" / "Paralización de actividad".
       - "Fraude Tecnológico" = "Fraude por Transferencia de Fondos" / "Robo de identidad digital".
    2. DEFINICIÓN ESPECÍFICA:
       - "Gastos de Mitigación": Incluye aquí gastos misceláneos para minorar el siniestro que NO encajen en otras categorías. IMPORTANTE: NO incluyas aquí costes de procedimientos legales/regulatorios, ni costes forenses o de seguridad informática, ya que estos tienen sus propias categorías específicas.
    3. HERENCIA DE SUB-LÍMITES: Identifica las secciones principales (suelen tener letra destacada, negrita o formato de cabecera). Si una sección principal tiene un SUB-LÍMITE específico (menor que el límite general), todas las subcoberturas que dependan de ella y que indiquen "Incluido" o un "porcentaje", se referirán SIEMPRE al sub-límite de dicha cobertura principal específica.

    REGLAS DE FORMATO Y DATOS:
    - IMPORTES: Refleja fielmente el documento (Valores fijos o Intervalos). Usa siempre el símbolo €.
    - FRANQUICIAS: Expresa en EUROS o TIEMPO (ej. "24 Horas" o "1.000€").
    - DETALLES: Proporciona una explicación técnica resumida en ESPAÑOL del objeto de la cobertura.

    CATEGORÍAS DE MAPEO MANDATORIAS (Debes devolver exactamente estas 13 y MApear todo a ellas):
    1. Servicios de Respuesta a incidentes
    2. Gastos de Mitigación
    3. Pérdida de Beneficios
    4. Extorsión Cibernética
    5. Gastos de Recuperación de Datos y Sistemas
    6. Protección de Equipos
    7. Responsabilidad Tecnológica / Responsabilidad Civil
    8. Fraude Tecnológico
    9. Ecrime / Suplantación de Identidad
    10. Sanciones Administrativas / Multas
    11. Restitución de la imagen / Reputación
    12. Notificación a los afectados
    13. Defensa Jurídica

    REGLA DE ORO: No uses nombres de categorías que no estén en la lista anterior. Si una cobertura está en el documento, debe ser detectada y mapeada correctamente a una de estas 13 categorías basándose en su naturaleza técnica.`;

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: PolicyAnalysisSchema,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: "Analiza este PDF de seguro de ciberseguridad con precisión y comprensión semántica total.\n\n" + systemPrompt
                    },
                    { type: 'file', data: pdfBuffer, mediaType: 'application/pdf' },
                ],
            },
        ],
    });

    return object;
}
