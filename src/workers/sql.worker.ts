import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import Papa from 'papaparse';
import type { TableSchema, TableColumn, WorkerIncomingMessage } from '../types';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Initialize SQLite WebAssembly
async function initEngine() {
  if (!SQL) {
    self.postMessage({
      type: 'PROGRESS',
      phase: 'Initializing SQLite WebAssembly Engine...',
      percent: 10,
    });

    SQL = await initSqlJs({
      locateFile: () => './sql-wasm.wasm',
    });
    db = new SQL.Database();

    self.postMessage({
      type: 'PROGRESS',
      phase: 'SQLite Engine Ready',
      percent: 100,
    });
  }
}

// Infer SQLite column type from JS sample values
function inferType(val: any): string {
  if (val === null || val === undefined || val === '') return 'TEXT';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'INTEGER' : 'REAL';
  }
  if (!isNaN(Number(val)) && val.trim?.() !== '') {
    return val.includes('.') ? 'REAL' : 'INTEGER';
  }
  return 'TEXT';
}

function sanitizeIdentifier(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_]/g, '_');
}

// Ingest CSV content into an SQLite Table
async function loadCSV(tableName: string, csvContent: string) {
  await initEngine();
  if (!db) throw new Error('Database not initialized');

  const startTime = performance.now();
  const safeTableName = sanitizeIdentifier(tableName);

  self.postMessage({
    type: 'PROGRESS',
    phase: `Parsing CSV data for ${safeTableName}...`,
    percent: 30,
  });

  const parsed = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV Parsing Error: ${parsed.errors[0].message}`);
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    throw new Error('CSV file contains no rows');
  }

  const fields = parsed.meta.fields || Object.keys(rows[0]);
  const safeFields = fields.map((f) => sanitizeIdentifier(f));

  // Infer types using sample rows
  const sampleSize = Math.min(rows.length, 100);
  const columnTypes: Record<string, string> = {};

  fields.forEach((field, idx) => {
    const safeCol = safeFields[idx];
    let detectedType = 'TEXT';
    for (let i = 0; i < sampleSize; i++) {
      const v = rows[i][field];
      if (v !== null && v !== undefined && v !== '') {
        detectedType = inferType(v);
        if (detectedType !== 'INTEGER') break;
      }
    }
    columnTypes[safeCol] = detectedType;
  });

  // Drop existing table if it exists
  db.run(`DROP TABLE IF EXISTS "${safeTableName}";`);

  // Build CREATE TABLE SQL
  const colDefs = safeFields
    .map((col) => `"${col}" ${columnTypes[col]}`)
    .join(', ');
  const createSql = `CREATE TABLE "${safeTableName}" (${colDefs});`;
  db.run(createSql);

  self.postMessage({
    type: 'PROGRESS',
    phase: `Inserting ${rows.length.toLocaleString()} rows into SQLite...`,
    percent: 60,
  });

  // Batch insert rows within a single transaction
  db.run('BEGIN TRANSACTION;');
  const placeholders = safeFields.map(() => '?').join(', ');
  const insertSql = `INSERT INTO "${safeTableName}" VALUES (${placeholders});`;
  const stmt = db.prepare(insertSql);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const values = fields.map((field) => {
      const val = row[field];
      return val === undefined ? null : val;
    });
    stmt.run(values);
  }
  stmt.free();
  db.run('COMMIT;');

  const loadTimeMs = Math.round(performance.now() - startTime);

  const columns: TableColumn[] = safeFields.map((f) => ({
    name: f,
    type: columnTypes[f],
  }));

  self.postMessage({
    type: 'CSV_LOADED',
    tableName: safeTableName,
    rowCount: rows.length,
    columns,
    loadTimeMs,
  });

  // Broadcast updated schema
  await broadcastSchema();
}

async function runQuery(id: string, sql: string) {
  await initEngine();
  if (!db) throw new Error('Database engine not initialized');

  const startTime = performance.now();
  try {
    const res = db.exec(sql);
    const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

    if (!res || res.length === 0) {
      self.postMessage({
        type: 'QUERY_RESULT',
        id,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
      });
      await broadcastSchema();
      return;
    }

    const { columns, values } = res[0];

    self.postMessage({
      type: 'QUERY_RESULT',
      id,
      columns,
      rows: values,
      rowCount: values.length,
      executionTimeMs,
    });
  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      queryId: id,
      message: err?.message || 'SQL Execution Error',
    });
  }
}

async function broadcastSchema() {
  if (!db) return;
  try {
    const tablesRes = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    if (!tablesRes || tablesRes.length === 0) {
      self.postMessage({ type: 'SCHEMA_UPDATE', tables: [] });
      return;
    }

    const tableNames = tablesRes[0].values.map((v) => v[0] as string);
    const tables: TableSchema[] = [];

    for (const tableName of tableNames) {
      const colRes = db.exec(`PRAGMA table_info("${tableName}");`);
      const columns: TableColumn[] = [];
      if (colRes && colRes.length > 0) {
        for (const row of colRes[0].values) {
          columns.push({
            name: row[1] as string,
            type: (row[2] as string) || 'TEXT',
          });
        }
      }

      const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName}";`);
      const rowCount = countRes && countRes[0] ? (countRes[0].values[0][0] as number) : 0;

      tables.push({
        tableName,
        columns,
        rowCount,
      });
    }

    self.postMessage({ type: 'SCHEMA_UPDATE', tables });
  } catch (e: any) {
    console.error('Failed to get schema:', e);
  }
}

self.onmessage = async (e: MessageEvent<WorkerIncomingMessage>) => {
  const data = e.data;
  try {
    if (data.type === 'LOAD_CSV') {
      await loadCSV(data.tableName, data.csvContent);
    } else if (data.type === 'RUN_QUERY') {
      await runQuery(data.id, data.sql);
    } else if (data.type === 'GET_SCHEMA') {
      await initEngine();
      await broadcastSchema();
    }
  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      message: err?.message || 'Worker processing error',
    });
  }
};
