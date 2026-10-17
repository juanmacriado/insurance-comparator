'use server';

import { getAseguradoras, getRegistros, getRegistrosConAseguradora, addAseguradora, addRegistro, updateRegistro, deleteRegistro } from '../../lib/db';
import { validateRegistro, calcularLiquidacion, calcularRenovaciones } from '../../lib/comisiones-rules';

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string> };

export async function fetchAseguradoras() {
    return await getAseguradoras();
}

export async function fetchRegistros(aseguradoraId: number, año: number | null = null, tipo: string | null = null) {
    return await getRegistros(aseguradoraId, año, tipo);
}

export async function createAseguradora(nombre: string) {
    return await addAseguradora(nombre);
}

export async function createRegistro(registro: any): Promise<SaveResult> {
    const { errors, value } = validateRegistro(registro);
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    await addRegistro(value);
    return { ok: true };
}

export async function editRegistro(id: number, registro: any): Promise<SaveResult> {
    const { errors, value } = validateRegistro(registro);
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    await updateRegistro(id, value);
    return { ok: true };
}

export async function removeRegistro(id: number) {
    return await deleteRegistro(id);
}

/** Liquidación de una aseguradora entre dos fechas ('YYYY-MM-DD' o meses 'YYYY-MM', ambos incluidos). */
export async function fetchLiquidacion(aseguradoraId: number, desde: string, hasta: string) {
    const registros = await getRegistros(aseguradoraId, null, null);
    return calcularLiquidacion(registros, desde, hasta);
}

/** Pólizas de alta de todas las aseguradoras que renuevan entre dos fechas ('YYYY-MM-DD'). */
export async function fetchRenovaciones(desde: string, hasta: string) {
    const registros = await getRegistrosConAseguradora();
    return calcularRenovaciones(registros, desde, hasta);
}
