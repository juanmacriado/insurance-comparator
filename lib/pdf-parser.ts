// Polyfill DOMMatrix for pdf-parse v2 in Node.js environment
// Important: This must be defined before any pdf-parse code is evaluated.
const polyfillDOMMatrix = () => {
    if (typeof (globalThis as any).DOMMatrix === 'undefined') {
        try {
            // Try to get it from @napi-rs/canvas which is already a dependency
            const { DOMMatrix } = require('@napi-rs/canvas');
            (globalThis as any).DOMMatrix = DOMMatrix;
            (global as any).DOMMatrix = DOMMatrix;
        } catch (e) {
            console.warn("Failed to load DOMMatrix from @napi-rs/canvas, using dummy polyfill");
            const dummy = class DOMMatrix {
                a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
                m11 = 1; m12 = 0; m13 = 0; m14 = 0;
                m21 = 0; m22 = 1; m23 = 0; m24 = 0;
                m31 = 0; m32 = 0; m33 = 1; m34 = 0;
                m41 = 0; m42 = 0; m43 = 0; m44 = 1;
                is2D = true; isIdentity = true;
                constructor() { }
                static fromMatrix() { return new DOMMatrix(); }
                static fromFloat32Array() { return new DOMMatrix(); }
                static fromFloat64Array() { return new DOMMatrix(); }
            };
            (globalThis as any).DOMMatrix = dummy;
            (global as any).DOMMatrix = dummy;
        }
    }
};

polyfillDOMMatrix();

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
