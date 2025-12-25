export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { PdfReader } = require('pdfreader');

        return new Promise((resolve, reject) => {
            let extractedText = "";
            new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
                if (err) {
                    console.error("Error parsing PDF with pdfreader:", err);
                    reject(new Error("Failed to parse PDF with pdfreader: " + err.message));
                } else if (!item) {
                    // End of file
                    console.log(`DEBUG: Extracted text length: ${extractedText.length}`);
                    resolve(extractedText);
                } else if (item.text) {
                    extractedText += item.text + " ";
                }
            });
        });
    } catch (error) {
        console.error("Error initializing pdfreader:", error);
        throw new Error("Failed to initialize pdfreader: " + (error instanceof Error ? error.message : String(error)));
    }
}
