import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';
import { SAMPLE_DATASETS } from '../lib/sample-data';

interface DropZoneProps {
  onFileLoaded: (tableName: string, content: string) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        onFileLoaded(nameWithoutExt, text);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = (sample: (typeof SAMPLE_DATASETS)[0]) => {
    const csv = sample.generate();
    onFileLoaded(sample.id, csv);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
            : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center justify-center gap-2">
              Drop any CSV file here
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Supports files up to 100MB+ · 100% Client-Side Ingestion
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400/80 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-800/50">
            <CheckCircle2 className="w-3.5 h-3.5" /> Zero Uploads. Private to your machine.
          </div>
        </div>
      </div>

      {/* Built-in Sample Datasets */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instant Recruiter Demo Datasets
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              disabled={isLoading}
              onClick={() => handleSampleClick(sample)}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/40 text-left transition group disabled:opacity-50"
            >
              <div className="p-2 rounded bg-slate-800 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-400 transition mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  {sample.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {sample.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
