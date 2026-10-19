import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { BarChart3, PieChart, LineChart, ScatterChart, Download } from 'lucide-react';
import type { QueryResult } from '../types';

interface ChartPanelProps {
  result: QueryResult | null;
}

type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

export const ChartPanel = ({ result }: ChartPanelProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');

  if (!result || result.columns.length < 2 || result.rows.length === 0) {
    return null;
  }

  const { columns, rows } = result;

  // Auto-select initial columns
  useEffect(() => {
    if (columns.length >= 2) {
      if (!xAxisCol || !columns.includes(xAxisCol)) setXAxisCol(columns[0]);
      if (!yAxisCol || !columns.includes(yAxisCol)) {
        const numCol = columns.find((_, i) => typeof rows[0]?.[i] === 'number') || columns[1];
        setYAxisCol(numCol);
      }
    }
  }, [columns, rows]);

  // Render or Update ECharts
  useEffect(() => {
    if (!chartRef.current || !xAxisCol || !yAxisCol) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const chart = chartInstance.current;
    const xIdx = columns.indexOf(xAxisCol);
    const yIdx = columns.indexOf(yAxisCol);

    const xData = rows.map((r) => String(r[xIdx] ?? ''));
    const yData = rows.map((r) => Number(r[yIdx]) || 0);

    let option: echarts.EChartsOption = {};

    if (chartType === 'pie') {
      const pieData = rows.map((r) => ({
        name: String(r[xIdx] ?? ''),
        value: Number(r[yIdx]) || 0,
      }));

      option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
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
      const scatterData = rows.map((r) => [r[xIdx], r[yIdx]]);
      option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        xAxis: { type: 'value', name: xAxisCol, splitLine: { lineStyle: { color: '#1e293b' } } },
        yAxis: { type: 'value', name: yAxisCol, splitLine: { lineStyle: { color: '#1e293b' } } },
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
        },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '12%', containLabel: true },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: { color: '#94a3b8', rotate: xData.length > 8 ? 30 : 0 },
          axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
          type: 'value',
          name: yAxisCol,
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: [
          {
            name: yAxisCol,
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
                      { offset: 0, color: 'rgba(6, 182, 212, 0.4)' },
                      { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
                    ]),
                  }
                : undefined,
          },
        ],
      };
    }

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [result, chartType, xAxisCol, yAxisCol]);

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

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Dynamic Visualizer (ECharts)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-md text-xs transition ${
              chartType === 'bar' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-md text-xs transition ${
              chartType === 'line' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Line Chart"
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded-md text-xs transition ${
              chartType === 'pie' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Pie / Donut Chart"
          >
            <PieChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('scatter')}
            className={`p-1.5 rounded-md text-xs transition ${
              chartType === 'scatter' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Scatter Plot"
          >
            <ScatterChart className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>X:</span>
            <select
              value={xAxisCol}
              onChange={(e) => setXAxisCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Y:</span>
            <select
              value={yAxisCol}
              onChange={(e) => setYAxisCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
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
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2 py-1 rounded transition"
            title="Export Chart as PNG"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </div>

      <div ref={chartRef} className="w-full h-72 sm:h-80" />
    </div>
  );
};
