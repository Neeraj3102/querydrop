export interface TableColumn {
  name: string;
  type: string;
}

export interface TableSchema {
  tableName: string;
  columns: TableColumn[];
  rowCount: number;
  sampleRows?: Record<string, any>[];
}

export interface QueryResult {
  id: string;
  columns: string[];
  rows: any[][];
  rowCount: number;
  rowsAffected?: number;
  executionTimeMs: number;
  error?: string;
}

export interface WorkerLoadCSVPayload {
  type: 'LOAD_CSV';
  tableName: string;
  csvContent: string;
}

export interface WorkerRunQueryPayload {
  type: 'RUN_QUERY';
  id: string;
  sql: string;
}

export interface WorkerGetSchemaPayload {
  type: 'GET_SCHEMA';
}

export interface WorkerExportDbPayload {
  type: 'EXPORT_DB';
}

export interface WorkerResetDbPayload {
  type: 'RESET_DB';
}

export interface WorkerDropTablePayload {
  type: 'DROP_TABLE';
  tableName: string;
}

export type WorkerIncomingMessage =
  | WorkerLoadCSVPayload
  | WorkerRunQueryPayload
  | WorkerGetSchemaPayload
  | WorkerExportDbPayload
  | WorkerResetDbPayload
  | WorkerDropTablePayload;

export interface WorkerSuccessResponse {
  type: 'CSV_LOADED';
  tableName: string;
  rowCount: number;
  columns: TableColumn[];
  loadTimeMs: number;
}

export interface WorkerQueryResponse {
  type: 'QUERY_RESULT';
  id: string;
  columns: string[];
  rows: any[][];
  rowCount: number;
  rowsAffected?: number;
  executionTimeMs: number;
}

export interface WorkerSchemaResponse {
  type: 'SCHEMA_UPDATE';
  tables: TableSchema[];
}

export interface WorkerDbExportedResponse {
  type: 'DB_EXPORTED';
  buffer: Uint8Array;
}

export interface WorkerErrorResponse {
  type: 'ERROR';
  message: string;
  detail?: string;
  queryId?: string;
}

export interface WorkerProgressResponse {
  type: 'PROGRESS';
  phase: string;
  percent: number;
}

export type WorkerOutgoingMessage =
  | WorkerSuccessResponse
  | WorkerQueryResponse
  | WorkerSchemaResponse
  | WorkerDbExportedResponse
  | WorkerErrorResponse
  | WorkerProgressResponse;
