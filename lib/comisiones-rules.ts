/**
 * Reglas de negocio de Gestión de Comisiones.
 * Módulo puro (sin acceso a BD ni a APIs de Node): se usa tanto en cliente
 * (validación del formulario) como en servidor (validación y cálculos).
 *
 * Todas las fechas se manejan como texto ISO 'YYYY-MM-DD' (y meses como
 * 'YYYY-MM') para evitar desfases de zona horaria entre navegador y servidor.
 */

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export const TIPOS_PAGO = ['ANUAL', 'SEMESTRAL', 'TRIMESTRAL', 'MENSUAL'] as const;
export type TipoPago = typeof TIPOS_PAGO[number];

/** Meses entre dos cobros consecutivos según el tipo de pago. */
export const MESES_ENTRE_COBROS: Record<TipoPago, number> = {
    ANUAL: 12,
    SEMESTRAL: 6,
    TRIMESTRAL: 3,
    MENSUAL: 1,
};

export const SITUACIONES = ['ALTA', 'BAJA'] as const;
export type Situacion = typeof SITUACIONES[number];

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ---------------------------------------------------------------------------
// Utilidades de fecha
// ---------------------------------------------------------------------------

type YMD = { y: number; m: number; d: number }; // m: 1-12

export function parseISODate(value: unknown): YMD | null {
    if (typeof value !== 'string') return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match) return null;
    const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
    if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
    return { y, m, d };
}

export function parseISOMonth(value: unknown): { y: number; m: number } | null {
    if (typeof value !== 'string') return null;
    const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (!match) return null;
    const y = Number(match[1]), m = Number(match[2]);
    if (m < 1 || m > 12) return null;
    return { y, m };
}

function daysInMonth(y: number, m: number) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Índice absoluto de mes, para poder restar meses. */
function monthIndex(y: number, m: number) {
    return y * 12 + (m - 1);
}

function fromMonthIndex(idx: number) {
    return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function pad(n: number) {
    return String(n).padStart(2, '0');
}

export function toISODate({ y, m, d }: YMD) {
    return `${y}-${pad(m)}-${pad(d)}`;
}

export function monthLabel(y: number, m: number) {
    return `${MESES_CORTOS[m - 1]} ${y}`;
}

/** Suma meses a una fecha ISO (ajusta al último día si el mes es más corto). */
export function addMonthsISO(iso: string, months: number): string {
    const date = parseISODate(iso);
    if (!date) return iso;
    const { y, m } = fromMonthIndex(monthIndex(date.y, date.m) + months);
    return toISODate({ y, m, d: Math.min(date.d, daysInMonth(y, m)) });
}

export function todayISO() {
    const now = new Date();
    return toISODate({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

// ---------------------------------------------------------------------------
// Normalización y validación de registros
// ---------------------------------------------------------------------------

export function normalizeCatalogValue(value: unknown): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function isTipoPago(value: unknown): value is TipoPago {
    return (TIPOS_PAGO as readonly string[]).includes(normalizeCatalogValue(value));
}

export function isSituacion(value: unknown): value is Situacion {
    return (SITUACIONES as readonly string[]).includes(normalizeCatalogValue(value));
}

export type RegistroValidation = {
    errors: Record<string, string>;
    /** Registro con catálogos normalizados y fecha_baja coherente con la situación. */
    value: Record<string, any>;
};

export function validateRegistro(input: Record<string, any>): RegistroValidation {
    const errors: Record<string, string> = {};
    const value: Record<string, any> = { ...input };

    value.tipo_pago = normalizeCatalogValue(input.tipo_pago);
    value.situacion = normalizeCatalogValue(input.situacion);
    value.fecha_efecto = input.fecha_efecto ? String(input.fecha_efecto).slice(0, 10) : null;
    value.fecha_baja = input.fecha_baja ? String(input.fecha_baja).slice(0, 10) : null;

    if (!String(input.cliente ?? '').trim()) errors.cliente = 'El cliente es obligatorio.';
    if (!String(input.numero_poliza ?? '').trim()) errors.numero_poliza = 'El nº de póliza es obligatorio.';

    if (!isTipoPago(value.tipo_pago)) {
        errors.tipo_pago = `Selecciona un tipo de pago: ${TIPOS_PAGO.join(', ')}.`;
    }
    if (!isSituacion(value.situacion)) {
        errors.situacion = 'Selecciona ALTA o BAJA.';
    }

    const efecto = parseISODate(value.fecha_efecto);
    if (!efecto) errors.fecha_efecto = 'La fecha de efecto es obligatoria.';

    if (value.situacion === 'BAJA') {
        const baja = parseISODate(value.fecha_baja);
        if (!baja) {
            errors.fecha_baja = 'Indica la fecha de baja.';
        } else if (efecto && value.fecha_baja < value.fecha_efecto) {
            errors.fecha_baja = 'La fecha de baja no puede ser anterior a la fecha de efecto.';
        }
    } else if (value.situacion === 'ALTA') {
        value.fecha_baja = null; // una póliza de alta no tiene fecha de baja
    }

    return { errors, value };
}

// ---------------------------------------------------------------------------
// Liquidación
// ---------------------------------------------------------------------------

export type LineaLiquidacion<R> = R & {
    mes_liquidacion: string;   // 'YYYY-MM'
    settlementLabel: string;   // 'Ene 2026'
    /** De BAJA sin fecha de baja: se incluye por precaución y se destaca en el informe. */
    falta_fecha_baja: boolean;
};

export const AVISO_FALTA_FECHA_BAJA = 'Falta fecha de baja (incluida por precaución)';

/** Póliza de BAJA a la que no se le ha informado la fecha de baja. */
export function faltaFechaBaja(reg: Record<string, any>) {
    return normalizeCatalogValue(reg.situacion) === 'BAJA' && !parseISODate(reg.fecha_baja);
}

export type AvisoLiquidacion = {
    id: number | string;
    cliente: string;
    numero_poliza: string;
    motivo: string;
};

export type ResultadoLiquidacion<R> = {
    lineas: LineaLiquidacion<R>[];
    avisos: AvisoLiquidacion[];
};

/**
 * ¿Estaba la póliza de alta en algún momento del mes (y, m)?
 * - Sin fecha de baja → sí (desde el mes de efecto).
 * - Con fecha de baja → el mes cuenta si la baja es posterior al día 1 de ese mes
 *   (es decir, estuvo de alta al menos parte del mes). Una baja el día 1 excluye el mes.
 */
function activaEnMes(fechaBaja: YMD | null, y: number, m: number) {
    if (!fechaBaja) return true;
    const primerDia = toISODate({ y, m, d: 1 });
    return toISODate(fechaBaja) > primerDia;
}

/**
 * Calcula las líneas de liquidación entre dos meses naturales (incluidos).
 *
 * Regla: una póliza genera una línea por cada mes del periodo en el que
 *  1) le corresponde un cobro según su tipo de pago (mes de efecto + múltiplos
 *     de 12/6/3/1 meses), y
 *  2) estuvo de alta al menos parte de ese mes.
 *
 * La situación ACTUAL no excluye a la póliza: una póliza hoy de BAJA aparece en
 * los meses del periodo anteriores a su fecha de baja.
 *
 * Póliza de BAJA SIN fecha de baja: no se puede saber hasta cuándo estuvo de alta,
 * así que se incluye por precaución en sus meses de cobro (como si siguiera de alta)
 * con `falta_fecha_baja = true` para destacarla en el informe.
 */
export function calcularLiquidacion<R extends Record<string, any>>(
    registros: R[],
    mesInicio: string,
    mesFin: string,
): ResultadoLiquidacion<R> {
    const inicio = parseISOMonth(mesInicio);
    const fin = parseISOMonth(mesFin);
    if (!inicio || !fin) throw new Error('Periodo de liquidación no válido.');

    const desdeIdx = monthIndex(inicio.y, inicio.m);
    const hastaIdx = monthIndex(fin.y, fin.m);
    if (desdeIdx > hastaIdx) throw new Error('El mes de inicio es posterior al mes de fin.');

    const lineas: LineaLiquidacion<R>[] = [];
    const avisos: AvisoLiquidacion[] = [];
    const aviso = (reg: R, motivo: string) =>
        avisos.push({ id: reg.id, cliente: reg.cliente ?? '', numero_poliza: reg.numero_poliza ?? '', motivo });

    for (const reg of registros) {
        const tipoPago = normalizeCatalogValue(reg.tipo_pago);
        const situacion = normalizeCatalogValue(reg.situacion);
        const efecto = parseISODate(reg.fecha_efecto);
        const baja = parseISODate(reg.fecha_baja);

        if (!efecto) { aviso(reg, 'Sin fecha de efecto válida'); continue; }
        if (!isTipoPago(tipoPago)) { aviso(reg, `Tipo de pago no reconocido: "${reg.tipo_pago ?? ''}"`); continue; }
        if (!isSituacion(situacion)) { aviso(reg, `Situación no reconocida: "${reg.situacion ?? ''}"`); continue; }

        const sinFechaBaja = situacion === 'BAJA' && !baja;
        const intervalo = MESES_ENTRE_COBROS[tipoPago];
        const efectoIdx = monthIndex(efecto.y, efecto.m);
        const bajaEfectiva = situacion === 'BAJA' ? baja : null; // null si falta → se trata como activa

        for (let idx = Math.max(desdeIdx, efectoIdx); idx <= hastaIdx; idx++) {
            if ((idx - efectoIdx) % intervalo !== 0) continue;
            const { y, m } = fromMonthIndex(idx);
            if (!activaEnMes(bajaEfectiva, y, m)) break; // a partir de aquí ya está de baja
            lineas.push({ ...reg, mes_liquidacion: `${y}-${pad(m)}`, settlementLabel: monthLabel(y, m), falta_fecha_baja: sinFechaBaja });
        }
    }

    lineas.sort((a, b) =>
        a.mes_liquidacion.localeCompare(b.mes_liquidacion) ||
        String(a.cliente ?? '').localeCompare(String(b.cliente ?? '')));

    return { lineas, avisos };
}

// ---------------------------------------------------------------------------
// Renovaciones
// ---------------------------------------------------------------------------

export type Renovacion<R> = R & {
    fecha_renovacion: string; // 'YYYY-MM-DD'
    anualidad: number;        // 1 = primera renovación, 2 = segunda...
    /** De BAJA sin fecha de baja: se incluye por precaución y se destaca en el informe. */
    falta_fecha_baja: boolean;
};

/**
 * Pólizas de ALTA cuyo aniversario de la fecha de efecto (efecto + N años, N ≥ 1)
 * cae dentro de [desde, hasta] (fechas ISO, ambas incluidas).
 * También las de BAJA sin fecha de baja, por precaución (`falta_fecha_baja = true`).
 * Un 29 de febrero renueva el 28 en años no bisiestos.
 */
export function calcularRenovaciones<R extends Record<string, any>>(
    registros: R[],
    desde: string,
    hasta: string,
): Renovacion<R>[] {
    const d = parseISODate(desde);
    const h = parseISODate(hasta);
    if (!d || !h) throw new Error('Intervalo de fechas no válido.');
    if (desde > hasta) throw new Error('La fecha inicial es posterior a la final.');

    const resultado: Renovacion<R>[] = [];

    for (const reg of registros) {
        const situacion = normalizeCatalogValue(reg.situacion);
        const sinFechaBaja = faltaFechaBaja(reg);
        const deAlta = situacion === 'ALTA' && !reg.fecha_baja;
        if (!deAlta && !sinFechaBaja) continue;
        const efecto = parseISODate(reg.fecha_efecto);
        if (!efecto) continue;

        for (let y = Math.max(d.y, efecto.y + 1); y <= h.y; y++) {
            const fecha = toISODate({ y, m: efecto.m, d: Math.min(efecto.d, daysInMonth(y, efecto.m)) });
            if (fecha >= desde && fecha <= hasta) {
                resultado.push({ ...reg, fecha_renovacion: fecha, anualidad: y - efecto.y, falta_fecha_baja: sinFechaBaja });
            }
        }
    }

    return resultado.sort((a, b) =>
        a.fecha_renovacion.localeCompare(b.fecha_renovacion) ||
        String(a.aseguradora_nombre ?? '').localeCompare(String(b.aseguradora_nombre ?? '')));
}
