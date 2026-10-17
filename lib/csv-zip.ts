/**
 * Utilidades sin dependencias para exportar datos:
 *  - toCSV: CSV pensado para abrirse con doble clic en Excel en español
 *    (separador ';', coma decimal, BOM UTF-8, fechas ISO).
 *  - createZip: ZIP sin compresión (método "store"), suficiente para pocos datos.
 */

const BOM = '﻿';
const SEP = ';';

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return Number.isFinite(value) ? String(value).replace('.', ',') : '';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function escapeCell(text: string): string {
    return /[";\r\n]/.test(text) || /^\s|\s$/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
}

export function toCSV(columns: string[], rows: Record<string, unknown>[]): string {
    const lines = [columns.map(escapeCell).join(SEP)];
    for (const row of rows) {
        lines.push(columns.map(col => escapeCell(formatValue(row[col]))).join(SEP));
    }
    return BOM + lines.join('\r\n') + '\r\n';
}

// --- ZIP -------------------------------------------------------------------

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
}

export function createZip(files: { name: string; content: string }[], date = new Date()): Uint8Array {
    const encoder = new TextEncoder();
    const { time, day } = dosDateTime(date);
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
        const name = encoder.encode(file.name);
        const data = encoder.encode(file.content);
        const crc = crc32(data);

        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);   // firma cabecera local
        lv.setUint16(4, 20, true);           // versión necesaria
        lv.setUint16(6, 0x0800, true);       // nombres en UTF-8
        lv.setUint16(8, 0, true);            // sin compresión
        lv.setUint16(10, time, true);
        lv.setUint16(12, day, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true);
        local.set(name, 30);

        const central = new Uint8Array(46 + name.length);
        const cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014b50, true);   // firma directorio central
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, time, true);
        cv.setUint16(14, day, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint32(42, offset, true);      // posición de la cabecera local
        central.set(name, 46);

        localParts.push(local, data);
        centralParts.push(central);
        offset += local.length + data.length;
    }

    const centralSize = centralParts.reduce((n, p) => n + p.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);       // fin de directorio central
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    const out = new Uint8Array(offset + centralSize + end.length);
    let pos = 0;
    for (const part of [...localParts, ...centralParts, end]) { out.set(part, pos); pos += part.length; }
    return out;
}
