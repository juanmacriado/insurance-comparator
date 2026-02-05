import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AnalysisResult, PostVariation, PostVariationSchema } from './types';

export const VariationsRequestSchema = z.object({
    variations: z.array(PostVariationSchema)
});

export async function generateVariations(analysis: AnalysisResult, count: number = 3): Promise<PostVariation[]> {
    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: VariationsRequestSchema,
        system: `You are a Social Media Content Generator for Xeoris (Cyber Insurance).
        Based on the provided analysis of a news item, generate ${count} DISTINCT post variations for LinkedIn.
        
        VARIATION ANGLES TO GENERATE:
        1. Educational/Analytical: Focus on "What happened and why it matters".
        2. Urgent/Risk-Focused: Focus on "This could happen to you, protect yourself".
        3. Professional/Corporate: Focus on "Business continuity and resilience".
        
        GUIDELINES:
        - Target Audience: CIOs, CISOs, CEO, Business Owners in Spain.
        - Tone: Professional, authoritative, but engaging.
        - Language: SPANISH.
        - Branding: Subtly mention Xeoris or Cyber Insurance as the solution.
        
        INPUT ANALYSIS:
        Topic: ${analysis.topic}
        Facts: ${analysis.keyFacts.join('; ')}
        Tone: ${analysis.tone}`,
        prompt: `Generate ${count} LinkedIn post variations based on this analysis.`
    });

    return object.variations;
}
