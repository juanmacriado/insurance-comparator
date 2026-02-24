'use server';
// Optimization: Multi-step processing to bypass Vercel 4.5MB payload limit.

import { compareAIAnalyses, ComparisonReport } from "@/lib/comparator";
import { analyzePolicyWithAI, PolicyAnalysis } from "@/lib/ai-analyzer";

/**
 * Directly analyzes a PDF file using AI without pre-extracting text.
 */
export async function analyzePDFAction(formData: FormData): Promise<PolicyAnalysis> {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("No se ha proporcionado ningún archivo.");

        console.log(`[ACTION] Direct AI Analysis for: ${file.name} (${file.size} bytes)`);

        const buffer = Buffer.from(await file.arrayBuffer());
        const analysis = await analyzePolicyWithAI(buffer);

        console.log(`[ACTION] Analysis successful for ${file.name}`);
        return analysis;
    } catch (error) {
        console.error("[ACTION] Error in analyzePDFAction:", error);
        throw new Error(error instanceof Error ? error.message : "Error al analizar el PDF con IA.");
    }
}

/**
 * Compares N extracted texts using AI.
 */
/**
 * Generates a comparison report from pre-analyzed policy data.
 */
export async function getComparisonReportAction(analyses: PolicyAnalysis[], policyNames: string[]): Promise<ComparisonReport> {
    try {
        console.log(`[ACTION] Generating comparison report for ${analyses.length} policies.`);
        return compareAIAnalyses(analyses, policyNames);
    } catch (error) {
        console.error("[ACTION] Error generating report:", error);
        throw new Error(error instanceof Error ? error.message : "Error al generar el informe comparativo.");
    }
}
