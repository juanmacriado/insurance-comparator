import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { NewsItem } from './types';

export async function scrapeUrl(url: string): Promise<NewsItem> {
    try {
        console.log(`[Scraper] Fetching: ${url}`);

        // 1. Fetch
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const html = await response.text();

        // 2. Parse DOM
        const dom = new JSDOM(html, { url });

        // 3. Extract content with Readability
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error('Readability failed to parse article');
        }

        // 4. Return Normalized Data
        return {
            url,
            title: article.title || "",
            source: article.siteName || new URL(url).hostname,
            content: article.textContent || "", // Clean text
            publishedTime: dom.window.document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || undefined,
            scrapedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`[Scraper] Error processing ${url}:`, error);
        throw error;
    }
}
