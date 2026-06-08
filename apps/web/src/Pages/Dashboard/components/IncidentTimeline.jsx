import React from "react";
import { AlertCircle, ShieldAlert, Clock, MapPin, Send } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function IncidentTimeline({ isDarkMode, alerts }) {
  const t = themes.getThemeClasses(isDarkMode);

  // Derive timeline events from actual alerts or output a placeholder dispatcher log
  const activeAlerts = alerts?.filter((a) => a.active) || [];

  return (
    <div className={`p-6 ${t.card} flex flex-col h-full`}>
      <div className="space-y-1 mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
          Real-Time Log
        </p>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Incident Dispatch Timeline
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[360px] custom-scrollbar">
        {activeAlerts.length > 0 ? (
          activeAlerts.map((alert, index) => {
            const timeStr = alert.updatedAt
              ? new Date(alert.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "Now";
            return (
              <div key={alert.id || index} className="relative pl-6 pb-2 last:pb-0">
                {/* Timeline line connector */}
                {index < activeAlerts.length - 1 && (
                  <span className="absolute left-[9px] top-4 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                )}
                {/* Timeline point */}
                <span className="absolute left-[3px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500/10 border-2 border-rose-500 shadow-sm animate-pulse" />

                <div className="space-y-1 bg-white/40 dark:bg-black/20 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={11} /> {timeStr}
                    </span>
                    <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                      <ShieldAlert size={10} /> {alert.type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {alert.message}
                  </p>
                  {alert.latitude && alert.longitude && (
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 flex items-center gap-0.5">
                      <MapPin size={10} /> {Number(alert.latitude).toFixed(4)}°N, {Number(alert.longitude).toFixed(4)}°E
                    </p>
                  )}

                  {alert.agencyETAs && (
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400">Police</p>
                        <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {alert.agencyETAs.police}m ETA
                        </p>
                      </div>
                      <div className="text-center border-x border-slate-100 dark:border-white/5">
                        <p className="text-[9px] text-slate-400">Medic</p>
                        <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {alert.agencyETAs.ambulance}m ETA
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400">Fire</p>
                        <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {alert.agencyETAs.fire}m ETA
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-2 opacity-60">
            <Send size={24} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
              No dispatcher dispatch events active.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-[200px]">
              System events will display step-by-step alert dispatches here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
