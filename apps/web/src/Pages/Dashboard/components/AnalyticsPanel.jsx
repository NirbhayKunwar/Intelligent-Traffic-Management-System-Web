import React from "react";
import { AreaChart, Area, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { themes } from "../../../design-system/tokens";

export default function AnalyticsPanel({
  isDarkMode,
  congestionTrend,
  congestionThreshold,
  trendHasRealData,
  jobMetrics,
}) {
  const t = themes.getThemeClasses(isDarkMode);

  const chartColors = {
    stroke: "#22d3ee",
    fill: "#22d3ee",
    grid: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    text: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    tooltipBg: isDarkMode ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
    tooltipBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    tooltipText: isDarkMode ? "#fff" : "#000",
  };

  const safeTrend = congestionTrend?.length ? congestionTrend : [0, 0];
  const chartData = safeTrend.length < 10
    ? [...Array(10 - safeTrend.length).fill(0), ...safeTrend].map((v, i) => ({ time: i, value: v }))
    : safeTrend.map((v, i) => ({ time: i, value: v }));

  const opsMetrics = [
    { key: "accidents", label: "Accidents", value: jobMetrics.accidents },
    { key: "congestion", label: "Congestion", value: jobMetrics.congestion },
    { key: "alerts", label: "Alerts", value: jobMetrics.alerts },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* 1. Congestion Index Trend Panel */}
      <div className={`p-6 ${t.card} lg:col-span-8 space-y-4 min-w-0`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
              Flow Analysis
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Congestion Trends
            </h3>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 px-3 py-1 text-[10px] font-semibold text-slate-700 dark:text-gray-300">
              Window: 60m
            </span>
            <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 px-3 py-1 text-[10px] font-semibold text-slate-700 dark:text-gray-300">
              Limit: {congestionThreshold} Vehicles
            </span>
          </div>
        </div>

        <div className="h-72 w-full relative">
          {!trendHasRealData && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 dark:bg-slate-950/20 backdrop-blur-[2px] z-10">
              <span className="px-3.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-semibold">
                📊 Gathering dynamic corridor data streams...
              </span>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.stroke} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColors.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis hide dataKey="time" />
              <YAxis domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="p-3 bg-slate-900 border border-white/10 rounded-xl shadow-xl backdrop-blur-md text-white space-y-0.5">
                        <p className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Density Index</p>
                        <p className="text-lg font-bold font-mono">{payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={congestionThreshold}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `Limit (${congestionThreshold})`,
                  fill: "#f59e0b",
                  fontSize: 10,
                  position: "insideTopRight",
                  fontWeight: "bold",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors.stroke}
                fillOpacity={1}
                fill="url(#colorCongestion)"
                strokeWidth={3}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live metric footer boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-bold">
              Current index
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {safeTrend[safeTrend.length - 1] ?? 0}%
            </span>
          </div>
          <div className="p-3.5 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-bold">
              Peak recorded
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {safeTrend.length ? Math.max(...safeTrend) : 0}%
            </span>
          </div>
          <div className="p-3.5 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-bold">
              Average index
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {safeTrend.length ? Math.round(safeTrend.reduce((a, b) => a + b, 0) / safeTrend.length) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Operations Summary Panel */}
      <div className={`p-6 ${t.card} lg:col-span-4 space-y-4 min-w-0`}>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
            Operations Center
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Operational Summary
          </h3>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={opsMetrics} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: "12px",
                  color: chartColors.tooltipText,
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {opsMetrics.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.key === "accidents"
                        ? "#f43f5e"
                        : entry.key === "congestion"
                        ? "#f59e0b"
                        : "#22d3ee"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Small legend summary footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-slate-200/50 dark:border-white/5 pt-4">
          {opsMetrics.map((metric) => (
            <div key={metric.key} className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold truncate">
                {metric.label}
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
