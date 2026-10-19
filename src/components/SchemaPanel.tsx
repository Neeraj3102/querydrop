import { Database, Table, Hash, Type, ChevronRight } from 'lucide-react';
import type { TableSchema } from '../types';

interface SchemaPanelProps {
  tables: TableSchema[];
  onSelectTable: (tableName: string) => void;
}

export const SchemaPanel = ({ tables, onSelectTable }: SchemaPanelProps) => {
  if (tables.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
        <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <div className="text-xs text-slate-400">No tables loaded yet</div>
        <div className="text-[11px] text-slate-500 mt-1">
          Drop a CSV or choose a sample dataset above to start querying.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Database className="w-4 h-4 text-cyan-400" /> Active Tables ({tables.length})
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
        {tables.map((t) => (
          <div
            key={t.tableName}
            className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => onSelectTable(t.tableName)}
                className="flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 text-left group"
              >
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate">{t.tableName}</span>
                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
              </button>
              <span className="text-[10px] font-mono bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {t.rowCount.toLocaleString()} rows
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {t.columns.map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                  title={`${c.name} (${c.type})`}
                >
                  {c.type === 'INTEGER' || c.type === 'REAL' ? (
                    <Hash className="w-2.5 h-2.5 text-amber-400/80" />
                  ) : (
                    <Type className="w-2.5 h-2.5 text-emerald-400/80" />
                  )}
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
