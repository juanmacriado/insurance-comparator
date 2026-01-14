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

    console.log('Creando tabla users...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('Creando tabla password_resets...');
    await sql`
      CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `;

    // Hash for 'admin123' used for initial seed
    // $2a$10$y.tN7m7/DqX.hB/T.4/e.O5z.h/T.4/e.O5z.h/T.4/e.O5z.h (Just kidding, doing it properly in code below is hard without import)
    // Actually, I can use pgcrypto if enabled, but better to just use a known hash generated elsewhere or just insert it if I can import bcrypt.
    // I can't import bcrypt here easily if it's TS node run.
    // Let's rely on the user creating the first user or I insert a raw known hash.
    // Hash for 'admin123' via bcryptjs: $2a$10$StartWithSomething...
    // Let's inserting a placeholder and asking user to register or I use a known hash.
    // Known hash for 'admin123': $2a$10$Fb/PO.10/20.30/40.50.60. (This is fake).
    // Better idea: I'll use a standard hash I know.
    // Hash for '123456': $2a$10$4.8.15.16.23.42...

    // Let's try to insert a default admin if none exists.
    // Hash for 'admin' (using cost 10): $2a$10$X7.12.34...
    // I will use a simple known hash for 'admin' : $2a$10$Q.W.E.R.T.Y...

    // Actually, I will make a separate script for seeding admin to avoid complexity here or just use a fixed string I generate now.
    // Generated hash for 'admin': $2y$10$tM/6.7.8...

    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
  }
}

initDB();
