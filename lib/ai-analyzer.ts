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
    'Ecrime / Suplantación de Identidad'
] as const;

export type CoverageCategory = typeof CoverageCategories[number];

const PolicyCoverageSchema = z.object({
    category: z.string().describe('The name of the coverage block'),
    isPresent: z.boolean().describe('Whether this coverage is mentioned in the policy'),
    details: z.string().describe('Detailed but concise summary in SPANISH.'),
    amount: z.string().describe('The monetary limit (Capital) for this coverage, e.g., "500.000€". Use "N/A" if not found.'),
    deductible: z.string().describe('The deductible (Franquicia) amount, e.g., "1.000€" or "24 horas". Use "N/A" if not found.'),
    scope: z.string().describe('Territorial scope (ámbito territorial) or scope of application in SPANISH.')
});

const PolicyAnalysisSchema = z.object({
    netPremium: z.string().describe('The net premium (Prima Neta) of the policy, e.g., "1.200,50€". Use "N/A" if not found.'),
    totalPremium: z.string().describe('The total premium including taxes (Prima Total), e.g., "1.450,00€". Use "N/A" if not found.'),
    coverages: z.array(PolicyCoverageSchema)
});

export type PolicyAnalysis = z.infer<typeof PolicyAnalysisSchema>;

export async function analyzePolicyWithAI(text: string): Promise<PolicyAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    // Process first 100k chars for high-quality context
    const truncatedText = text.substring(0, 100000);

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: PolicyAnalysisSchema,
        system: `Eres un experto suscriptor de seguros especializado en Ciberseguridad. 
    TU RESPUESTA DEBE SER EXCLUSIVAMENTE EN ESPAÑOL. NO USES INGLÉS EN LOS DETALLES NI EN EL ÁMBITO.
    
    Analiza la póliza y extrae la información de PRIMAS y las 9 categorías de cobertura solicitadas.

    PREMIUMS TO EXTRACT:
    - Prima Neta (Net Premium)
    - Prima Total (Total Premium with taxes)

    CATEGORÍAS A ANALIZAR:
    1. Servicios de Respuesta a incidentes: Servicios forestenses, legales, etc. Ámbito territorial y franquicia.
    2. Gastos de Mitigación: Gastos para aminorar daños.
    3. Pérdida de Beneficios: Interrupción de negocio. cantidad, franquicia y ámbito.
    4. Extorsión Cibernética: Ransomware, amenazas.
    5. Gastos de Recuperación de Datos y Sistemas: Restauración.
    6. Protección de Equipos: Hardware y activos fijos.
    7. Responsabilidad Tecnológica / Responsabilidad Civil: Demandas de terceros.
    8. Fraude Tecnológico: Transferencias fraudulentas.
    9. Ecrime / Suplantación de Identidad: Phishing activo, robo de identidad.

    Reglas:
    - RESPONDE SIEMPRE EN ESPAÑOL.
    - Captura con precisión los límites (Capital) y franquicias.
    - Extrae el ámbito territorial (España, UE, Mundial, etc.).
    - Si no encuentras una cobertura, marca isPresent: false.
    - Normaliza importes (p.ej. "1.000.000€").`,
        prompt: `Analiza este texto de póliza de seguro y extrae los datos solicitados en ESPAÑOL:\n\n${truncatedText}`,
    });

    return object;
}
