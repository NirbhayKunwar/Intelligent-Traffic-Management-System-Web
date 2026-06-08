import React, { useState } from "react";
import { AlertTriangle, Clock, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { NoIncidentsState } from "../../../Components/EmptyState";
import { StatusBadge } from "../../../Components/StatusBadge";
import { themes } from "../../../design-system/tokens";

export default function AlertFeed({ isDarkMode, alerts, onRefresh }) {
  const t = themes.getThemeClasses(isDarkMode);
  const [filterType, setFilterType] = useState("all");

  const filteredAlerts = alerts?.filter((a) => {
    if (filterType === "all") return true;
    if (filterType === "accident") return a.type === "accident";
    if (filterType === "congestion") return a.type === "congestion";
    return true;
  }) || [];

  return (
    <div className={`p-6 ${t.card} flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
            Emergency Feed
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Incident Alerts Feed
          </h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-gray-300 transition-colors"
          title="Refresh Alerts"
        >
          <RefreshCw size={15} className="animate-spin-hover" />
        </button>
      </div>

      {/* Alert Filter Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-black/35 rounded-xl border border-slate-200/50 dark:border-white/5 mb-4 text-xs font-semibold">
        {["all", "accident", "congestion"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
              filterType === type
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[300px] custom-scrollbar">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                alert.type === "accident"
                  ? "border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5"
                  : "border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={alert.type === "accident" ? "critical" : "warning"}
                      text={alert.type.toUpperCase()}
                    />
                    <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                      {alert.updatedAt ? new Date(alert.updatedAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {alert.message}
                  </p>
                </div>
              </div>

              {alert.agencyETAs && (
                <div className="mt-3 grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200/30 dark:border-white/5">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-gray-500 block">
                      Police
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500">
                      {alert.agencyETAs.police}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-gray-500 block">
                      Ambulance
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500">
                      {alert.agencyETAs.ambulance}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-gray-500 block">
                      Fire
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500">
                      {alert.agencyETAs.fire}m
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <NoIncidentsState onRefresh={onRefresh} />
        )}
      </div>
    </div>
  );
}
