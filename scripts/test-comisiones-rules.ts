// Pruebas completas de las reglas de comisiones (EV-01 a EV-08).
// Ejecutar: npx tsx scripts/test-comisiones-rules.ts
import { calcularLiquidacion as L, calcularRenovaciones as R, validateRegistro as V, calcularProximasLiquidaciones as PL, obtenerAltasVigentes as AV } from '../lib/comisiones-rules';
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

// R07: Una póliza de BAJA nunca renueva, tenga o no fecha de baja (decisión 18/10/2026)
const renSin = R([{ id: 6, situacion: 'BAJA', fecha_efecto: '2024-11-15' }], '2026-10-17', '2026-12-31');
assert.deepEqual(renSin, []);
const renCon = R([{ id: 7, situacion: 'BAJA', fecha_efecto: '2024-11-15', fecha_baja: '2026-01-10' }], '2026-10-17', '2026-12-31');
assert.deepEqual(renCon, []);
console.log('✓ R07: Las pólizas de BAJA (con o sin fecha de baja) no renuevan');

// R08: No influye el tipo de pago (trimestral y semestral aparecen igual que anual)
assert.equal(
    R([
        { id: 1, situacion: 'ALTA', tipo_pago: 'TRIMESTRAL', fecha_efecto: '2024-11-15' },
        { id: 2, situacion: 'ALTA', tipo_pago: 'SEMESTRAL', fecha_efecto: '2023-12-01' }
    ], '2026-11-01', '2026-12-31').length,
    2
);
console.log('✓ R08: Pagos trimestrales y semestrales se renuevan anualmente');

// R09: Anualidad continua calculada a partir del registro más antiguo con el mismo número de póliza
// Caso Comunistone: nuevo registro con efecto 2026-11-20, pero con registro original histórico de 2023-11-20
const renComunistone = R([
    { id: 10, numero_poliza: 'POL-COMUNISTONE', situacion: 'BAJA', fecha_efecto: '2023-11-20', fecha_baja: '2026-11-20' }, // histórico
    { id: 11, numero_poliza: 'POL-COMUNISTONE', situacion: 'ALTA', fecha_efecto: '2026-11-20' }                            // nuevo registro de alta
], '2027-11-01', '2027-11-30');
assert.equal(renComunistone.length, 1);
assert.equal(renComunistone[0].fecha_renovacion, '2027-11-20');
assert.equal(renComunistone[0].anualidad, 4); // 2027 - 2023 = 4ª anualidad, no se reinicia a 1ª
console.log('✓ R09: La anualidad no se reinicia con el nuevo registro de ALTA; cuenta desde el origen histórico');

// R10: Deduplicación si dos registros de la misma póliza generasen la misma fecha de renovación
const renDedupe = R([
    { id: 20, numero_poliza: 'POL-DUP', situacion: 'ALTA', fecha_efecto: '2024-05-10', prima_total: 500 },
    { id: 21, numero_poliza: 'POL-DUP', situacion: 'ALTA', fecha_efecto: '2025-05-10', prima_total: 550 }
], '2026-05-01', '2026-05-31');
assert.equal(renDedupe.length, 1);
assert.equal(renDedupe[0].id, 21); // Conserva el registro más reciente
console.log('✓ R10: Deduplicación de renovación para la misma póliza y fecha');

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

console.log('\n--- Comprobando Próximas Liquidaciones (PL01 a PL04) ---');

// PL01: Mensual efecto 25/09/2026, periodo aseguradora 30 días, ventana 17/10/2026 a 17/11/2026 -> Cobro 25/09 vence 25/10 (en ventana)
const pl01 = PL([
    { id: 1, cliente: 'A', situacion: 'ALTA', tipo_pago: 'MENSUAL', fecha_efecto: '2026-09-25' }
], 30, '2026-10-17', '2026-11-17');
assert.equal(pl01.length, 1);
assert.equal(pl01[0].fecha_cobro, '2026-09-25');
assert.equal(pl01[0].fecha_limite_liquidacion, '2026-10-25');
console.log('✓ PL01: Próxima liquidación mensual calculada con +30 días sobre fecha de cobro');

// PL02: Anual efecto 10/10/2025, periodo aseguradora 30 días, ventana 17/10/2026 a 17/11/2026 -> Cobro 10/10/2026 vence 09/11/2026
const pl02 = PL([
    { id: 2, cliente: 'B', situacion: 'ALTA', tipo_pago: 'ANUAL', fecha_efecto: '2025-10-10' }
], 30, '2026-10-17', '2026-11-17');
assert.equal(pl02.length, 1);
assert.equal(pl02[0].fecha_cobro, '2026-10-10');
assert.equal(pl02[0].fecha_limite_liquidacion, '2026-11-09');
console.log('✓ PL02: Próxima liquidación anual (aniversario + 30 días) incluida en el próximo mes');

// PL03: BAJA confirmada antes del cobro -> excluida
const pl03 = PL([
    { id: 3, cliente: 'C', situacion: 'BAJA', tipo_pago: 'MENSUAL', fecha_efecto: '2026-08-25', fecha_baja: '2026-09-20' }
], 30, '2026-10-17', '2026-11-17');
assert.equal(pl03.length, 0);
console.log('✓ PL03: Póliza de BAJA con fecha de baja anterior al cobro queda excluida');

// PL04: BAJA sin fecha -> incluida por precaución con falta_fecha_baja = true
const pl04 = PL([
    { id: 4, cliente: 'D', situacion: 'BAJA', tipo_pago: 'MENSUAL', fecha_efecto: '2026-09-25' }
], 30, '2026-10-17', '2026-11-17');
assert.equal(pl04.length, 1);
assert.ok(pl04[0].falta_fecha_baja === true);
console.log('✓ PL04: BAJA sin fecha de baja se incluye por precaución destacada');

console.log('\n--- Comprobando Pólizas de ALTA Vigentes (AV01 a AV02) ---');

// AV01: Filtra solo pólizas de ALTA activas (excluye BAJAs y ALTA con fecha_baja)
const altas = AV([
    { id: 1, numero_poliza: 'P1', cliente: 'Cliente A', producto: 'RC', fecha_efecto: '2026-10-01', situacion: 'ALTA', aseguradora_nombre: 'Hiscox', tipo_pago: 'ANUAL', prima_total: 1000, prima_neta: 800 },
    { id: 2, numero_poliza: 'P2', cliente: 'Cliente B', producto: 'D&O', fecha_efecto: '2026-11-15', situacion: 'ALTA', aseguradora_nombre: 'Hiscox', tipo_pago: 'ANUAL', prima_total: 1500, prima_neta: 1200 },
    { id: 3, numero_poliza: 'P3', cliente: 'Cliente C', producto: 'CIBER', fecha_efecto: '2025-01-01', situacion: 'BAJA', fecha_baja: '2026-05-01' },
    { id: 4, numero_poliza: 'P4', cliente: 'Cliente D', producto: 'VIDA', fecha_efecto: '2025-01-01', situacion: 'ALTA', fecha_baja: '2026-05-01' }, // inconsistente con fecha_baja
    { id: 5, numero_poliza: '', cliente: 'Cliente E', producto: 'AUTO', fecha_efecto: '2026-01-01', situacion: 'ALTA' } // sin nº póliza
]);
assert.equal(altas.length, 2);
assert.equal(altas[0].numero_poliza, 'P2'); // 2026-11-15 va antes que 2026-10-01 por orden DESC de fecha_efecto
assert.equal(altas[1].numero_poliza, 'P1');
assert.equal(altas[0].aseguradora, 'Hiscox');
console.log('✓ AV01: Solo incluye pólizas en ALTA activa, ordenadas por fecha de efecto descendente');

// AV02: Control inverso para agente Claude - detección de ALTA ya registrada cerca de la fecha de renovación
const avisoHiscox = { poliza: 'P2', fecha_renovacion_aviso: '2026-11-15' };
const yaRegistrada = altas.some(a => a.numero_poliza === avisoHiscox.poliza && Math.abs(new Date(a.fecha_efecto).getTime() - new Date(avisoHiscox.fecha_renovacion_aviso).getTime()) <= 31 * 86400000);
assert.ok(yaRegistrada);
console.log('✓ AV02: Control inverso detecta correctamente que la póliza avisada ya tiene un registro de ALTA');

console.log('\n========================================');
console.log('¡TODOS LOS CASOS DE PRUEBA (P01-P17, R01-R10, V01-V07, PL01-PL04, AV01-AV02) HAN PASADO CON ÉXITO!');
console.log('========================================\n');

