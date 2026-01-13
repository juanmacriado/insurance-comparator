import 'dotenv/config';
import { deleteRegistrosByYear } from '../lib/db';
import { importHiscoxExcel } from '../lib/import-excel';

async function run() {
    console.log('Limpiando registros antiguos del año 2025 para Nueva producción...');
    console.log('Limpiando registros antiguos del año 2025...');
    // Delete all records for 2025 to start fresh with the single 'Producción' category
    await deleteRegistrosByYear(2025);

    console.log('Iniciando importación...');
    await importHiscoxExcel();
    console.log('¡Proceso finalizado con éxito!');
}

run().catch(console.error);
