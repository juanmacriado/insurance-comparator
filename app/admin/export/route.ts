import { auth } from '@/auth';
import { sql } from '@/lib/sql';
import { toCSV, createZip } from '@/lib/csv-zip';

export const dynamic = 'force-dynamic';

/** Tablas que no se exportan (contienen secretos). */
const EXCLUDED_TABLES = new Set(['password_resets']);
/** Columnas que no se exportan, por tabla. */
const EXCLUDED_COLUMNS: Record<string, string[]> = {
    users: ['password'],
};

function quoteIdent(name: string) {
    return `"${name.replace(/"/g, '""')}"`;
}

/**
 * GET /admin/export → ZIP con un CSV por cada tabla de la base de datos (solo administradores).
 * Las tablas se descubren automáticamente: si mañana se crea una tabla nueva, se incluye sin tocar este código.
 */
export async function GET() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return new Response('No autorizado', { status: 403 });
    }

    const { rows: columnRows } = await sql`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    `;

    const tables = new Map<string, string[]>();
    for (const { table_name, column_name } of columnRows) {
        if (EXCLUDED_TABLES.has(table_name)) continue;
        if (EXCLUDED_COLUMNS[table_name]?.includes(column_name)) continue;
        if (!tables.has(table_name)) tables.set(table_name, []);
        tables.get(table_name)!.push(column_name);
    }

    const files: { name: string; content: string }[] = [];
    const resumen: string[] = [];

    for (const [table, columns] of tables) {
        const hasId = columns.includes('id');
        const query = `SELECT ${columns.map(quoteIdent).join(', ')} FROM ${quoteIdent(table)}${hasId ? ' ORDER BY "id"' : ''}`;
        const { rows } = await sql.query(query);
        files.push({ name: `${table}.csv`, content: toCSV(columns, rows) });
        resumen.push(`${table}: ${rows.length} filas`);
    }

    const now = new Date();
    const stamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    files.push({
        name: 'LEEME.txt',
        content: [
            `Copia de datos de Xeoris Solutions Portal`,
            `Generada: ${now.toISOString()} por ${session.user.email ?? 'admin'}`,
            ``,
            ...resumen,
            ``,
            `Formato: CSV UTF-8, separador ';', coma decimal, fechas ISO.`,
            `No incluye contraseñas (users.password) ni tokens de recuperación (password_resets).`,
            `Contiene datos personales de clientes: guárdalo en un lugar protegido.`,
        ].join('\r\n'),
    });

    console.log(`[EXPORT] ${session.user.email} descargó copia de datos (${resumen.join(', ')})`);

    const zip = createZip(files, now);
    return new Response(new Blob([zip as BlobPart], { type: 'application/zip' }), {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="xeoris_datos_${stamp}.zip"`,
            'Cache-Control': 'no-store',
        },
    });
}
