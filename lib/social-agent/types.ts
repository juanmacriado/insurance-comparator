import { z } from 'zod';

// Layer 1: Raw Output from Scraper
export const NewsItemSchema = z.object({
    url: z.string().url(),
    title: z.string(),
    source: z.string().optional(),
    content: z.string(), // Extracted main text
    publishedTime: z.string().optional(),
    scrapedAt: z.string() // ISO Date
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export interface SavedPrompt {
    id: number;
    name: string;
    content: string;
    created_at: Date;
}

// Layer 3: Comprehension Analysis
export const AnalysisResultSchema = z.object({
    topic: z.string().describe('Main subject of the news'),
    keyFacts: z.array(z.string()).describe('List of crucial facts derived from the text'),
    entities: z.array(z.string()).describe('People, organizations, or tech mentioned'),
    tone: z.string().describe('Detected tone (e.g. alarming, informative, technical)'),
    summary: z.string().describe('Brief summary of the content'),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// Layer 6: Generated Variation
export const PostVariationSchema = z.object({
    angle: z.string().describe('The angle or style used (e.g. Educational, Alarmist)'),
    headline: z.string(),
    body: z.string(),
    hashtags: z.array(z.string()),
    callToAction: z.string().describe('The CTA used'),
});
export type PostVariation = z.infer<typeof PostVariationSchema>;

// Container for the UI
export interface ProcessedNews {
    id: string;
    original: NewsItem;
    analysis: AnalysisResult;
    variations: PostVariation[];
}
