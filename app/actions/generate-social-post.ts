'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const SocialPostSchema = z.object({
    headline: z.string().describe('A catchy, professional headline for the post.'),
    body: z.string().describe('The main content of the post, professional yet engaging, suitable for LinkedIn.'),
    hashtags: z.array(z.string()).describe('List of relevant hashtags.'),
    platformTips: z.string().describe('Short tip on how to best publish this (e.g. "Add an image of a lock").')
});

export type SocialPost = z.infer<typeof SocialPostSchema>;

export async function generateSocialPostAction(input: string, tone: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY");
    }

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: SocialPostSchema,
        system: `You are an expert Social Media Manager for 'Xeoris', a specialized Cybersecurity Insurance provider.
        Your goal is to take external news/inputs and rewrite them into engaging social media posts (focus on LinkedIn) that highlight the importance of Cyber Insurance.
        
        Tone: ${tone}
        Language: Spanish (unless input is heavily English, but output should target Spanish market).
        
        Guidelines:
        - Professional but accessible.
        - Highlight risk and the solution (Xeoris/Insurance).
        - Use emojis moderately.
        - Structure: Hook -> Value/Insight -> Call to Action (Protect yourself with Xeoris).`,
        prompt: `Generate a social media post based on this news/input:\n\n${input}`
    });

    return object;
}
