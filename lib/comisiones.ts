export interface Comision {
    id: string;
    aseguradora: string;
    ramo: string;
    comision: number; // Porcentaje
    fechaAcuerdo: string;
    notas?: string;
}

// Mock inicial de datos
export let comisiones: Comision[] = [
    {
        id: '1',
        aseguradora: 'Allianz',
        ramo: 'Ciberseguridad',
        comision: 15,
        fechaAcuerdo: '2024-01-01',
        notas: 'Acuerdo preferente'
    },
    {
        id: '2',
        aseguradora: 'Mapfre',
        ramo: 'Ciberseguridad',
        comision: 12,
        fechaAcuerdo: '2024-02-15',
    }
];

export async function getComisiones() {
    return comisiones;
}

export async function addComision(nueva: Omit<Comision, 'id'>) {
    const comision: Comision = {
        ...nueva,
        id: Math.random().toString(36).substring(2, 9)
    };
    comisiones.push(comision);
    return comision;
}

export async function deleteComision(id: string) {
    comisiones = comisiones.filter(c => c.id !== id);
    return { success: true };
}
