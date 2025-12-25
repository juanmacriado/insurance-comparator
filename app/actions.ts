'use server';
// Optimization: Multi-step processing to bypass Vercel 4.5MB payload limit.

import { extractTextFromPDF } from "@/lib/pdf-parser";
import { compareAIAnalyses, ComparisonReport } from "@/lib/comparator";
import { analyzePolicyWithAI } from "@/lib/ai-analyzer";

/**
 * Extracts text from a single PDF file passed via FormData.
 */
export async function extractTextAction(formData: FormData): Promise<string> {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("No se ha proporcionado ningún archivo.");

        console.log(`[ACTION] Extracting text from: ${file.name} (${file.size} bytes)`);

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await extractTextFromPDF(buffer);

        console.log(`[ACTION] Extraction successful: ${text.length} characters.`);
        return text;
    } catch (error) {
        console.error("[ACTION] Error extracting text:", error);
        throw new Error(error instanceof Error ? error.message : "Error al extraer texto del PDF.");
    }
}

/**
 * Compares N extracted texts using AI.
 */
export async function compareTextsAction(texts: string[], policyNames: string[]): Promise<ComparisonReport> {
    try {
        console.log(`[ACTION] Comparing ${texts.length} policy texts.`);

        if (process.env.OPENAI_API_KEY) {
            try {
                const analyses = await Promise.all(
                    texts.map(text => analyzePolicyWithAI(text))
                );
                return compareAIAnalyses(analyses, policyNames);
            } catch (error) {
                console.error("[ACTION] AI Analysis failed:", error);
                throw new Error("El análisis de IA falló en una o más pólizas.");
            }
        } else {
            throw new Error("OPENAI_API_KEY no configurada.");
        }
    } catch (error) {
        console.error("[ACTION] Error in comparison:", error);
        throw new Error(error instanceof Error ? error.message : "Error al comparar los textos.");
    }
}
