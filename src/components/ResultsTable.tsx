import { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Table2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import type { QueryResult } from '../types';

interface ResultsTableProps {
  result: QueryResult | null;
}

type SortDirection = 'asc' | 'desc' | null;

export const ResultsTable = ({ result }: ResultsTableProps) => {
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);
  const [sortColIdx, setSortColIdx] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const columns = useMemo(() => result?.columns ?? [], [result?.columns]);
  const rows = useMemo(() => result?.rows ?? [], [result?.rows]);
  const executionTimeMs = result?.executionTimeMs ?? 0;
  const rowCount = result?.rowCount ?? 0;
  const rowsAffected = result?.rowsAffected;

  const handleSort = (colIdx: number) => {
    if (sortColIdx !== colIdx) {
      setSortColIdx(colIdx);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortColIdx(null);
      setSortDir(null);
    }
    setPage(1);
  };

  // 1. Filter rows
  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return rows;
    const lower = filterText.toLowerCase();
    return rows.filter((row) =>
      row.some((val) => String(val ?? '').toLowerCase().includes(lower))
    );
  }, [rows, filterText]);

  // 2. Sort rows
  const sortedRows = useMemo(() => {
    if (sortColIdx === null || !sortDir) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const valA = a[sortColIdx];
      const valB = b[sortColIdx];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRows, sortColIdx, sortDir]);

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const downloadCSV = () => {
    const headerLine = columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    const rowLines = sortedRows.map((r) =>
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
    a.download = `querydrop_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    const objects = sortedRows.map((r) => {
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

  if (!result) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Query Results
          </span>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
            {rowCount.toLocaleString()} {rowCount === 1 ? 'row' : 'rows'}
          </span>
          {rowsAffected !== undefined && rowsAffected > 0 && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              {rowsAffected} modified
            </span>
          )}
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
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-36 sm:w-48 transition"
            />
          </div>

          <button
            onClick={copyJSON}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
            title="Copy as JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <span>Statement executed successfully.</span>
          {rowsAffected !== undefined && (
            <span className="text-[11px] text-slate-500 font-mono">
              {rowsAffected} {rowsAffected === 1 ? 'row' : 'rows'} affected.
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto max-h-[440px] rounded-xl border border-slate-800/80 bg-slate-950/50">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-400 w-12 text-center border-r border-slate-800">
                    #
                  </th>
                  {columns.map((col, idx) => {
                    const isSorted = sortColIdx === idx;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(idx)}
                        className="py-2.5 px-3 text-[11px] font-bold text-slate-200 whitespace-nowrap tracking-wide hover:bg-slate-800/70 cursor-pointer transition"
                        title="Click to sort column"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col}</span>
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-cyan-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {pagedRows.map((row, rIdx) => {
                  const absoluteIndex = (currentPage - 1) * pageSize + rIdx + 1;
                  return (
                    <tr
                      key={rIdx}
                      className="hover:bg-cyan-950/20 transition-colors duration-100"
                    >
                      <td className="py-2 px-3 text-[10px] text-slate-500 text-center border-r border-slate-800/60 font-mono">
                        {absoluteIndex}
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination and View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Showing {sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length.toLocaleString()}{' '}
                {filterText ? `(filtered from ${rowCount.toLocaleString()})` : 'rows'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-2 text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
