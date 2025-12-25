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
    details: z.string().describe('Detailed but concise summary of the coverage conditions and terms.'),
    amount: z.string().describe('The monetary limit (Capital) for this coverage, e.g., "500.000€". Use "N/A" if not found.'),
    deductible: z.string().describe('The deductible (Franquicia) amount, e.g., "1.000€" or "24 horas". Use "N/A" if not found.'),
    scope: z.string().describe('Territorial scope (ámbito territorial) or scope of application. Mention if it applies to specific regions or assets.')
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

    // Increased truncation limit: 100k chars is enough for most policies (~50-60 pages)
    const truncatedText = text.substring(0, 100000);

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: PolicyAnalysisSchema,
        system: `You are an expert insurance underwriter specializing in Cyber Insurance policies.
    Analyze the provided policy text and extract information for the specific coverage blocks and premiums.
    
    PREMIUMS TO EXTRACT:
    - Prima Neta (Net Premium)
    - Prima Total (Total Premium with taxes)

    COVERAGE BLOCKS TO ANALYZE:
    1. Servicios de Respuesta a incidentes: Focus on response services, territorial scope, and deductibles.
    2. Gastos de Mitigación: Focus on amount and deductible.
    3. Pérdida de Beneficios: Focus on amount, deductible, and territorial scope.
    4. Extorsión Cibernética: Focus on amount and deductible.
    5. Gastos de Recuperación de Datos y Sistemas: Focus on amount and scope of application.
    6. Protección de Equipos: Focus on amount and deductible.
    7. Responsabilidad Tecnológica / Responsabilidad Civil: Focus on amount and scope of application.
    8. Fraude Tecnológico: Focus on amount and deductible.
    9. Ecrime / Suplantación de Identidad: Focus on amount and deductible.

    Rules:
    - For each block, find the corresponding limit (Capital) and deductible (Franquicia).
    - Capture the scope (ámbito territorial o de aplicación) when specified.
    - Be precise with amounts and currencies. 
    - If a coverage is not explicitly mentioned, mark isPresent as false.
    - Normalize amounts to a consistent format (e.g., "1.000.000€").
    - Specifically look for the "Recibo de Prima" or "Desglose de Prima" section for Net and Total amounts.`,
        prompt: `Analyze the following policy text and extract information for the premiums and the 9 coverage blocks mentioned:\n\n${truncatedText}`,
    });

    return object;
}
