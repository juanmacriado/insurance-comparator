'use server';
// Optimization: Multi-step processing to bypass Vercel 4.5MB payload limit.

import { extractTextFromPDF } from "@/lib/pdf-parser";
import { comparePolicies, compareAIAnalyses, ComparisonReport } from "@/lib/comparator";
import { analyzePolicyWithAI } from "@/lib/ai-analyzer";

/**
 * Extracts text from a single PDF file passed via FormData.
 * This allows uploading one file at a time to stay under Vercel's 4.5MB payload limit.
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
 * Compares two already extracted texts.
 * Minimal payload, safe for Vercel.
 */
export async function compareTextsAction(text1: string, text2: string): Promise<ComparisonReport> {
    try {
        console.log(`[ACTION] Comparing texts of length ${text1.length} and ${text2.length}`);

        // AI Analysis Path
        if (process.env.OPENAI_API_KEY) {
            try {
                console.log("[ACTION] Starting AI analysis with OpenAI...");
                const [analysis1, analysis2] = await Promise.all([
                    analyzePolicyWithAI(text1),
                    analyzePolicyWithAI(text2)
                ]);
                console.log("[ACTION] AI analysis complete.");
                return compareAIAnalyses(analysis1, analysis2);
            } catch (error) {
                console.error("[ACTION] AI Analysis failed:", error);
                console.log("[ACTION] Falling back to classic extraction logic...");
            }
        }

        // Classic Regex Path
        return comparePolicies(text1, text2);
    } catch (error) {
        console.error("[ACTION] Fatal error in comparison:", error);
        throw new Error(error instanceof Error ? error.message : "Error al comparar los textos.");
    }
}

// Keep the old one for compatibility until UI is updated
export async function processAndComparePDFs(formData: FormData): Promise<ComparisonReport> {
    const file1 = formData.get('file1') as File;
    const file2 = formData.get('file2') as File;

    const buffer1 = Buffer.from(await file1.arrayBuffer());
    const buffer2 = Buffer.from(await file2.arrayBuffer());

    const text1 = await extractTextFromPDF(buffer1);
    const text2 = await extractTextFromPDF(buffer2);

    return compareTextsAction(text1, text2);
}
