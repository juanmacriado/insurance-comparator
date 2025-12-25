export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { PdfReader } = require('pdfreader');

        return new Promise((resolve, reject) => {
            let extractedText = "";
            let currentPage = 0;
            const MAX_PAGES = 12;

            new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
                if (err) {
                    console.error("Error parsing PDF with pdfreader:", err);
                    reject(new Error("Failed to parse PDF with pdfreader: " + err.message));
                } else if (!item) {
                    // End of file
                    resolve(extractedText);
                } else if (item.page) {
                    currentPage = item.page;
                    // If we exceed the limit, we can stop parsing.
                    // However, pdfreader doesn't have a direct 'stop' method easily accessible in the callback
                    // except for throwing or ending the process. 
                    // But we can just skip adding text for pages > MAX_PAGES.
                } else if (item.text) {
                    if (currentPage <= MAX_PAGES) {
                        extractedText += item.text + " ";
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error initializing pdfreader:", error);
        throw new Error("Failed to initialize pdfreader: " + (error instanceof Error ? error.message : String(error)));
    }
}
