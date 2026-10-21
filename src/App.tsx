import { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  HelpCircle,
  X,
  AlertTriangle,
  FolderGit2,
  Database,
  RotateCcw,
  LayoutGrid,
  Table2,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useSqlWorker } from './hooks/useSqlWorker';
import { DropZone } from './components/DropZone';
import { SchemaPanel } from './components/SchemaPanel';
import { SqlEditor } from './components/SqlEditor';
import { ResultsTable } from './components/ResultsTable';
import { ChartPanel } from './components/ChartPanel';
import { SAMPLE_DATASETS } from './lib/sample-data';

type ViewMode = 'all' | 'table' | 'chart';

export function App() {
  const {
    isLoading,
    progress,
    tables,
    activeResult,
    queryHistory,
    errorMessage,
    loadCsv,
    runQuery,
    exportDatabase,
    resetDatabase,
    dropTable,
  } = useSqlWorker();

  const [currentQuery, setCurrentQuery] = useState('SELECT 1;');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // When a table is clicked in SchemaPanel, prepare a default SELECT * query
  const handleSelectTable = (tableName: string) => {
    setCurrentQuery(`SELECT * FROM "${tableName}" LIMIT 25;`);
  };

  const handleFileLoaded = (tableName: string, content: string) => {
    loadCsv(tableName, content);
    // Auto-select query if matching sample
    const sample = SAMPLE_DATASETS.find((s) => s.id === tableName);
    if (sample) {
      setCurrentQuery(sample.sampleQuery);
    } else {
      setCurrentQuery(`SELECT * FROM "${tableName}" LIMIT 50;`);
    }
  };

  const totalRowsInDb = tables.reduce((acc, t) => acc + t.rowCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 font-black text-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  QueryDrop
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-medium">
                  Wasm + SQLite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                In-Browser CSV Analytics · Zero Server · 100% Client-Side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Export Database button */}
            {tables.length > 0 && (
              <button
                onClick={exportDatabase}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 px-3 py-1.5 rounded-xl transition cursor-pointer"
                title="Export native SQLite .db file directly from browser memory"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Export .sqlite DB</span>
              </button>
            )}

            {/* Reset DB button */}
            {tables.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Reset SQLite database to empty state?')) {
                    resetDatabase();
                  }
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-900/50 p-2 rounded-xl transition cursor-pointer"
                title="Reset Database"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>How It Works</span>
            </button>

            <a
              href="https://github.com/Neeraj3102/querydrop"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              title="View Source on GitHub"
            >
              <FolderGit2 className="w-4 h-4 text-slate-300" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full flex flex-col gap-6">
        {/* Metric Bar if tables loaded */}
        {tables.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs">
            <div className="flex items-center gap-4 text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                In-Memory DB Active
              </span>
              <span>Tables: <strong className="text-slate-200">{tables.length}</strong></span>
              <span>Total Rows: <strong className="text-cyan-300">{totalRowsInDb.toLocaleString()}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero network transmission</span>
            </div>
          </div>
        )}

        {/* Progress Alert Bar if worker is busy */}
        {progress && (
          <div className="bg-cyan-950/60 border border-cyan-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-cyan-300 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{progress.phase}</span>
            </div>
            <span className="font-mono font-bold">{progress.percent}%</span>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Error encountered</div>
              <div className="text-[11px] text-red-300 font-mono mt-0.5">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* Top Section: Drop Zone & Schema Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <DropZone onFileLoaded={handleFileLoaded} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-1">
            <SchemaPanel
              tables={tables}
              onSelectTable={handleSelectTable}
              onDropTable={dropTable}
            />
          </div>
        </div>

        {/* Middle Section: SQL Editor */}
        <SqlEditor
          initialQuery={currentQuery}
          onRunQuery={runQuery}
          isLoading={isLoading}
          history={queryHistory}
        />

        {/* Bottom Section: Results Table & Charts */}
        {activeResult && (
          <div className="flex flex-col gap-4">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Split View</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    viewMode === 'chart'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Visualizer</span>
                </button>
              </div>
            </div>

            {/* Results Content */}
            {(viewMode === 'all' || viewMode === 'table') && (
              <ResultsTable result={activeResult} />
            )}
            {(viewMode === 'all' || viewMode === 'chart') && (
              <ChartPanel result={activeResult} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Data Leaves Your Browser · Powered by SQLite WebAssembly & Web Workers</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Engineered by{' '}
              <a
                href="https://github.com/Neeraj3102"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
              >
                Neeraj <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* "How It Works" Architecture Modal (Interview Ready) */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" /> Under the Hood: How QueryDrop Works
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Architecture details highlighting browser systems, Wasm, Web Workers, and zero-server privacy.
            </p>

            <div className="mt-5 space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-300 block mb-1">
                  1. 100% Client-Side Privacy (HTML5 File API)
                </span>
                When you drop a CSV file, the browser's File API reads it as raw text into local memory. No HTTP request is sent anywhere. Your sensitive data stays completely inside your local browser tab.
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-300 block mb-1">
                  2. Web Workers (Background Threading & Zero UI Jank)
                </span>
                CSV parsing (Papa Parse) and SQLite calculations execute entirely inside a dedicated background Web Worker thread using asynchronous <code className="text-cyan-400">postMessage</code> communication. The main UI thread never blocks, keeping animations and typing at 60 FPS even when processing 100k+ rows.
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-300 block mb-1">
                  3. SQLite WebAssembly (Compiled from C to Wasm)
                </span>
                We run the official SQLite engine compiled directly from C code to WebAssembly bytecode (<code className="text-cyan-400">sql-wasm.wasm</code>). This brings full relational database capabilities: GROUP BY, aggregates, indexes, window functions, and subqueries at native performance in RAM. You can even export the native <code className="text-cyan-400">.sqlite</code> binary database directly to disk!
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-300 block mb-1">
                  4. Dynamic Pivot Visualizations (Apache ECharts)
                </span>
                Query results feed directly into Apache ECharts, letting users pivot arbitrary X and Y axes across Bar, Line, Pie, and Scatter plots and export high-res PNG charts.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
