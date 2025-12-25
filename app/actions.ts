'use server';
// Optimization: Increased payload limits and enhanced PDF extraction stability. Sync: 2025-12-25 22:00

import { extractTextFromPDF } from "@/lib/pdf-parser";
import { comparePolicies, compareAIAnalyses, ComparisonReport } from "@/lib/comparator";
import { analyzePolicyWithAI } from "@/lib/ai-analyzer";

export async function processAndComparePDFs(formData: FormData): Promise<ComparisonReport> {
    try {
        const file1 = formData.get('file1') as File;
        const file2 = formData.get('file2') as File;

        console.log(`[ACTION] Received files: ${file1?.name} (${file1?.size} bytes), ${file2?.name} (${file2?.size} bytes)`);

        if (!file1 || !file2) {
            throw new Error("Faltan archivos por subir.");
        }

        console.log("[ACTION] Converting to buffers...");
        const buffer1 = Buffer.from(await file1.arrayBuffer());
        const buffer2 = Buffer.from(await file2.arrayBuffer());

        console.log("[ACTION] Extracting text from PDF 1...");
        const text1 = await extractTextFromPDF(buffer1);
        console.log(`[ACTION] Text 1 extracted (${text1.length} chars)`);

        console.log("[ACTION] Extracting text from PDF 2...");
        const text2 = await extractTextFromPDF(buffer2);
        console.log(`[ACTION] Text 2 extracted (${text2.length} chars)`);

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
                // Fallthrough to classic extraction logic
                console.log("[ACTION] Falling back to classic extraction logic...");
            }
        } else {
            console.log("[ACTION] No OPENAI_API_KEY found, using classic extraction.");
        }

        // Classic Regex Path
        return comparePolicies(text1, text2);
    } catch (error) {
        console.error("[ACTION] Fatal error in processAndComparePDFs:", error);
        throw new Error(error instanceof Error ? error.message : "Error inesperado al procesar los documentos.");
    }
}
