import * as cheerio from 'cheerio';
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

        // 2. Parse with Cheerio
        const $ = cheerio.load(html);

        // 3. Extract Metadata
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;
        const publishedTime = $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="date"]').attr('content');

        // 4. Extract Content (Smart Text Extraction)
        // Remove unwanted elements
        $('script, style, nav, footer, header, aside, .ads, .comment, .menu').remove();

        // Try to find the main article container first
        let content = '';
        const selectors = ['article', 'main', '.post-content', '.entry-content', '#content', 'body'];

        for (const selector of selectors) {
            if ($(selector).length > 0) {
                // Get all paragraphs within this container
                content = $(selector).find('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
                if (content.length > 200) break; // If we found substantial content, stop
            }
        }

        return {
            url,
            title: title.trim(),
            source: siteName,
            content: content || "",
            publishedTime: publishedTime,
            scrapedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`[Scraper] Error processing ${url}:`, error);
        throw error;
    }
}
