import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for the extracted data
const PolicyCoverageSchema = z.object({
    category: z.enum([
        'Cobertura Ransomware',
        'Responsabilidad Civil',
        'Fraude del CEO / Phishing',
        'Restauración de Datos',
        'Multas y Sanciones',
        'Pérdida de Beneficios',
        'Gestión de Incidentes',
        'Other'
    ]),
    isPresent: z.boolean(),
    details: z.string().describe('Short summary of the coverage details found. If not present, say "Not found"'),
    amount: z.string().describe('The monetary limit (Capital) for this coverage, e.g., "500.000€". Use "N/A" if not found.'),
    deductible: z.string().describe('The deductible (Franquicia) amount, e.g., "1.000€". Use "N/A" if not found.')
});

const PolicyAnalysisSchema = z.object({
    coverages: z.array(PolicyCoverageSchema)
});

export type PolicyAnalysis = z.infer<typeof PolicyAnalysisSchema>;

export async function analyzePolicyWithAI(text: string): Promise<PolicyAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    // Truncate text if it's too long to avoid token limits (optimistic 50k chars)
    const truncatedText = text.substring(0, 50000);

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: PolicyAnalysisSchema,
        system: `You are an expert insurance underwriter specializing in Cyber Insurance policies. 
    Analyze the provided policy text and extract coverage details, limits (Capital), and deductibles (Franquicia) for the specified categories.
    Be precise with amounts. If a coverage is not explicitly mentioned, mark isPresent as false.
    Normalize amounts to a consistent format (e.g., "500.000€") if possible.`,
        prompt: `Analyze the following policy text:\n\n${truncatedText}`,
    });

    return object;
}
