import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  TableSchema,
  QueryResult,
  WorkerOutgoingMessage,
  WorkerProgressResponse,
} from '../types';

export function useSqlWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [activeResult, setActiveResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<WorkerProgressResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/sql.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<WorkerOutgoingMessage>) => {
      const data = e.data;

      if (data.type === 'PROGRESS') {
        setProgress(data);
      } else if (data.type === 'CSV_LOADED') {
        setIsLoading(false);
        setProgress(null);
      } else if (data.type === 'SCHEMA_UPDATE') {
        setTables(data.tables);
        setIsReady(true);
      } else if (data.type === 'QUERY_RESULT') {
        setActiveResult({
          id: data.id,
          columns: data.columns,
          rows: data.rows,
          rowCount: data.rowCount,
          executionTimeMs: data.executionTimeMs,
        });
        setIsLoading(false);
        setProgress(null);
        setErrorMessage(null);
      } else if (data.type === 'ERROR') {
        setErrorMessage(data.message);
        setIsLoading(false);
        setProgress(null);
      }
    };

    workerRef.current = worker;
    worker.postMessage({ type: 'GET_SCHEMA' });

    return () => {
      worker.terminate();
    };
  }, []);

  const loadCsv = useCallback((tableName: string, csvContent: string) => {
    if (!workerRef.current) return;
    setIsLoading(true);
    setErrorMessage(null);
    workerRef.current.postMessage({
      type: 'LOAD_CSV',
      tableName,
      csvContent,
    });
  }, []);

  const runQuery = useCallback((sql: string) => {
    if (!workerRef.current) return;
    setIsLoading(true);
    setErrorMessage(null);
    const id = Math.random().toString(36).substring(7);

    setQueryHistory((prev) => [sql, ...prev.filter((q) => q !== sql)].slice(0, 15));

    workerRef.current.postMessage({
      type: 'RUN_QUERY',
      id,
      sql,
    });
  }, []);

  return {
    isReady,
    isLoading,
    progress,
    tables,
    activeResult,
    queryHistory,
    errorMessage,
    loadCsv,
    runQuery,
  };
}
