import { useState } from 'react';
import { Database, Table, Hash, Type, ChevronRight, Trash2, Check } from 'lucide-react';
import type { TableSchema } from '../types';

interface SchemaPanelProps {
  tables: TableSchema[];
  onSelectTable: (tableName: string) => void;
  onDropTable?: (tableName: string) => void;
}

export const SchemaPanel = ({
  tables,
  onSelectTable,
  onDropTable,
}: SchemaPanelProps) => {
  const [copiedCol, setCopiedCol] = useState<string | null>(null);

  const copyColumnName = (colName: string) => {
    navigator.clipboard.writeText(colName);
    setCopiedCol(colName);
    setTimeout(() => setCopiedCol(null), 1200);
  };

  if (tables.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-3 text-slate-500">
          <Database className="w-6 h-6" />
        </div>
        <div className="text-sm font-semibold text-slate-300">No tables in SQLite yet</div>
        <div className="text-xs text-slate-500 mt-1 max-w-xs">
          Drop any CSV file or load one of the recruiter sample datasets to inspect schemas and run instant SQL.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Database className="w-4 h-4 text-cyan-400" /> Active Tables ({tables.length})
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Click table or column to use
        </span>
      </div>

      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
        {tables.map((t) => (
          <div
            key={t.tableName}
            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <button
                onClick={() => onSelectTable(t.tableName)}
                className="flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 text-left group min-w-0 cursor-pointer"
                title={`Click to generate SELECT * FROM "${t.tableName}"`}
              >
                <Table className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{t.tableName}</span>
                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {t.rowCount.toLocaleString()} rows
                </span>
                {onDropTable && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Drop table "${t.tableName}" from in-memory SQLite?`)) {
                        onDropTable(t.tableName);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                    title={`Drop table "${t.tableName}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {t.columns.map((c) => {
                const isCopied = copiedCol === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => copyColumnName(c.name)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 transition cursor-pointer"
                    title={`Click to copy: ${c.name} (${c.type})`}
                  >
                    {isCopied ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : c.type === 'INTEGER' || c.type === 'REAL' ? (
                      <Hash className="w-2.5 h-2.5 text-amber-400/80" />
                    ) : (
                      <Type className="w-2.5 h-2.5 text-emerald-400/80" />
                    )}
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
