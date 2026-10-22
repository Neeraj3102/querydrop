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
      locateFile: () => new URL('../sql-wasm.wasm', import.meta.url).href,
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
  if (val instanceof Date) return 'TEXT';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'INTEGER' : 'REAL';
  }
  if (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
    return val.includes('.') ? 'REAL' : 'INTEGER';
  }
  return 'TEXT';
}

function sanitizeBindingValue(val: any): any {
  if (val === undefined || val === null) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') return JSON.stringify(val);
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

function sanitizeIdentifier(name: string, fallback = 'col'): string {
  const clean = name.trim().replace(/[^a-zA-Z0-9_]/g, '_');
  if (!clean || /^_+$/.test(clean)) return fallback;
  if (/^[0-9]/.test(clean)) return `col_${clean}`;
  return clean;
}

// Ingest CSV content into an SQLite Table
async function loadCSV(tableName: string, csvContent: string) {
  await initEngine();
  if (!db) throw new Error('Database not initialized');

  const startTime = performance.now();
  const safeTableName = sanitizeIdentifier(tableName, 'dataset');

  self.postMessage({
    type: 'PROGRESS',
    phase: `Parsing CSV data for "${safeTableName}"...`,
    percent: 25,
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

  const rawFields = parsed.meta.fields || Object.keys(rows[0]);
  
  // Sanitize and deduplicate column names
  const safeFields: string[] = [];
  const seenNames: Record<string, number> = {};
  rawFields.forEach((field, idx) => {
    let sanitized = sanitizeIdentifier(field, `column_${idx + 1}`);
    if (seenNames[sanitized] !== undefined) {
      seenNames[sanitized]++;
      sanitized = `${sanitized}_${seenNames[sanitized]}`;
    } else {
      seenNames[sanitized] = 1;
    }
    safeFields.push(sanitized);
  });

  // Infer types using sample rows
  const sampleSize = Math.min(rows.length, 100);
  const columnTypes: Record<string, string> = {};

  rawFields.forEach((field, idx) => {
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
    percent: 50,
  });

  // Batch insert rows within a single transaction
  db.run('BEGIN TRANSACTION;');
  const placeholders = safeFields.map(() => '?').join(', ');
  const insertSql = `INSERT INTO "${safeTableName}" VALUES (${placeholders});`;
  const stmt = db.prepare(insertSql);

  const reportInterval = Math.max(5000, Math.floor(rows.length / 10));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const values = rawFields.map((field) => sanitizeBindingValue(row[field]));
    stmt.run(values);

    if (i > 0 && i % reportInterval === 0 && rows.length > 5000) {
      const pct = Math.round(50 + (i / rows.length) * 45);
      self.postMessage({
        type: 'PROGRESS',
        phase: `Inserted ${i.toLocaleString()} / ${rows.length.toLocaleString()} rows...`,
        percent: pct,
      });
    }
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
    const rowsAffected = db.getRowsModified();

    if (!res || res.length === 0) {
      self.postMessage({
        type: 'QUERY_RESULT',
        id,
        columns: [],
        rows: [],
        rowCount: 0,
        rowsAffected,
        executionTimeMs,
      });
      await broadcastSchema();
      return;
    }

    // If multi-statement query, pick the last non-empty result set
    const activeResult = res[res.length - 1];
    const { columns, values } = activeResult;

    self.postMessage({
      type: 'QUERY_RESULT',
      id,
      columns,
      rows: values,
      rowCount: values.length,
      rowsAffected,
      executionTimeMs,
    });

    // Check if query modified schema (CREATE, DROP, ALTER)
    if (/^\s*(CREATE|DROP|ALTER)\b/i.test(sql)) {
      await broadcastSchema();
    }
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
    } else if (data.type === 'EXPORT_DB') {
      await initEngine();
      if (!db) throw new Error('Database not initialized');
      const binaryArray = db.export();
      self.postMessage({
        type: 'DB_EXPORTED',
        buffer: binaryArray,
      });
    } else if (data.type === 'RESET_DB') {
      if (db) {
        db.close();
        if (SQL) db = new SQL.Database();
      }
      await broadcastSchema();
      self.postMessage({
        type: 'PROGRESS',
        phase: 'Database reset to empty state',
        percent: 100,
      });
    } else if (data.type === 'DROP_TABLE') {
      if (!db) throw new Error('Database not initialized');
      const safe = sanitizeIdentifier(data.tableName);
      db.run(`DROP TABLE IF EXISTS "${safe}";`);
      await broadcastSchema();
    }
  } catch (err: any) {
    console.error('SQL Worker processing error:', err);
    self.postMessage({
      type: 'ERROR',
      message: err?.message || String(err) || 'Worker processing error',
    });
  }
};
