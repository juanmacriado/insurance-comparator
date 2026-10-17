/**
 * Punto único de acceso a la base de datos.
 * Importar SIEMPRE `sql` desde aquí (`@/lib/sql`) y no directamente de '@vercel/postgres':
 * así, en desarrollo con base de datos local, la configuración del driver se aplica
 * exactamente a la misma copia del driver que usan las consultas.
 */
import { configureLocalPostgres } from './local-postgres';

configureLocalPostgres();

export { sql } from '@vercel/postgres';
