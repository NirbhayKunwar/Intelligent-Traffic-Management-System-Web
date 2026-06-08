import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ShieldAlert, Activity, Cpu, Video, TrendingUp, TrendingDown } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function KPIGrid({ isDarkMode, jobMetrics, cameras, congestionTrend }) {
  const t = themes.getThemeClasses(isDarkMode);

  // Sparkline data generators
  const generateSparkline = (baseVal, variance) => {
    return Array.from({ length: 8 }, (_, i) => ({
      val: Math.max(0, Math.round(baseVal + (Math.sin(i) * variance) + (Math.cos(i) * 2))),
    }));
  };

  const onlineCamerasCount = cameras?.filter((c) => c.status === "Online").length || 0;
  const totalCamerasCount = cameras?.length || 0;

  const kpis = [
    {
      label: "Active Incidents",
      value: jobMetrics.accidents,
      desc: "Emergency dispatcher alerts",
      change: "+12%",
      isPositive: false,
      icon: ShieldAlert,
      iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      sparkColor: "#f43f5e",
      sparkData: generateSparkline(jobMetrics.accidents || 2, 1),
    },
    {
      label: "Congestion Index",
      value: `${jobMetrics.congestion}%`,
      desc: "Corridor density average",
      change: "-4%",
      isPositive: true,
      icon: Activity,
      iconColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
      sparkColor: "#22d3ee",
      sparkData: congestionTrend?.length
        ? congestionTrend.slice(-8).map((v) => ({ val: v }))
        : generateSparkline(jobMetrics.congestion || 45, 10),
    },
    {
      label: "AI Model Accuracy",
      value: "96.4%",
      desc: "Confidence score threshold",
      change: "+0.8%",
      isPositive: true,
      icon: Cpu,
      iconColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      sparkColor: "#6366f1",
      sparkData: generateSparkline(96, 2),
    },
    {
      label: "Cameras Online",
      value: `${onlineCamerasCount} / ${totalCamerasCount}`,
      desc: "Active CCTV operations streams",
      change: "Stable",
      isPositive: true,
      icon: Video,
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      sparkColor: "#10b981",
      sparkData: generateSparkline(onlineCamerasCount || 4, 1),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className={`p-5 rounded-2xl border ${t.border} bg-white/70 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                {kpi.label}
              </span>
              <div className={`p-2 rounded-lg border ${kpi.iconColor}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold">
                  {kpi.change !== "Stable" ? (
                    <>
                      {kpi.isPositive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <TrendingUp size={10} /> {kpi.change}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                          <TrendingDown size={10} /> {kpi.change}
                        </span>
                      )}
                      <span className="text-slate-400">vs yesterday</span>
                    </>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">FEEDS ACTIVE</span>
                  )}
                </div>
              </div>

              {/* Sparkline mini-graph */}
              <div className="w-16 h-10 overflow-hidden opacity-85">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.sparkData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                    <defs>
                      <linearGradient id={`grad-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kpi.sparkColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={kpi.sparkColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke={kpi.sparkColor}
                      fill={`url(#grad-${kpi.label})`}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
