// Pruebas de las reglas de comisiones. Ejecutar: npx tsx scripts/test-comisiones-rules.ts
import { calcularLiquidacion as L, calcularRenovaciones as R, validateRegistro as V } from '../lib/comisiones-rules';
import assert from 'node:assert/strict';
const meses = (r:any)=>r.lineas.map((l:any)=>l.mes_liquidacion);
// 1. Mensual, trimestre Ene-Mar 2026, hoy de baja en mayo -> 3 meses
assert.deepEqual(meses(L([{id:1,tipo_pago:'MENSUAL',situacion:'BAJA',fecha_efecto:'2025-06-10',fecha_baja:'2026-05-03'}],'2026-01','2026-03')),['2026-01','2026-02','2026-03']);
// 2. Pagó dos meses y causó baja (baja 20/02) -> Ene, Feb
assert.deepEqual(meses(L([{id:1,tipo_pago:'mensual ',situacion:'BAJA',fecha_efecto:'2025-06-25',fecha_baja:'2026-02-20'}],'2026-01','2026-03')),['2026-01','2026-02']);
// baja el día 1 de marzo -> Ene, Feb
assert.deepEqual(meses(L([{id:1,tipo_pago:'MENSUAL',situacion:'BAJA',fecha_efecto:'2025-06-25',fecha_baja:'2026-03-01'}],'2026-01','2026-03')),['2026-01','2026-02']);
// mensual con efecto dentro del periodo
assert.deepEqual(meses(L([{id:1,tipo_pago:'MENSUAL',situacion:'ALTA',fecha_efecto:'2026-02-14'}],'2026-01','2026-03')),['2026-02','2026-03']);
// anual: cobro en mes aniversario, otros años
assert.deepEqual(meses(L([{id:1,tipo_pago:'ANUAL',situacion:'ALTA',fecha_efecto:'2022-12-01'}],'2025-10','2026-03')),['2025-12']);
// anual de baja antes del aniversario -> nada
assert.deepEqual(meses(L([{id:1,tipo_pago:'ANUAL',situacion:'BAJA',fecha_efecto:'2022-12-01',fecha_baja:'2025-11-15'}],'2025-10','2026-03')),[]);
// trimestral y semestral
assert.deepEqual(meses(L([{id:1,tipo_pago:'TRIMESTRAL',situacion:'ALTA',fecha_efecto:'2025-11-05'}],'2026-01','2026-06')),['2026-02','2026-05']);
assert.deepEqual(meses(L([{id:1,tipo_pago:'SEMESTRAL',situacion:'ALTA',fecha_efecto:'2025-03-05'}],'2026-01','2026-12')),['2026-03','2026-09']);
// trimestral y semestral con baja: misma regla que anual/mensual
assert.deepEqual(meses(L([{id:1,tipo_pago:'TRIMESTRAL',situacion:'BAJA',fecha_efecto:'2025-10-10',fecha_baja:'2026-03-15'}],'2026-01','2026-06')),['2026-01']);
assert.deepEqual(meses(L([{id:1,tipo_pago:'TRIMESTRAL',situacion:'BAJA',fecha_efecto:'2025-10-10',fecha_baja:'2026-04-02'}],'2026-01','2026-06')),['2026-01','2026-04']);
assert.deepEqual(meses(L([{id:1,tipo_pago:'SEMESTRAL',situacion:'BAJA',fecha_efecto:'2025-03-05',fecha_baja:'2026-09-01'}],'2026-01','2026-12')),['2026-03']);
assert.deepEqual(meses(L([{id:1,tipo_pago:'SEMESTRAL',situacion:'BAJA',fecha_efecto:'2025-03-05'}],'2026-01','2026-12')),['2026-03','2026-09']);
assert.deepEqual(meses(L([{id:1,tipo_pago:'trimestral',situacion:'BAJA',fecha_efecto:'2025-11-05'}],'2026-01','2026-03')),['2026-02']);
// renovaciones: no dependen del tipo de pago
assert.equal(R([{id:1,situacion:'ALTA',tipo_pago:'TRIMESTRAL',fecha_efecto:'2024-11-15'},{id:2,situacion:'ALTA',tipo_pago:'SEMESTRAL',fecha_efecto:'2023-12-01'}],'2026-11-01','2026-12-31').length,2);
// baja sin fecha -> se incluye por precaución, destacada, sin aviso
const r = L([{id:9,cliente:'X',numero_poliza:'P',tipo_pago:'MENSUAL',situacion:'BAJA',fecha_efecto:'2025-01-01'}],'2026-01','2026-03');
assert.deepEqual(meses(r),['2026-01','2026-02','2026-03']); assert.equal(r.avisos.length,0);
assert.ok(r.lineas.every((l:any)=>l.falta_fecha_baja===true));
// anual de baja sin fecha: solo si su mes de cobro cae en el periodo
assert.deepEqual(meses(L([{id:1,tipo_pago:'ANUAL',situacion:'BAJA',fecha_efecto:'2022-12-01'}],'2026-01','2026-03')),[]);
assert.deepEqual(meses(L([{id:1,tipo_pago:'ANUAL',situacion:'BAJA',fecha_efecto:'2022-02-01'}],'2026-01','2026-03')),['2026-02']);
// las de alta o con fecha de baja no van destacadas
assert.ok(L([{id:1,tipo_pago:'MENSUAL',situacion:'BAJA',fecha_efecto:'2025-06-25',fecha_baja:'2026-02-20'}],'2026-01','2026-03').lineas.every((l:any)=>l.falta_fecha_baja===false));
// otros errores siguen siendo aviso
assert.equal(L([{id:2,tipo_pago:'BIMESTRAL',situacion:'ALTA',fecha_efecto:'2025-01-01'}],'2026-01','2026-03').avisos.length,1);
// Renovaciones
const ren = R([
 {id:1,situacion:'ALTA',fecha_efecto:'2022-11-20',aseguradora_nombre:'Hiscox'},
 {id:2,situacion:'ALTA',fecha_efecto:'2026-11-01'}, // nueva producción, no renovación
 {id:3,situacion:'BAJA',fecha_efecto:'2023-12-01',fecha_baja:'2025-01-01'},
 {id:4,situacion:'ALTA',fecha_efecto:'2024-02-29'},
 {id:5,situacion:'ALTA',fecha_efecto:'2025-12-31'},
],'2026-10-17','2026-12-31');
assert.deepEqual(ren.map((x:any)=>[x.id,x.fecha_renovacion,x.anualidad]),[[1,'2026-11-20',4],[5,'2026-12-31',1]]);
assert.ok(ren.every((x:any)=>x.falta_fecha_baja===false));
// renovación de baja sin fecha de baja -> incluida y destacada
const renSin = R([{id:6,situacion:'BAJA',fecha_efecto:'2024-11-15'}],'2026-10-17','2026-12-31');
assert.deepEqual(renSin.map((x:any)=>[x.id,x.fecha_renovacion,x.falta_fecha_baja]),[[6,'2026-11-15',true]]);
assert.deepEqual(R([{id:4,situacion:'ALTA',fecha_efecto:'2024-02-29'}],'2027-02-01','2027-03-01').map((x:any)=>x.fecha_renovacion),['2027-02-28']);
// cruzando año
assert.deepEqual(R([{id:1,situacion:'ALTA',fecha_efecto:'2023-01-10'}],'2026-12-01','2027-01-31').map((x:any)=>x.fecha_renovacion),['2027-01-10']);
// Validación
assert.ok(V({cliente:'a',numero_poliza:'1',tipo_pago:'anual',situacion:'BAJA',fecha_efecto:'2025-01-01'}).errors.fecha_baja);
assert.deepEqual(V({cliente:'a',numero_poliza:'1',tipo_pago:'anual',situacion:'alta',fecha_efecto:'2025-01-01',fecha_baja:'2025-05-01'}).errors,{});
assert.equal(V({cliente:'a',numero_poliza:'1',tipo_pago:'anual',situacion:'alta',fecha_efecto:'2025-01-01',fecha_baja:'2025-05-01'}).value.fecha_baja,null);
assert.ok(V({cliente:'a',numero_poliza:'1',tipo_pago:'BIMESTRAL',situacion:'ALTA',fecha_efecto:'2025-01-01'}).errors.tipo_pago);
console.log('OK todos los casos');
