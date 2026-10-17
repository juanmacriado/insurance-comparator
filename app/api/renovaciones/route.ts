import { timingSafeEqual } from 'crypto';
import { auth } from '@/auth';
import { getRegistrosConAseguradora } from '@/lib/db';
import { calcularRenovaciones, addMonthsISO } from '@/lib/comisiones-rules';

export const dynamic = 'force-dynamic';

/**
 * GET /api/renovaciones?meses=3  (EV-08)
 *
 * Devuelve en JSON las pólizas que renuevan desde hoy (hora de España) hasta dentro de `meses`
 * (1–12, por defecto 3), con la misma regla que la pantalla "Próximas renovaciones".
 * La usa la tarea programada de Claude que envía el informe semanal por correo.
 *
 * Acceso: cabecera `Authorization: Bearer <RENEWALS_API_TOKEN>` o un administrador con sesión.
 * Solo lectura. /api queda fuera del middleware de login, por eso se comprueba aquí.
 */

function tokenOk(request: Request) {
    const expected = process.env.RENEWALS_API_TOKEN;
    if (!expected) return false;
    const header = request.headers.get('authorization');
    // Cabecera Bearer o parámetro ?token= (la herramienta de lectura web de Claude no envía cabeceras)
    const provided = header?.startsWith('Bearer ') ? header.slice(7) : new URL(request.url).searchParams.get('token');
    if (!provided) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

function fmtDate(iso?: string | null) {
    if (!iso) return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return d && m && y ? `${d}/${m}/${y}` : String(iso);
}

function fmtEuro(n: number) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function clean(value: unknown) {
    return String(value ?? '').replace(/[|\r\n]+/g, ' ').trim();
}

function todayInMadrid(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(new Date()); // 'YYYY-MM-DD'
}

export async function GET(request: Request) {
    if (!tokenOk(request)) {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
    }

    const mesesParam = Number(new URL(request.url).searchParams.get('meses') ?? 3);
    const meses = Number.isInteger(mesesParam) && mesesParam >= 1 && mesesParam <= 12 ? mesesParam : 3;
    const desde = todayInMadrid();
    const hasta = addMonthsISO(desde, meses);

    const renovaciones = calcularRenovaciones(await getRegistrosConAseguradora(), desde, hasta).map(r => ({
        fecha_renovacion: r.fecha_renovacion,
        anualidad: r.anualidad,
        aseguradora: r.aseguradora_nombre,
        cliente: r.cliente,
        numero_poliza: r.numero_poliza,
        producto: r.producto,
        tipo_pago: r.tipo_pago,
        situacion: r.situacion,
        fecha_efecto: r.fecha_efecto,
        prima_neta: Number(r.prima_neta ?? 0),
        prima_total: Number(r.prima_total ?? 0),
        porcentaje_comision: Number(r.porcentaje_comision ?? 0),
        neto_comision: Number(r.neto_comision ?? 0),
        falta_fecha_baja: r.falta_fecha_baja,
    }));

    const total = renovaciones.length;
    const sinFechaBaja = renovaciones.filter(r => r.falta_fecha_baja).length;
    const primaTotal = Math.round(renovaciones.reduce((acc, r) => acc + r.prima_total, 0) * 100) / 100;

    // ?formato=texto → tabla de texto compacta con totales de control (la usa la tarea programada de Claude)
    if (new URL(request.url).searchParams.get('formato') === 'texto') {
        const lines = [
            `INFORME DE RENOVACIONES | desde ${fmtDate(desde)} | hasta ${fmtDate(hasta)} | meses ${meses}`,
            `CONTROL | filas ${total} | sin_fecha_baja ${sinFechaBaja} | prima_total ${fmtEuro(primaTotal)}`,
            `COLUMNAS | n | renueva | anualidad | aseguradora | cliente | poliza | producto | tipo_pago | prima_total | aviso`,
            ...renovaciones.map((r, i) => [
                `FILA ${i + 1}`,
                fmtDate(r.fecha_renovacion),
                `${r.anualidad}ª`,
                clean(r.aseguradora),
                clean(r.cliente),
                clean(r.numero_poliza),
                clean(r.producto),
                clean(r.tipo_pago),
                fmtEuro(r.prima_total),
                r.falta_fecha_baja ? 'FALTA FECHA DE BAJA' : '-',
            ].join(' | ')),
            `FIN | filas ${total}`,
        ];
        return new Response(lines.join('\n') + '\n', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
    }

    return Response.json(
        {
            generado: new Date().toISOString(),
            desde,
            hasta,
            meses,
            total,
            sin_fecha_baja: sinFechaBaja,
            prima_total: primaTotal,
            renovaciones,
        },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}
