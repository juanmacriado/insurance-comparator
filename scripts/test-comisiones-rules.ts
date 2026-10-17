// Pruebas completas de las reglas de comisiones (EV-01 a EV-08).
// Ejecutar: npx tsx scripts/test-comisiones-rules.ts
import { calcularLiquidacion as L, calcularRenovaciones as R, validateRegistro as V } from '../lib/comisiones-rules';
import assert from 'node:assert/strict';

const meses = (r: any) => r.lineas.map((l: any) => l.mes_liquidacion);

console.log('--- Comprobando Liquidación (P01 a P13) ---');

// P01: Mensual, efecto 10/06/2025, BAJA 03/05/2026 (después del periodo) -> Ene, Feb, Mar
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'BAJA', fecha_efecto: '2025-06-10', fecha_baja: '2026-05-03' }], '2026-01', '2026-03')),
    ['2026-01', '2026-02', '2026-03']
);
console.log('✓ P01: Mensual con baja posterior al periodo');

// P02: Mensual, efecto 25/06/2025, BAJA 20/02/2026 -> Ene, Feb
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'mensual ', situacion: 'BAJA', fecha_efecto: '2025-06-25', fecha_baja: '2026-02-20' }], '2026-01', '2026-03')),
    ['2026-01', '2026-02']
);
console.log('✓ P02: Mensual con baja a mitad de febrero');

// P03: Mensual, efecto 25/06/2025, BAJA 01/03/2026 -> Ene, Feb (baja día 1 excluye marzo)
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'BAJA', fecha_efecto: '2025-06-25', fecha_baja: '2026-03-01' }], '2026-01', '2026-03')),
    ['2026-01', '2026-02']
);
console.log('✓ P03: Mensual con baja día 1 de marzo (excluye marzo)');

// P04: Mensual, efecto 14/02/2026, ALTA -> Feb, Mar
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'ALTA', fecha_efecto: '2026-02-14' }], '2026-01', '2026-03')),
    ['2026-02', '2026-03']
);
console.log('✓ P04: Mensual con efecto dentro del periodo');

// P05: Anual, efecto 01/12/2022, ALTA (oct 2025–mar 2026) -> Dic 2025
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'ANUAL', situacion: 'ALTA', fecha_efecto: '2022-12-01' }], '2025-10', '2026-03')),
    ['2025-12']
);
console.log('✓ P05: Anual en mes aniversario');

// P06: Anual, efecto 01/12/2022, BAJA 15/11/2025 -> ninguna
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'ANUAL', situacion: 'BAJA', fecha_efecto: '2022-12-01', fecha_baja: '2025-11-15' }], '2025-10', '2026-03')),
    []
);
console.log('✓ P06: Anual con baja anterior al aniversario');

// P07: Trimestral, efecto 05/11/2025, ALTA (ene–jun 2026) -> Feb, May
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'TRIMESTRAL', situacion: 'ALTA', fecha_efecto: '2025-11-05' }], '2026-01', '2026-06')),
    ['2026-02', '2026-05']
);
console.log('✓ P07: Trimestral alta');

// P08: Semestral, efecto 05/03/2025, ALTA (ene–dic 2026) -> Mar, Sep
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'SEMESTRAL', situacion: 'ALTA', fecha_efecto: '2025-03-05' }], '2026-01', '2026-12')),
    ['2026-03', '2026-09']
);
console.log('✓ P08: Semestral alta');

// P09: Trimestral con baja 15/03/2026 -> Ene; con baja 02/04/2026 -> Ene, Abr
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'TRIMESTRAL', situacion: 'BAJA', fecha_efecto: '2025-10-10', fecha_baja: '2026-03-15' }], '2026-01', '2026-06')),
    ['2026-01']
);
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'TRIMESTRAL', situacion: 'BAJA', fecha_efecto: '2025-10-10', fecha_baja: '2026-04-02' }], '2026-01', '2026-06')),
    ['2026-01', '2026-04']
);
console.log('✓ P09: Trimestral con baja');

// P10: Semestral con baja 01/09/2026 -> Mar; falta -> Mar, Sep
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'SEMESTRAL', situacion: 'BAJA', fecha_efecto: '2025-03-05', fecha_baja: '2026-09-01' }], '2026-01', '2026-12')),
    ['2026-03']
);
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'SEMESTRAL', situacion: 'BAJA', fecha_efecto: '2025-03-05' }], '2026-01', '2026-12')),
    ['2026-03', '2026-09']
);
console.log('✓ P10: Semestral con baja / falta de fecha');

// P11: Mensual, efecto 01/01/2025, BAJA falta -> Ene, Feb, Mar con falta_fecha_baja = true y 0 avisos
const r11 = L([{ id: 9, cliente: 'X', numero_poliza: 'P', tipo_pago: 'MENSUAL', situacion: 'BAJA', fecha_efecto: '2025-01-01' }], '2026-01', '2026-03');
assert.deepEqual(meses(r11), ['2026-01', '2026-02', '2026-03']);
assert.equal(r11.avisos.length, 0);
assert.ok(r11.lineas.every((l: any) => l.falta_fecha_baja === true));
console.log('✓ P11: Mensual de baja sin fecha (incluida y destacada)');

// P12: Anual, efecto 01/02/2022, BAJA falta -> Feb (marcada)
assert.deepEqual(
    meses(L([{ id: 1, tipo_pago: 'ANUAL', situacion: 'BAJA', fecha_efecto: '2022-02-01' }], '2026-01', '2026-03')),
    ['2026-02']
);
console.log('✓ P12: Anual de baja sin fecha en mes de cobro');

// P13: Tipo de pago BIMESTRAL -> sin líneas, 1 aviso
const r13 = L([{ id: 2, tipo_pago: 'BIMESTRAL', situacion: 'ALTA', fecha_efecto: '2025-01-01' }], '2026-01', '2026-03');
assert.equal(r13.lineas.length, 0);
assert.equal(r13.avisos.length, 1);
console.log('✓ P13: Tipo de pago no reconocido genera aviso');

// P14: Días concretos (15/01/2026 a 15/02/2026) con mensual efecto 10/06/2025 -> Solo cobro de Feb (10/02/2026)
const r14 = L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'ALTA', fecha_efecto: '2025-06-10' }], '2026-01-15', '2026-02-15');
assert.deepEqual(r14.lineas.map((l: any) => l.fecha_cobro), ['2026-02-10']);
console.log('✓ P14: Rango por días concretos incluye solo cobros dentro del intervalo');

// P15: Días concretos (01/01/2026 a 15/01/2026) con efecto 20/01/2026 -> 0 líneas (cobro posterior al intervalo)
const r15 = L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'ALTA', fecha_efecto: '2026-01-20' }], '2026-01-01', '2026-01-15');
assert.equal(r15.lineas.length, 0);
console.log('✓ P15: Cobro fuera del rango de días concretos no se incluye');

// P16: Días concretos con baja antes del cobro (efecto 25/06/2025, baja 20/02/2026, periodo 01/01/2026 a 31/03/2026)
// Cobro 25/01/2026 es previo a la baja (incluido). Cobro 25/02/2026 es posterior a la baja (excluido).
const r16 = L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'BAJA', fecha_efecto: '2025-06-25', fecha_baja: '2026-02-20' }], '2026-01-01', '2026-03-31');
assert.deepEqual(r16.lineas.map((l: any) => l.fecha_cobro), ['2026-01-25']);
console.log('✓ P16: En rango por días, baja previa al día de cobro excluye el cobro');

// P17: Días concretos con BAJA sin fecha -> incluida por precaución
const r17 = L([{ id: 1, tipo_pago: 'MENSUAL', situacion: 'BAJA', fecha_efecto: '2025-06-10' }], '2026-01-01', '2026-02-15');
assert.deepEqual(r17.lineas.map((l: any) => l.fecha_cobro), ['2026-01-10', '2026-02-10']);
assert.ok(r17.lineas.every((l: any) => l.falta_fecha_baja === true));
console.log('✓ P17: En rango por días, BAJA sin fecha se incluye con marca falta_fecha_baja');

console.log('\n--- Comprobando Renovaciones (R01 a R08) ---');

// R01 a R05 en lote
const ren = R([
    { id: 1, situacion: 'ALTA', fecha_efecto: '2022-11-20', aseguradora_nombre: 'Hiscox' }, // R01: 20/11/2026, 4ª
    { id: 2, situacion: 'ALTA', fecha_efecto: '2026-11-01' },                                // R02: nueva prod, no aparece
    { id: 3, situacion: 'BAJA', fecha_efecto: '2023-12-01', fecha_baja: '2025-01-01' },    // R03: baja con fecha, no aparece
    { id: 4, situacion: 'ALTA', fecha_efecto: '2024-02-29' },                                // R05: 29 feb
    { id: 5, situacion: 'ALTA', fecha_efecto: '2025-12-31' },                                // R04: 31/12/2026, 1ª
], '2026-10-17', '2026-12-31');
assert.deepEqual(ren.map((x: any) => [x.id, x.fecha_renovacion, x.anualidad]), [[1, '2026-11-20', 4], [5, '2026-12-31', 1]]);
assert.ok(ren.every((x: any) => x.falta_fecha_baja === false));
console.log('✓ R01, R02, R03, R04: Renovaciones estándar, nueva producción excluida, bajas excluidas');

// R05: Bisiesto 29/02/2024 renueva 28/02/2027 en año no bisiesto
assert.deepEqual(
    R([{ id: 4, situacion: 'ALTA', fecha_efecto: '2024-02-29' }], '2027-02-01', '2027-03-01').map((x: any) => x.fecha_renovacion),
    ['2027-02-28']
);
console.log('✓ R05: 29 de febrero renueva 28 de febrero en año no bisiesto');

// R06: Cruzando año (10/01/2023 renueva 10/01/2027 en dic 2026 - ene 2027)
assert.deepEqual(
    R([{ id: 1, situacion: 'ALTA', fecha_efecto: '2023-01-10' }], '2026-12-01', '2027-01-31').map((x: any) => x.fecha_renovacion),
    ['2027-01-10']
);
console.log('✓ R06: Renovación cruzando fin de año');

// R07: BAJA sin fecha -> incluida y marcada
const renSin = R([{ id: 6, situacion: 'BAJA', fecha_efecto: '2024-11-15' }], '2026-10-17', '2026-12-31');
assert.deepEqual(renSin.map((x: any) => [x.id, x.fecha_renovacion, x.falta_fecha_baja]), [[6, '2024-11-15'.replace('2024', '2026'), true]]);
console.log('✓ R07: Baja sin fecha de baja aparece destacada');

// R08: No influye el tipo de pago (trimestral y semestral aparecen igual que anual)
assert.equal(
    R([
        { id: 1, situacion: 'ALTA', tipo_pago: 'TRIMESTRAL', fecha_efecto: '2024-11-15' },
        { id: 2, situacion: 'ALTA', tipo_pago: 'SEMESTRAL', fecha_efecto: '2023-12-01' }
    ], '2026-11-01', '2026-12-31').length,
    2
);
console.log('✓ R08: Pagos trimestrales y semestrales se renuevan anualmente');

console.log('\n--- Comprobando Validación (V01 a V06) ---');

// V01: BAJA sin fecha de baja -> error
assert.ok(V({ cliente: 'a', numero_poliza: '1', tipo_pago: 'anual', situacion: 'BAJA', fecha_efecto: '2025-01-01' }).errors.fecha_baja);
console.log('✓ V01: BAJA sin fecha produce error');

// V02: BAJA con fecha de baja anterior a efecto -> error
assert.ok(V({ cliente: 'a', numero_poliza: '1', tipo_pago: 'anual', situacion: 'BAJA', fecha_efecto: '2025-06-01', fecha_baja: '2025-05-01' }).errors.fecha_baja);
console.log('✓ V02: Fecha de baja anterior a fecha de efecto produce error');

// V03: ALTA con fecha de baja -> se guarda con fecha_baja = null
const v03 = V({ cliente: 'a', numero_poliza: '1', tipo_pago: 'anual', situacion: 'alta', fecha_efecto: '2025-01-01', fecha_baja: '2025-05-01' });
assert.deepEqual(v03.errors, {});
assert.equal(v03.value.fecha_baja, null);
console.log('✓ V03: ALTA con fecha_baja se limpia a null');

// V04: Tipo de pago fuera de catálogo -> error
assert.ok(V({ cliente: 'a', numero_poliza: '1', tipo_pago: 'BIMESTRAL', situacion: 'ALTA', fecha_efecto: '2025-01-01' }).errors.tipo_pago);
console.log('✓ V04: Tipo de pago fuera de catálogo produce error');

// V05: Situación fuera de catálogo -> error
assert.ok(V({ cliente: 'a', numero_poliza: '1', tipo_pago: 'ANUAL', situacion: 'PENDIENTE', fecha_efecto: '2025-01-01' }).errors.situacion);
console.log('✓ V05: Situación fuera de catálogo produce error');

// V06: Cliente o póliza vacíos -> error
assert.ok(V({ cliente: '  ', numero_poliza: '1', tipo_pago: 'ANUAL', situacion: 'ALTA', fecha_efecto: '2025-01-01' }).errors.cliente);
assert.ok(V({ cliente: 'a', numero_poliza: '', tipo_pago: 'ANUAL', situacion: 'ALTA', fecha_efecto: '2025-01-01' }).errors.numero_poliza);
console.log('✓ V06: Cliente y nº póliza obligatorios');

// V07: Año se infiere de la fecha de efecto
const v07 = V({ cliente: 'a', numero_poliza: '1', tipo_pago: 'ANUAL', situacion: 'ALTA', fecha_efecto: '2024-03-15' });
assert.equal(v07.value.año, 2024);
console.log('✓ V07: Año inferido correctamente de fecha_efecto');

console.log('\n========================================');
console.log('¡TODOS LOS CASOS DE PRUEBA (P01-P13, R01-R08, V01-V07) HAN PASADO CON ÉXITO!');
console.log('========================================\n');
