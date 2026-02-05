

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AnalysisResult, PostVariation, PostVariationSchema } from './types';

// Decomposed Schemas
const BlogSchema = z.object({
    title: z.string(),
    content: z.string().describe('Extensive, deep-dive article. >1300 words. Structured with clear H2/H3. NO "Introduction" or "Conclusion" labels. Just the content.'),
    seoKeywords: z.array(z.string())
});

const LinkedinSchema = z.object({
    text: z.string().describe('Optimized LinkedIn post. STRICT length (600-900 chars). Disruptive Hook. NO "Conclusion".'),
    hashtags: z.array(z.string())
});

const TwitterSchema = z.object({
    thread: z.array(z.string()).describe('Array of tweets for a thread.'),
    hashtags: z.array(z.string())
});

const InstagramSchema = z.object({
    caption: z.string().describe('Engaging, emoji-rich, shorter caption.'),
    visualPrompt: z.string().describe('Suggestion for the image/graphic to create.'),
    hashtags: z.array(z.string())
});

// Main Schema (Combined) - Made fields optional for potential partial generation if needed, 
// though we will use specific schemas for single requests.
export const PlatformContentSchema = z.object({
    blog: BlogSchema.optional(),
    linkedin: LinkedinSchema.optional(),
    twitter: TwitterSchema.optional(),
    instagram: InstagramSchema.optional()
});

export type PlatformContent = z.infer<typeof PlatformContentSchema>;

export async function generatePlatformSpecificContent(
    analysis: AnalysisResult,
    variationAngle: string,
    audience: string,
    customInstructions?: string,
    targetPlatform?: 'blog' | 'linkedin' | 'twitter' | 'instagram'
): Promise<PlatformContent> {

    // Audience-Specific Nuances
    let audienceContext = "";
    switch (audience) {
        case "technology_partners":
            audienceContext = "Target Audience: IT Resellers & MSPs. Focus on: Adding value to their portfolio, recurring revenue, complementing security services.";
            break;
        case "insurance_brokers":
            audienceContext = "Target Audience: Insurance Brokers. Focus on: Cross-selling opportunities, complexity of cyber risks, protecting their own liability.";
            break;
        case "data_protection":
            audienceContext = "Target Audience: DPOs & Legal compliance experts. Focus on: GDPR fines (RGPD), regulatory compliance (NIS2, DORA), legal defense costs.";
            break;
        default:
            audienceContext = "Target Audience: General Business Owners & CISOs.";
    }

    // LINKEDIN SPECIFIC GUIDELINES
    const linkedinGuidelines = `
    LINKEDIN POST STRUCTURE (STRICT):
    - Length: Ideal 600-900 characters. Absolute limit 3000.
    - HOOK (First 210-240 chars): BREAK THE PATTERN. Disruptive/counter-intuitive.
    - FORMAT: Short sentences. Frequent line breaks.
    - TONE: "Human to Human". Professional but accessible.
    - 1 MAIN IDEA: Don't overwhelm.
    - CLOSING: Soft CTA.
    `;

    // BLOG SEO GUIDELINES
    const blogGuidelines = `
    BLOG SEO INSTRUCTIONS (High Importance):
    - Target Length: 1300-1800 words.
    - Structure: Clear H1 (Topic), H2, H3 hierarchy.
    - Readability: Short paragraphs (2-3 lines). Lists.
    - Focus: DEPTH, Examples, Context.
    - EEAT: Demonstrate expertise.
    `;

    // HUMAN-LIKE WRITING GUIDELINES (STRICTER)
    const writingGuidelines = `
    CRITICAL HUMAN-WRITING INSTRUCTIONS:
    - FORRBIDDEN: Do NOT use "Conclusion", "In conclusion", "To summarize", "Resumen", "Conclusión". Just end the post naturally.
    - AVOID typical AI patterns like "In the digital world", "It is crucial to remember".
    - BE DIRECT and PUNCHY.
    - TONE: "Xeoris" (Expert, secure, slightly provocative).
    - ORIGINALITY: Use metaphors, rhetorical questions, or industry-specific contrarian views.
    `;

    // Determine Schema and Prompt based on Target
    let activeSchema: any = PlatformContentSchema;
    let specificPrompt = `Generate content for ALL platforms (Blog, LinkedIn, Twitter, Instagram) for angle "${variationAngle}".`;

    if (targetPlatform) {
        if (targetPlatform === 'blog') {
            activeSchema = z.object({ blog: BlogSchema });
            specificPrompt = `Generate ONLY the BLOG POST for angle "${variationAngle}".`;
        } else if (targetPlatform === 'linkedin') {
            activeSchema = z.object({ linkedin: LinkedinSchema });
            specificPrompt = `Generate ONLY the LINKEDIN POST for angle "${variationAngle}".`;
        } else if (targetPlatform === 'twitter') {
            activeSchema = z.object({ twitter: TwitterSchema });
            specificPrompt = `Generate ONLY the TWITTER THREAD for angle "${variationAngle}".`;
        } else if (targetPlatform === 'instagram') {
            activeSchema = z.object({ instagram: InstagramSchema });
            specificPrompt = `Generate ONLY the INSTAGRAM CONTENT for angle "${variationAngle}".`;
        }
    }

    // ANTI-REPETITION & DIVERSITY SYSTEM PROMPT
    const systemPrompt = `
    [SYSTEM / ROL]
    You are a professional content strategist and writer for Xeoris (Cybersecurity Insurance).
    Your goal is to create ORIGINAL, ENGAGING, and COHERENT content for a specific audience: "${audienceContext}".
    You must avoid repeating phrases, structures, or ideas from generic AI outputs.
    CRITICAL: ALL OUTPUT MUST BE IN SPANISH (Castilian).

    [TASK]
    Reference Info:
    - Topic: ${analysis.topic}
    - Key Facts: ${analysis.keyFacts.join('; ')}
    - Tone: ${analysis.tone}
    - Summary: ${analysis.summary}

    TARGET ANGLE: "${variationAngle}"

    [DIVERSITY RULES]
    - Avoid repeating words and literal structures.
    - Vary paragraph and sentence length.
    - Change the order of ideas.
    - Use creative synonyms and reformulations.
    
    [PLATFORM GUIDELINES]
    ${linkedinGuidelines}
    ${blogGuidelines}
    ${writingGuidelines}

    [CUSTOM INSTRUCTIONS]
    ${customInstructions || "No custom instructions provided. Follow standard Xeoris voice."}
    `;

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: activeSchema,
        system: systemPrompt,
        prompt: specificPrompt,
        temperature: 0.8,
        presencePenalty: 0.8,
        frequencyPenalty: 0.5
    });

    return object as unknown as PlatformContent;
}
