'use server';

import { getAseguradoras, getRegistros, addAseguradora, addRegistro, updateRegistro, deleteRegistro } from '../../lib/db';

export async function fetchAseguradoras() {
    return await getAseguradoras();
}

export async function fetchRegistros(aseguradoraId: number, año: number | null = null, tipo: string | null = null) {
    return await getRegistros(aseguradoraId, año, tipo);
}

export async function createAseguradora(nombre: string) {
    return await addAseguradora(nombre);
}

export async function createRegistro(registro: any) {
    return await addRegistro(registro);
}

export async function editRegistro(id: number, registro: any) {
    return await updateRegistro(id, registro);
}

export async function removeRegistro(id: number) {
    return await deleteRegistro(id);
}
