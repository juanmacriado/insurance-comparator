import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'comisiones.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS aseguradoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registros_comisiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aseguradora_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    tipo_registro TEXT NOT NULL, -- 'Producción Anual', 'Producción Mensual', 'Cartera Anual', 'Cartera Mensual'
    cliente TEXT,
    situacion TEXT,
    tipo_pago TEXT,
    numero_poliza TEXT,
    fecha_efecto TEXT,
    pago_hiscox REAL,
    producto TEXT,
    prima_neta REAL,
    prima_total REAL,
    porcentaje_comision REAL,
    neto_comision REAL,
    comprobacion_prima REAL,
    importe_liquidar REAL,
    comprobacion_datos REAL,
    FOREIGN KEY (aseguradora_id) REFERENCES aseguradoras(id)
  );
`);

async function getAseguradoras() {
  return db.prepare('SELECT * FROM aseguradoras ORDER BY nombre ASC').all();
}

async function addAseguradora(nombre) {
  const info = db.prepare('INSERT OR IGNORE INTO aseguradoras (nombre) VALUES (?)').run(nombre);
  if (info.changes === 0) {
    const row = db.prepare('SELECT id FROM aseguradoras WHERE nombre = ?').get(nombre);
    return row.id;
  }
  return info.lastInsertRowid;
}

async function getRegistros(aseguradoraId: number, año: number | null = null, tipo: string | null = null) {
  let query = 'SELECT * FROM registros_comisiones WHERE aseguradora_id = ?';
  const params: any[] = [aseguradoraId];

  if (año) {
    query += ' AND año = ?';
    params.push(año);
  }
  if (tipo) {
    query += ' AND tipo_registro = ?';
    params.push(tipo);
  }

  return db.prepare(query).all(...params);
}

async function addRegistro(registro) {
  const pNeta = Number(registro.prima_neta || 0);
  const pTotal = Number(registro.prima_total || 0);
  const pct = Number(registro.porcentaje_comision || 0);
  const neto = Number(registro.neto_comision || 0);
  const impLiq = Number(registro.importe_liquidar || 0);

  const compPrima = (pNeta * (pct / 100)) - neto;
  const compDatos = (pTotal - (pNeta * (pct / 100))) - impLiq;

  const stmt = db.prepare(`
    INSERT INTO registros_comisiones (
      aseguradora_id, año, tipo_registro, cliente, situacion, tipo_pago, 
      numero_poliza, fecha_efecto, pago_hiscox, producto, prima_neta, 
      prima_total, porcentaje_comision, neto_comision, comprobacion_prima,
      importe_liquidar, comprobacion_datos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    registro.aseguradora_id,
    registro.año,
    registro.tipo_registro,
    registro.cliente,
    registro.situacion,
    registro.tipo_pago,
    registro.numero_poliza,
    registro.fecha_efecto,
    registro.pago_hiscox,
    registro.producto,
    registro.prima_neta,
    registro.prima_total,
    registro.porcentaje_comision,
    registro.neto_comision,
    compPrima, // Calculated
    registro.importe_liquidar,
    compDatos // Calculated
  );
}

async function updateRegistro(id, registro) {
  const pNeta = Number(registro.prima_neta || 0);
  const pTotal = Number(registro.prima_total || 0);
  const pct = Number(registro.porcentaje_comision || 0);
  const neto = Number(registro.neto_comision || 0);
  const impLiq = Number(registro.importe_liquidar || 0);

  const compPrima = (pNeta * (pct / 100)) - neto;
  const compDatos = (pTotal - (pNeta * (pct / 100))) - impLiq;

  const stmt = db.prepare(`
    UPDATE registros_comisiones SET
      cliente = ?, situacion = ?, tipo_pago = ?, numero_poliza = ?, 
      fecha_efecto = ?, pago_hiscox = ?, producto = ?, prima_neta = ?, 
      prima_total = ?, porcentaje_comision = ?, neto_comision = ?, 
      comprobacion_prima = ?, importe_liquidar = ?, comprobacion_datos = ?
    WHERE id = ?
  `);

  return stmt.run(
    registro.cliente,
    registro.situacion,
    registro.tipo_pago,
    registro.numero_poliza,
    registro.fecha_efecto,
    registro.pago_hiscox,
    registro.producto,
    registro.prima_neta,
    registro.prima_total,
    registro.porcentaje_comision,
    registro.neto_comision,
    compPrima, // Calculated
    registro.importe_liquidar,
    compDatos, // Calculated
    id
  );
}

async function deleteRegistro(id) {
  return db.prepare('DELETE FROM registros_comisiones WHERE id = ?').run(id);
}

export {
  db,
  getAseguradoras,
  addAseguradora,
  getRegistros,
  addRegistro,
  updateRegistro,
  deleteRegistro
};
