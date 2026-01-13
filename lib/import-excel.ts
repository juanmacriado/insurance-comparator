import * as xlsx from 'xlsx';
import path from 'path';
import { addAseguradora, addRegistro } from './db';

const EXCEL_PATH = path.resolve(process.cwd(), 'NUEVA PRODUCCION.xlsx');

function excelDateToDate(serial: any) {
    if (!serial || typeof serial !== 'number') return serial;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
}

async function importHiscoxExcel() {
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON starting from row 1 (index 0)
    const data = xlsx.utils.sheet_to_json(sheet, { range: 0 });

    const aseguradoraId = await addAseguradora('Hiscox');

    for (const row of (data as any[])) {
        // Normalize keys (trim and uppercase for matching)
        const getVal = (key: string) => {
            const normalizedKey = key.trim().toUpperCase();
            const actualKey = Object.keys(row).find(k => k.trim().toUpperCase() === normalizedKey);
            return actualKey ? row[actualKey] : undefined;
        };

        const cliente = getVal('CLIENTE');
        const poliza = getVal('NUMERO DE POLIZA') || getVal('NUMERO DE POLIZA ');

        if (!cliente || !poliza) continue;

        const primaNeta = Number(getVal('PRIMA NETA') || 0);
        const primaTotal = Number(getVal('PRIMA TOTAL') || 0);
        const rawPorcentaje = Number(getVal('PORCENTAJE') || 0);
        const netoComision = Number(getVal('NETO COMISION') || 0);
        const importeLiquidar = Number(getVal('IMPORTE A LIQUIDAR HISCOX') || getVal('IMPORTE A LIQUIDAR') || 0);

        // FORMULA 1: (PRIMA NETA * PORCENTAJE - NETO DE COMISION)
        // Note: rawPorcentaje is expected to be in decimal format (e.g. 0.18)
        const compPrima = (primaNeta * rawPorcentaje) - netoComision;

        // FORMULA 2: ((PRIMA TOTAL-(PRIMA NETA * PORCENTAJE))-IMPORTE A LIQUIDAR HISCOX
        const compDatos = (primaTotal - (primaNeta * rawPorcentaje)) - importeLiquidar;

        await addRegistro({
            aseguradora_id: aseguradoraId,
            año: 2025,
            tipo_registro: 'Producción',
            cliente: cliente,
            situacion: getVal('SITUACION') || getVal('SITUACIÓN'),
            tipo_pago: getVal('TIPO DE PAGO'),
            numero_poliza: String(poliza),
            fecha_efecto: excelDateToDate(getVal('FECHA EFECTO')),
            pago_hiscox: Number(getVal('PAGO HISCOX') || 0),
            producto: getVal('PRODUCTO'),
            prima_neta: primaNeta,
            prima_total: primaTotal,
            porcentaje_comision: rawPorcentaje * 100,
            neto_comision: netoComision,
            comprobacion_prima: compPrima, // Calculated value
            importe_liquidar: importeLiquidar,
            comprobacion_datos: compDatos // Calculated value
        });
    }

    console.log('Importación completada para Hiscox');
}

export { importHiscoxExcel, EXCEL_PATH };
