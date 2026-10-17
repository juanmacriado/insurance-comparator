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

/** Suma días a una fecha ISO ('YYYY-MM-DD'). Soporta números negativos. */
export function addDaysISO(iso: string, days: number): string {
    const date = parseISODate(iso);
    if (!date) return iso;
    const utc = new Date(Date.UTC(date.y, date.m - 1, date.d));
    utc.setUTCDate(utc.getUTCDate() + days);
    return toISODate({
        y: utc.getUTCFullYear(),
        m: utc.getUTCMonth() + 1,
        d: utc.getUTCDate(),
    });
}

/** Diferencia en días enteros entre dos fechas ISO (a hasta b = b - a). */
export function daysBetween(fromISO: string, toISO: string): number {
    const a = parseISODate(fromISO);
    const b = parseISODate(toISO);
    if (!a || !b) return 0;
    const utcA = Date.UTC(a.y, a.m - 1, a.d);
    const utcB = Date.UTC(b.y, b.m - 1, b.d);
    return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
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
    if (!efecto) {
        errors.fecha_efecto = 'La fecha de efecto es obligatoria.';
    } else if (!value.año) {
        value.año = efecto.y;
    }

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
    fecha_cobro?: string;      // 'YYYY-MM-DD' (cuando se calcula por días concretos)
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
 * Calcula las líneas de liquidación entre dos fechas ('YYYY-MM-DD') o dos meses ('YYYY-MM').
 *
 * 1. Modo fechas exactas ('YYYY-MM-DD'):
 *    - Cada póliza genera un cobro en la fecha exacta que le corresponde por su fecha de efecto
 *      (día del mes de efecto) y periodicidad (cada 12/6/3/1 meses).
 *    - Solo se incluyen los cobros cuya fecha exacta cae dentro de [desde, hasta].
 *    - Si la póliza está de BAJA con fecha de baja conocida, solo se incluye si la baja es posterior o igual a la fecha de cobro.
 *    - Si la póliza está de BAJA sin fecha de baja, se incluye por precaución con `falta_fecha_baja = true`.
 *
 * 2. Modo meses completos ('YYYY-MM', para compatibilidad):
 *    - Aplica la regla por meses naturales de §13.3.
 */
export function calcularLiquidacion<R extends Record<string, any>>(
    registros: R[],
    desde: string,
    hasta: string,
): ResultadoLiquidacion<R> {
    const isMonthRange = parseISOMonth(desde) !== null && parseISODate(desde) === null &&
                         parseISOMonth(hasta) !== null && parseISODate(hasta) === null;

    if (isMonthRange) {
        const inicio = parseISOMonth(desde)!;
        const fin = parseISOMonth(hasta)!;
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

    // Modo rango de fechas exactas ('YYYY-MM-DD')
    const d = parseISODate(desde);
    const h = parseISODate(hasta);
    if (!d || !h) throw new Error('Periodo de liquidación no válido.');
    if (desde > hasta) throw new Error('La fecha inicial es posterior a la final.');

    const desdeIdx = monthIndex(d.y, d.m);
    const hastaIdx = monthIndex(h.y, h.m);

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
        const bajaStr = (situacion === 'BAJA' && baja) ? toISODate(baja) : null;

        for (let idx = Math.max(desdeIdx, efectoIdx); idx <= hastaIdx; idx++) {
            if ((idx - efectoIdx) % intervalo !== 0) continue;
            const { y, m } = fromMonthIndex(idx);
            const cobroDay = Math.min(efecto.d, daysInMonth(y, m));
            const fechaCobro = toISODate({ y, m, d: cobroDay });

            // Si está de baja con fecha conocida y la fecha de baja es anterior a este cobro,
            // ya no genera más cobros en meses futuros
            if (bajaStr && bajaStr < fechaCobro) break;

            // Solo cobros que caen estrictamente dentro del intervalo [desde, hasta]
            if (fechaCobro < desde || fechaCobro > hasta) continue;

            lineas.push({
                ...reg,
                mes_liquidacion: `${y}-${pad(m)}`,
                fecha_cobro: fechaCobro,
                settlementLabel: monthLabel(y, m),
                falta_fecha_baja: sinFechaBaja,
            });
        }
    }

    lineas.sort((a, b) =>
        (a.fecha_cobro ?? a.mes_liquidacion).localeCompare(b.fecha_cobro ?? b.mes_liquidacion) ||
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
 * Las de BAJA nunca renuevan, tengan o no fecha de baja (`falta_fecha_baja` siempre es false aquí).
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
        // Solo renuevan las pólizas de ALTA. Una póliza de BAJA nunca renueva,
        // tenga o no fecha de baja (decisión de negocio 18/10/2026).
        const situacion = normalizeCatalogValue(reg.situacion);
        const deAlta = situacion === 'ALTA' && !parseISODate(reg.fecha_baja);
        if (!deAlta) continue;
        const efecto = parseISODate(reg.fecha_efecto);
        if (!efecto) continue;

        for (let y = Math.max(d.y, efecto.y + 1); y <= h.y; y++) {
            const fecha = toISODate({ y, m: efecto.m, d: Math.min(efecto.d, daysInMonth(y, efecto.m)) });
            if (fecha >= desde && fecha <= hasta) {
                resultado.push({ ...reg, fecha_renovacion: fecha, anualidad: y - efecto.y, falta_fecha_baja: false });
            }
        }
    }

    return resultado.sort((a, b) =>
        a.fecha_renovacion.localeCompare(b.fecha_renovacion) ||
        String(a.aseguradora_nombre ?? '').localeCompare(String(b.aseguradora_nombre ?? '')));
}

// ---------------------------------------------------------------------------
// Próximas liquidaciones (próximo mes)
// ---------------------------------------------------------------------------

export type ProximaLiquidacion<R> = R & {
    fecha_cobro: string;               // 'YYYY-MM-DD'
    fecha_limite_liquidacion: string;  // 'YYYY-MM-DD' (fecha_cobro + periodo_dias)
    dias_restantes: number;            // diferencia en días hasta la fecha límite desde hoy
    mes_cobro: string;                 // 'YYYY-MM'
    falta_fecha_baja: boolean;
};

/**
 * Calcula las pólizas a liquidar en el intervalo [desde, hasta] (por defecto el próximo mes),
 * sumando a cada fecha de cobro (que parte de la fecha de efecto según la periodicidad de pago) el
 * periodo máximo de liquidación en días definido para la aseguradora.
 */
export function calcularProximasLiquidaciones<R extends Record<string, any>>(
    registros: R[],
    periodoDias: number = 30,
    desde: string = todayISO(),
    hasta: string = addMonthsISO(todayISO(), 1),
): ProximaLiquidacion<R>[] {
    const d = parseISODate(desde);
    const h = parseISODate(hasta);
    if (!d || !h) throw new Error('Intervalo de fechas no válido.');
    if (desde > hasta) throw new Error('La fecha inicial es posterior a la final.');

    const dias = Number.isFinite(periodoDias) && periodoDias > 0 ? Math.round(periodoDias) : 30;
    const today = todayISO();

    // Las fechas de cobro que pueden vencer en [desde, hasta] caen en:
    // cobroMin = desde - dias; cobroMax = hasta - dias
    const cobroMin = addDaysISO(desde, -dias);
    const cobroMax = addDaysISO(hasta, -dias);
    const minYMD = parseISODate(cobroMin)!;
    const maxYMD = parseISODate(cobroMax)!;

    const minMonthIdx = monthIndex(minYMD.y, minYMD.m);
    const maxMonthIdx = monthIndex(maxYMD.y, maxYMD.m);

    const resultado: ProximaLiquidacion<R>[] = [];

    for (const reg of registros) {
        const situacion = normalizeCatalogValue(reg.situacion);
        const baja = parseISODate(reg.fecha_baja);
        const sinFechaBaja = situacion === 'BAJA' && !baja;
        const deAlta = situacion === 'ALTA' && !baja;
        if (!deAlta && !sinFechaBaja) continue;

        const efecto = parseISODate(reg.fecha_efecto);
        if (!efecto) continue;

        const tipoPago = normalizeCatalogValue(reg.tipo_pago);
        if (!isTipoPago(tipoPago)) continue;

        const intervalo = MESES_ENTRE_COBROS[tipoPago];
        const efectoIdx = monthIndex(efecto.y, efecto.m);
        const bajaStr = (situacion === 'BAJA' && baja) ? toISODate(baja) : null;

        for (let idx = Math.max(minMonthIdx, efectoIdx); idx <= maxMonthIdx; idx++) {
            if ((idx - efectoIdx) % intervalo !== 0) continue;
            const { y, m } = fromMonthIndex(idx);
            const cobroDay = Math.min(efecto.d, daysInMonth(y, m));
            const fechaCobro = toISODate({ y, m, d: cobroDay });

            // No puede haber cobro antes de la fecha de efecto
            if (fechaCobro < toISODate(efecto)) continue;

            // Si está de baja con fecha conocida y es anterior a este cobro, no genera cobro
            if (bajaStr && bajaStr < fechaCobro) break;

            const fechaLimite = addDaysISO(fechaCobro, dias);

            if (fechaLimite >= desde && fechaLimite <= hasta) {
                resultado.push({
                    ...reg,
                    fecha_cobro: fechaCobro,
                    fecha_limite_liquidacion: fechaLimite,
                    dias_restantes: daysBetween(today, fechaLimite),
                    mes_cobro: `${y}-${pad(m)}`,
                    falta_fecha_baja: sinFechaBaja,
                });
            }
        }
    }

    return resultado.sort((a, b) =>
        a.fecha_limite_liquidacion.localeCompare(b.fecha_limite_liquidacion) ||
        String(a.cliente ?? '').localeCompare(String(b.cliente ?? '')));
}
