import 'dotenv/config'; // Load env vars
import { sql } from '@vercel/postgres';

async function initDB() {
    try {
        console.log('Creando tabla aseguradoras...');
        await sql`
      CREATE TABLE IF NOT EXISTS aseguradoras (
        id SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL
      );
    `;

        console.log('Creando tabla registros_comisiones...');
        await sql`
      CREATE TABLE IF NOT EXISTS registros_comisiones (
        id SERIAL PRIMARY KEY,
        aseguradora_id INTEGER NOT NULL REFERENCES aseguradoras(id),
        año INTEGER NOT NULL,
        tipo_registro TEXT NOT NULL, 
        cliente TEXT,
        situacion TEXT,
        tipo_pago TEXT,
        numero_poliza TEXT,
        fecha_efecto TEXT, -- Storing as ISO text YYYY-MM-DD
        pago_hiscox DOUBLE PRECISION,
        producto TEXT,
        prima_neta DOUBLE PRECISION,
        prima_total DOUBLE PRECISION,
        porcentaje_comision DOUBLE PRECISION,
        neto_comision DOUBLE PRECISION,
        comprobacion_prima DOUBLE PRECISION,
        importe_liquidar DOUBLE PRECISION,
        comprobacion_datos DOUBLE PRECISION
      );
    `;

        console.log('Base de datos inicializada correctamente.');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
    }
}

initDB();
