import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { AnalysisResult, AnalysisResultSchema } from './types';

export async function analyzeNewsContent(content: string): Promise<AnalysisResult> {
    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: AnalysisResultSchema,
        system: `You are an expert News Analyst for a Cybersecurity Insurance firm.
        Your goal is to "understand" the provided news text deeply to prepare it for content generation.
        
        EXTRACT:
        - Topic: The core subject.
        - Key Facts: 3-5 bullet points of the most critical info.
        - Entities: Who involved? (Attackers, Victims, Tech).
        - Tone: Is it scary? educational? dry?
        
        SUMMARIZE:
        - A concise summary (max 3 sentences).
        
        Language: Response must be in SPANISH.`,
        prompt: `Analyze this news content:\n\n${content.substring(0, 20000)}` // Limit context
    });

    return object;
}
