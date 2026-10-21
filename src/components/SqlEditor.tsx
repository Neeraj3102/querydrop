import React, { useState } from 'react';
import { Play, Copy, Check, RotateCcw, Sparkles, Trash2 } from 'lucide-react';

interface SqlEditorProps {
  initialQuery?: string;
  onRunQuery: (sql: string) => void;
  isLoading: boolean;
  history: string[];
}

const SQL_TEMPLATES = [
  { label: 'SELECT * LIMIT 25', sql: 'SELECT * FROM {table} LIMIT 25;' },
  {
    label: 'Group By & Count',
    sql: 'SELECT category, COUNT(*) as count FROM {table} GROUP BY category ORDER BY count DESC;',
  },
  {
    label: 'Summary Aggregates',
    sql: 'SELECT COUNT(*) as total_rows, ROUND(AVG(revenue), 2) as avg_revenue, MAX(revenue) as max_rev FROM {table};',
  },
  {
    label: 'Create Index',
    sql: 'CREATE INDEX idx_sample ON {table}(column_name);',
  },
];

export const SqlEditor: React.FC<SqlEditorProps> = ({
  initialQuery = 'SELECT 1;',
  onRunQuery,
  isLoading,
  history,
}) => {
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [copied, setCopied] = useState(false);

  // Synchronize state with prop without unnecessary effect cascading
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        onRunQuery(query.trim());
      }
    }
  };

  const formatSql = () => {
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'LIMIT',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'OUTER JOIN',
      'ON',
      'AS',
      'AND',
      'OR',
      'NOT',
      'IN',
      'IS NULL',
      'IS NOT NULL',
      'COUNT',
      'SUM',
      'AVG',
      'MIN',
      'MAX',
      'ROUND',
      'CREATE TABLE',
      'CREATE INDEX',
      'DROP TABLE',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE',
      'DESC',
      'ASC',
      'DISTINCT',
      'UNION',
      'ALL',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
    ];

    let formatted = query;
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    });

    setQuery(formatted);
  };

  const clearEditor = () => {
    setQuery('');
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            SQL Query Console
          </span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            (Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Ctrl + Enter</kbd> to run)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick template selector */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                setQuery(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded px-2 py-1 text-slate-300 cursor-pointer focus:outline-none focus:border-cyan-500"
          >
            <option value="" disabled>
              ⚡ Query Snippets...
            </option>
            {SQL_TEMPLATES.map((tmpl, idx) => (
              <option key={idx} value={tmpl.sql}>
                {tmpl.label}
              </option>
            ))}
          </select>

          <button
            onClick={formatSql}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
            title="Capitalize SQL Keywords"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Format</span>
          </button>

          <button
            onClick={clearEditor}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
            title="Copy SQL to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM tableName WHERE ... GROUP BY ... ORDER BY ..."
          rows={5}
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 font-mono text-sm text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-y leading-relaxed"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
          {history.length > 0 && (
            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
              Recent:
            </span>
          )}
          {history.slice(0, 3).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(item)}
              className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 hover:border-cyan-500/40 truncate max-w-[140px] transition cursor-pointer"
              title={item}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          onClick={() => query.trim() && onRunQuery(query.trim())}
          disabled={isLoading || !query.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition ml-auto cursor-pointer"
        >
          {isLoading ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Query</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
