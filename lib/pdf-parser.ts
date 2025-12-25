export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const pdf = require('pdf-parse');

        // pdf-parse v1 is a function that returns a promise
        const data = await pdf(buffer);

        console.log(`DEBUG: Extracted text length: ${data.text.length}`);

        return data.text;
    } catch (error) {
        console.error("Error parsing PDF FULL ERROR:", error);
        throw new Error("Failed to parse PDF: " + (error instanceof Error ? error.message : String(error)));
    }
}
