import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { BarChart3, PieChart, LineChart, ScatterChart, Download, Info } from 'lucide-react';
import type { QueryResult } from '../types';

interface ChartPanelProps {
  result: QueryResult | null;
}

type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

const MAX_CHART_ROWS = 60;

export const ChartPanel = ({ result }: ChartPanelProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');

  const columns = useMemo(() => result?.columns ?? [], [result?.columns]);
  const rows = useMemo(() => result?.rows ?? [], [result?.rows]);
  const hasValidData = columns.length >= 2 && rows.length > 0;
  const isCapped = rows.length > MAX_CHART_ROWS;

  // Derive active columns safely
  const activeX = columns.includes(xAxisCol) ? xAxisCol : columns[0] ?? '';
  const activeY = columns.includes(yAxisCol)
    ? yAxisCol
    : columns.find((_, i) => typeof rows[0]?.[i] === 'number') || columns[1] || '';

  // Chart sliced data
  const chartRows = useMemo(() => {
    return rows.slice(0, MAX_CHART_ROWS);
  }, [rows]);

  // Render or Update ECharts
  useEffect(() => {
    if (!chartRef.current || !hasValidData || !activeX || !activeY) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const chart = chartInstance.current;
    const xIdx = columns.indexOf(activeX);
    const yIdx = columns.indexOf(activeY);

    const xData = chartRows.map((r) => String(r[xIdx] ?? ''));
    const yData = chartRows.map((r) => Number(r[yIdx]) || 0);

    let option: echarts.EChartsOption = {};

    if (chartType === 'pie') {
      const pieData = chartRows.map((r) => ({
        name: String(r[xIdx] ?? ''),
        value: Number(r[yIdx]) || 0,
      }));

      option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          textStyle: { color: '#f8fafc' },
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          textStyle: { color: '#94a3b8', fontSize: 11 },
          type: 'scroll',
        },
        series: [
          {
            name: activeY,
            type: 'pie',
            radius: ['38%', '68%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#020617',
              borderWidth: 2,
            },
            data: pieData,
          },
        ],
      };
    } else if (chartType === 'scatter') {
      const scatterData = chartRows.map((r) => [r[xIdx], r[yIdx]]);
      option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          textStyle: { color: '#f8fafc' },
        },
        xAxis: {
          type: 'value',
          name: activeX,
          nameTextStyle: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        yAxis: {
          type: 'value',
          name: activeY,
          nameTextStyle: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: [
          {
            type: 'scatter',
            data: scatterData,
            itemStyle: { color: '#06b6d4' },
            symbolSize: 10,
          },
        ],
      };
    } else {
      option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          textStyle: { color: '#f8fafc' },
        },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '12%', containLabel: true },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: {
            color: '#94a3b8',
            rotate: xData.length > 8 ? 30 : 0,
            interval: 0,
            fontSize: 11,
          },
          axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
          type: 'value',
          name: activeY,
          nameTextStyle: { color: '#94a3b8', fontSize: 11 },
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: [
          {
            name: activeY,
            type: chartType,
            data: yData,
            smooth: true,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#06b6d4' },
                { offset: 1, color: '#3b82f6' },
              ]),
              borderRadius: chartType === 'bar' ? [6, 6, 0, 0] : 0,
            },
            areaStyle:
              chartType === 'line'
                ? {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: 'rgba(6, 182, 212, 0.45)' },
                      { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
                    ]),
                  }
                : undefined,
          },
        ],
      };
    }

    chart.setOption(option, true);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [columns, chartRows, chartType, activeX, activeY, hasValidData]);

  const exportChart = () => {
    if (!chartInstance.current) return;
    const url = chartInstance.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#020617',
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `querydrop_chart_${Date.now()}.png`;
    a.click();
  };

  if (!hasValidData) {
    return null;
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Dynamic Visualizer (Apache ECharts)
          </span>
          {isCapped && (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded-full"
              title="Charts automatically render the top 60 rows to prevent browser DOM and canvas lag"
            >
              <Info className="w-3 h-3" /> Top 60 rendered
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              chartType === 'bar' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              chartType === 'line' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Line Chart"
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              chartType === 'pie' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Pie / Donut Chart"
          >
            <PieChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('scatter')}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              chartType === 'scatter' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Scatter Plot"
          >
            <ScatterChart className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>X-Axis:</span>
            <select
              value={activeX}
              onChange={(e) => setXAxisCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Y-Axis:</span>
            <select
              value={activeY}
              onChange={(e) => setYAxisCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportChart}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded transition cursor-pointer"
            title="Export Chart as PNG image"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </div>

      <div ref={chartRef} className="w-full h-72 sm:h-80" />
    </div>
  );
};
