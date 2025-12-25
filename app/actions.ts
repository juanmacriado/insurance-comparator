'use server';
// Cache bust: 2025-12-25 21:15

import { extractTextFromPDF } from "@/lib/pdf-parser";
import { comparePolicies, compareAIAnalyses, ComparisonReport } from "@/lib/comparator";
import { analyzePolicyWithAI } from "@/lib/ai-analyzer";

export async function processAndComparePDFs(formData: FormData): Promise<ComparisonReport> {
    const file1 = formData.get('file1') as File;
    const file2 = formData.get('file2') as File;

    if (!file1 || !file2) {
        throw new Error("Missing files");
    }

    const buffer1 = Buffer.from(await file1.arrayBuffer());
    const buffer2 = Buffer.from(await file2.arrayBuffer());

    const text1 = await extractTextFromPDF(buffer1);
    const text2 = await extractTextFromPDF(buffer2);

    // AI Analysis Path
    if (process.env.OPENAI_API_KEY) {
        try {
            console.log("Starting AI analysis...");
            const [analysis1, analysis2] = await Promise.all([
                analyzePolicyWithAI(text1),
                analyzePolicyWithAI(text2)
            ]);
            console.log("AI analysis complete.");
            return compareAIAnalyses(analysis1, analysis2);
        } catch (error) {
            console.error("AI Analysis failed, falling back to classic extraction:", error);
            // Fallthrough to manual extraction logic
        }
    }

    // Classic Regex Path
    return comparePolicies(text1, text2);
}
