
const { db } = require('../lib/db');
const { importHiscoxExcel } = require('../lib/import-excel');

async function run() {
    console.log('Limpiando registros antiguos del año 2025 para Nueva producción anual...');
    // Delete existing records to avoid duplicates
    db.prepare("DELETE FROM registros_comisiones WHERE año = 2025 AND tipo_registro = 'Nueva producción anual'").run();

    console.log('Iniciando importación...');
    await importHiscoxExcel();
    console.log('¡Proceso finalizado con éxito!');
}

run().catch(console.error);
