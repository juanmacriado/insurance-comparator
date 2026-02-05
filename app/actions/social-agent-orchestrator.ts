'use server';

import { scrapeUrl } from "@/lib/social-agent/scraper";
import { analyzeNewsContent } from "@/lib/social-agent/analyzer";
import { generateVariations } from "@/lib/social-agent/generator";
import { generatePlatformSpecificContent, PlatformContent } from "@/lib/social-agent/platform-generator";
import { generateImageFromPrompt } from "@/lib/social-agent/image-generator"; // New import
import { ProcessedNews } from "@/lib/social-agent/types";
import { AnalysisResult } from "@/lib/social-agent/types";
import { getPrompts, savePrompt, deletePrompt, SavedPrompt } from "@/lib/social-agent/prompts-db";

// --- STEP 1: Process URL to get Analysis & Initial Variations ---
export async function processNewsUrlAction(url: string): Promise<ProcessedNews> {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing API Key");

    // 1. Scrape & Clean
    const newsItem = await scrapeUrl(url);

    // 2. Comprehension Analysis
    const analysis = await analyzeNewsContent(newsItem.content);

    // 3. Generate High-Level Variations (Just the concepts/hooks for selection)
    const variations = await generateVariations(analysis);

    return {
        id: Math.random().toString(36).substring(7),
        original: newsItem,
        analysis,
        variations
    };
}

// --- STEP 2: Generate Final Platform Content based on Selection ---
export async function generateFinalContentAction(
    analysis: AnalysisResult,
    variationAngle: string,
    audience: string,
    customInstructions?: string,
    targetPlatform?: 'blog' | 'linkedin' | 'twitter' | 'instagram'
): Promise<PlatformContent> {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing API Key");

    return generatePlatformSpecificContent(analysis, variationAngle, audience, customInstructions, targetPlatform);
}

// --- STEP 3: Generate Image (On Demand) ---
export async function generateImageAction(prompt: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing API Key");
    return generateImageFromPrompt(prompt);
}

// --- PROMPT MANAGEMENT ACTIONS ---

export async function getSavedPromptsAction(): Promise<SavedPrompt[]> {
    return getPrompts();
}

export async function savePromptAction(name: string, content: string): Promise<void> {
    await savePrompt(name, content);
}

export async function deletePromptAction(id: number): Promise<void> {
    await deletePrompt(id);
}
