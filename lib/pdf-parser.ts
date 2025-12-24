export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { PDFParse } = require('pdf-parse');

        if (!PDFParse) {
            throw new Error("PDFParse class not found in exports. Ensure pdf-parse v2+ is installed.");
        }

        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();

        console.log(`DEBUG: Extracted text length: ${result.text.length}`);

        return result.text;
    } catch (error) {
        console.error("Error parsing PDF FULL ERROR:", error);
        throw new Error("Failed to parse PDF: " + (error instanceof Error ? error.message : String(error)));
    }
}
