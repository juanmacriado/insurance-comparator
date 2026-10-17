/**
 * Prepara la base de datos LOCAL con el esquema completo y datos FICTICIOS de prueba.
 * Ejecutar: npm run db:local:seed   (con `npm run db:local:up` arrancado antes)
 *
 * Seguridad: lee .env.development.local y se niega a ejecutarse si POSTGRES_URL no es localhost.
 * Borra y recrea los datos de prueba cada vez que se ejecuta.
 */
import { config } from 'dotenv';
config({ path: '.env.development.local' });

const LOCAL_USERS = [
    { name: 'Admin Local', email: 'admin@local.test', password: 'admin-local', role: 'admin' },
    { name: 'Usuario Local', email: 'usuario@local.test', password: 'usuario-local', role: 'user' },
];

function iso(d: Date) {
    return d.toISOString().slice(0, 10);
}
function shift(base: Date, { years = 0, months = 0, days = 0 }) {
    const d = new Date(Date.UTC(base.getUTCFullYear() + years, base.getUTCMonth() + months, base.getUTCDate() + days));
    return iso(d);
}

async function main() {
    const { isLocalPostgres } = await import('../lib/local-postgres');
    if (!isLocalPostgres()) {
        console.error('✋ POSTGRES_URL no apunta a localhost. Este script solo funciona con la base de datos local.');
        console.error('   Revisa .env.development.local (ver DOCUMENTACION.md §3).');
        process.exit(1);
    }

    const { sql } = await import('../lib/sql');
    const bcrypt = (await import('bcryptjs')).default;

    console.log('Creando esquema...');
    await sql`CREATE TABLE IF NOT EXISTS aseguradoras (id SERIAL PRIMARY KEY, nombre TEXT UNIQUE NOT NULL)`;
    await sql`
        CREATE TABLE IF NOT EXISTS registros_comisiones (
            id SERIAL PRIMARY KEY,
            aseguradora_id INTEGER NOT NULL REFERENCES aseguradoras(id),
            año INTEGER NOT NULL,
            tipo_registro TEXT NOT NULL,
            cliente TEXT, situacion TEXT, tipo_pago TEXT, numero_poliza TEXT,
            fecha_efecto TEXT, pago_hiscox DOUBLE PRECISION, producto TEXT,
            prima_neta DOUBLE PRECISION, prima_total DOUBLE PRECISION,
            porcentaje_comision DOUBLE PRECISION, neto_comision DOUBLE PRECISION,
            comprobacion_prima DOUBLE PRECISION, importe_liquidar DOUBLE PRECISION,
            comprobacion_datos DOUBLE PRECISION
        )`;
    await sql`ALTER TABLE registros_comisiones ADD COLUMN IF NOT EXISTS fecha_baja TEXT`;
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user', created_at TIMESTAMP DEFAULT NOW()
        )`;
    await sql`CREATE TABLE IF NOT EXISTS password_resets (email TEXT NOT NULL, token TEXT NOT NULL, expires_at TIMESTAMP NOT NULL)`;
    await sql`
        CREATE TABLE IF NOT EXISTS social_agent_prompts (
            id SERIAL PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`;

    console.log('Borrando datos de prueba anteriores...');
    await sql`TRUNCATE registros_comisiones, aseguradoras, users, password_resets, social_agent_prompts RESTART IDENTITY CASCADE`;

    console.log('Creando usuarios locales...');
    for (const u of LOCAL_USERS) {
        await sql`INSERT INTO users (name, email, password, role) VALUES (${u.name}, ${u.email}, ${await bcrypt.hash(u.password, 10)}, ${u.role})`;
    }

    console.log('Creando aseguradoras y pólizas ficticias...');
    const a = (await sql`INSERT INTO aseguradoras (nombre) VALUES ('Aseguradora Demo A') RETURNING id`).rows[0].id;
    const b = (await sql`INSERT INTO aseguradoras (nombre) VALUES ('Aseguradora Demo B') RETURNING id`).rows[0].id;

    const hoy = new Date();
    // [aseguradora, cliente, tipo_pago, situacion, fecha_efecto, fecha_baja, prima_neta, que_prueba]
    const casos: [number, string, string, string, string, string | null, number, string][] = [
        [a, 'Demo Anual Renueva Pronto S.L.', 'ANUAL', 'ALTA', shift(hoy, { years: -2, days: 20 }), null, 1200, 'Renueva en ~20 días (2ª anualidad)'],
        [a, 'Demo Primera Renovación S.A.', 'ANUAL', 'ALTA', shift(hoy, { years: -1, days: 45 }), null, 800, 'Primera renovación en ~45 días'],
        [b, 'Demo Trimestral S.L.', 'TRIMESTRAL', 'ALTA', shift(hoy, { years: -1, days: 70 }), null, 2400, 'Trimestral: cobro cada 3 meses; renueva en ~70 días'],
        [b, 'Demo Semestral S.L.', 'SEMESTRAL', 'ALTA', shift(hoy, { years: -3, days: 10 }), null, 3000, 'Semestral; renueva en ~10 días'],
        [a, 'Demo Mensual Activa S.L.', 'MENSUAL', 'ALTA', shift(hoy, { months: -8 }), null, 150, 'Mensual de alta: un cobro cada mes'],
        [a, 'Demo Mensual Baja Reciente S.L.', 'MENSUAL', 'BAJA', shift(hoy, { months: -10 }), shift(hoy, { days: -20 }), 150, 'Baja hace 20 días: liquida hasta el mes de la baja'],
        [b, 'Demo Baja Sin Fecha (mensual)', 'MENSUAL', 'BAJA', shift(hoy, { months: -6 }), null, 120, 'BAJA sin fecha: sale en ámbar en liquidación'],
        [b, 'Demo Baja Sin Fecha (anual)', 'ANUAL', 'BAJA', shift(hoy, { years: -1, days: 30 }), null, 950, 'BAJA sin fecha: sale en ámbar en renovaciones'],
        [a, 'Demo Nueva Producción S.L.', 'ANUAL', 'ALTA', shift(hoy, { days: 15 }), null, 700, 'Nueva producción: NO es renovación'],
        [a, 'Demo Baja Con Fecha S.L.', 'ANUAL', 'BAJA', shift(hoy, { years: -2, days: 25 }), shift(hoy, { months: -2 }), 1100, 'De baja con fecha: NO renueva'],
        [b, 'Demo Valor Antiguo (minúsculas)', 'anual ', 'alta', shift(hoy, { years: -1, days: 60 }), null, 500, 'Valor escrito a mano: se normaliza a ANUAL/ALTA'],
        [b, 'Demo Tipo Pago Erróneo', 'BIMESTRAL', 'ALTA', shift(hoy, { years: -1 }), null, 400, 'Tipo de pago fuera de catálogo: aviso en liquidación'],
    ];

    for (const [aseg, cliente, tipoPago, situacion, efecto, baja, primaNeta, nota] of casos) {
        const pct = 18;
        const primaTotal = Math.round(primaNeta * 1.0615 * 100) / 100; // primas + impuestos aprox.
        const neto = Math.round(primaNeta * pct) / 100;
        const liquidar = Math.round((primaTotal - neto) * 100) / 100;
        await sql.query(
            `INSERT INTO registros_comisiones (
                aseguradora_id, año, tipo_registro, cliente, situacion, tipo_pago, numero_poliza, fecha_efecto,
                fecha_baja, pago_hiscox, producto, prima_neta, prima_total, porcentaje_comision, neto_comision,
                comprobacion_prima, importe_liquidar, comprobacion_datos
            ) VALUES ($1,$2,'Producción',$3,$4,$5,$6,$7,$8,0,$9,$10,$11,$12,$13,0,$14,0)`,
            [aseg, Number(efecto.slice(0, 4)), cliente, situacion, tipoPago, `DEMO-${efecto.replace(/-/g, '')}-${tipoPago.trim().slice(0, 3)}`,
                efecto, baja, `Ciber Demo · ${nota}`, primaNeta, primaTotal, pct, neto, liquidar],
        );
    }

    console.log(`\n✅ Base local lista: ${casos.length} pólizas ficticias en 2 aseguradoras.`);
    console.log('   Usuarios:');
    for (const u of LOCAL_USERS) console.log(`   - ${u.email} / ${u.password} (${u.role})`);
    console.log('   Arranca la app con: npm run dev  →  http://localhost:3000\n');
    await sql.end();
}

main().catch((error) => {
    console.error('❌ Error preparando la base local:', error);
    process.exit(1);
});
