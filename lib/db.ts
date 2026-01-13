
import { sql } from '@vercel/postgres';

async function getAseguradoras() {
  const { rows } = await sql`SELECT * FROM aseguradoras ORDER BY nombre ASC`;
  return rows;
}

async function addAseguradora(nombre: string) {
  // Try to insert
  const result = await sql`
    INSERT INTO aseguradoras (nombre) VALUES (${nombre})
    ON CONFLICT (nombre) DO NOTHING
    RETURNING id
  `;

  if (result.rows.length > 0) {
    return result.rows[0].id;
  } else {
    // Already exists
    const existing = await sql`SELECT id FROM aseguradoras WHERE nombre = ${nombre}`;
    return existing.rows[0].id;
  }
}

async function getRegistros(aseguradoraId: number, año: number | null = null, tipo: string | null = null) {
  // Dynamic query construction with vercel postgres is a bit tricky with template literals.
  // We can't easily concatenate strings. Instead we usually handle logic or use a helper.
  // For simplicity, we can use conditional logic but sql template literals expect static parts.
  // Actually, we can just use plain if statements to build the query? 
  // No, vercel/postgres 'sql' tag is strict.

  // However, we can fetch all for the insurer and filter in JS if the volume is low, 
  // OR we can write separate queries.
  // Given we only have 3 params, let's just be explicit or use a smarter way?
  // Let's just create the query conditionally.

  // Note: Vercel Postgres doesn't support dynamic query building via string concat easily with safety.
  // But we can filter by logic:
  // WHERE aseguradora_id = ${id} AND (${año}::int IS NULL OR año = ${año}) ...

  // Let's use that trick (passing null to SQL and checking IS NULL or equal).

  const { rows } = await sql`
    SELECT * FROM registros_comisiones 
    WHERE aseguradora_id = ${aseguradoraId}
    AND (${año}::int IS NULL OR año = ${año})
    AND (${tipo}::text IS NULL OR tipo_registro = ${tipo})
  `;
  return rows;
}

async function addRegistro(registro: any) {
  const pNeta = Number(registro.prima_neta || 0);
  const pTotal = Number(registro.prima_total || 0);
  const pct = Number(registro.porcentaje_comision || 0);
  const neto = Number(registro.neto_comision || 0);
  const impLiq = Number(registro.importe_liquidar || 0);

  const compPrima = (pNeta * (pct / 100)) - neto;
  const compDatos = (pTotal - (pNeta * (pct / 100))) - impLiq;

  const result = await sql`
    INSERT INTO registros_comisiones (
      aseguradora_id, año, tipo_registro, cliente, situacion, tipo_pago, 
      numero_poliza, fecha_efecto, pago_hiscox, producto, prima_neta, 
      prima_total, porcentaje_comision, neto_comision, comprobacion_prima,
      importe_liquidar, comprobacion_datos
    ) VALUES (
      ${registro.aseguradora_id}, ${registro.año}, ${registro.tipo_registro}, 
      ${registro.cliente}, ${registro.situacion}, ${registro.tipo_pago}, 
      ${registro.numero_poliza}, ${registro.fecha_efecto}, ${registro.pago_hiscox}, 
      ${registro.producto}, ${registro.prima_neta}, ${registro.prima_total}, 
      ${registro.porcentaje_comision}, ${registro.neto_comision}, ${compPrima}, 
      ${registro.importe_liquidar}, ${compDatos}
    )
    RETURNING id
  `;
  return { lastInsertRowid: result.rows[0].id };
}

async function updateRegistro(id: number, registro: any) {
  const pNeta = Number(registro.prima_neta || 0);
  const pTotal = Number(registro.prima_total || 0);
  const pct = Number(registro.porcentaje_comision || 0);
  const neto = Number(registro.neto_comision || 0);
  const impLiq = Number(registro.importe_liquidar || 0);

  const compPrima = (pNeta * (pct / 100)) - neto;
  const compDatos = (pTotal - (pNeta * (pct / 100))) - impLiq;

  await sql`
    UPDATE registros_comisiones SET
      cliente = ${registro.cliente},
      situacion = ${registro.situacion},
      tipo_pago = ${registro.tipo_pago},
      numero_poliza = ${registro.numero_poliza},
      fecha_efecto = ${registro.fecha_efecto},
      pago_hiscox = ${registro.pago_hiscox},
      producto = ${registro.producto},
      prima_neta = ${registro.prima_neta},
      prima_total = ${registro.prima_total},
      porcentaje_comision = ${registro.porcentaje_comision},
      neto_comision = ${registro.neto_comision},
      comprobacion_prima = ${compPrima},
      importe_liquidar = ${registro.importe_liquidar},
      comprobacion_datos = ${compDatos}
    WHERE id = ${id}
  `;
}

async function deleteRegistro(id: number) {
  await sql`DELETE FROM registros_comisiones WHERE id = ${id}`;
}

async function deleteRegistrosByYear(year: number) {
  await sql`DELETE FROM registros_comisiones WHERE año = ${year}`;
}

export {
  sql, // exporting sql client just in case
  getAseguradoras,
  addAseguradora,
  getRegistros,
  addRegistro,
  updateRegistro,
  deleteRegistro,
  deleteRegistrosByYear
};
