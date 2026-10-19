import { useState } from 'react';
import { Download, Copy, Check, Table2, Search } from 'lucide-react';
import type { QueryResult } from '../types';

interface ResultsTableProps {
  result: QueryResult | null;
}

export const ResultsTable = ({ result }: ResultsTableProps) => {
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const { columns, rows, executionTimeMs, rowCount } = result;

  const filteredRows = filterText
    ? rows.filter((row) =>
        row.some((val) =>
          String(val).toLowerCase().includes(filterText.toLowerCase())
        )
      )
    : rows;

  const downloadCSV = () => {
    const headerLine = columns.map((c) => `"${c}"`).join(',');
    const rowLines = rows.map((r) =>
      r
        .map((val) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );
    const csvBlob = new Blob([[headerLine, ...rowLines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    const objects = rows.map((r) => {
      const obj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        obj[col] = r[idx];
      });
      return obj;
    });
    navigator.clipboard.writeText(JSON.stringify(objects, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Query Results
          </span>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
            {rowCount.toLocaleString()} rows
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
            ⏱ {executionTimeMs}ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter results..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-36 sm:w-48 transition"
            />
          </div>

          <button
            onClick={copyJSON}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg transition"
            title="Copy as JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 px-2.5 py-1 rounded-lg transition"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Query executed successfully (no columns returned).
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[420px] rounded-xl border border-slate-800/80 bg-slate-950/50">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-400 w-10 text-center border-r border-slate-800">
                  #
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="py-2.5 px-3 text-[11px] font-bold text-slate-200 whitespace-nowrap tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRows.slice(0, 500).map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-cyan-950/20 transition-colors duration-100"
                >
                  <td className="py-2 px-3 text-[10px] text-slate-500 text-center border-r border-slate-800/60">
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2 px-3 text-slate-300 whitespace-nowrap max-w-xs truncate"
                      title={String(cell ?? '')}
                    >
                      {cell === null || cell === undefined ? (
                        <span className="text-slate-600 italic">null</span>
                      ) : typeof cell === 'number' ? (
                        <span className="text-cyan-300 font-semibold">
                          {cell.toLocaleString()}
                        </span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRows.length > 500 && (
            <div className="p-2.5 text-center text-[11px] text-slate-400 bg-slate-900/60 border-t border-slate-800">
              Showing first 500 of {filteredRows.length.toLocaleString()} matching rows (Virtual limit for browser DOM performance). Export CSV to see all rows.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
