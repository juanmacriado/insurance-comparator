

import OpenAI from 'openai';

export async function generateImageFromPrompt(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAI({ apiKey });

    // Enhanced Prompt Engineering for Xeoris Style
    const enhancedPrompt = `
    A realistic, high-quality, professional photograph or highly detailed realistic 3D render suitable for a corporate cybersecurity blog or LinkedIn post.
    
    MANDATORY BRANDING: The image MUST clearly and professionally display the text "Xeoris", "Ciberseguro Xeoris", "Protección Xeoris", or "Airbag Xeoris". The text should be integrated naturally (e.g., on a glass wall, a digital screen, a folder, or a neon sign in the background).

    Subject: ${prompt}
    Style: Professional, sharp focus, cinematic lighting, corporate, trustworthy, cybersecurity context. 
    Colors: Dark blues, slate greys, and touches of yellow/gold (brand colors).
    Avoid: Cartoonish, low poly, abstract scribbles, messy text (except for the brand name).
    `;

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url"
        });

        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) throw new Error("No image generated");

        return imageUrl;

    } catch (error) {
        console.error("DALL-E Generation Error:", error);
        throw new Error("Failed to generate image.");
    }
}
