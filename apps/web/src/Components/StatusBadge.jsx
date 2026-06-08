import React from "react";

export function StatusBadge({ status, text }) {
  let colorClasses = "text-slate-500 bg-slate-500/10 border-slate-500/20";
  let pulseClasses = "";

  const lowerStatus = String(status || "").toLowerCase();

  if (lowerStatus === "online" || lowerStatus === "live" || lowerStatus === "safe") {
    colorClasses = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/10";
    if (lowerStatus === "live") {
      pulseClasses = "animate-ping bg-emerald-500";
    }
  } else if (lowerStatus === "warning" || lowerStatus === "slow") {
    colorClasses = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 dark:border-amber-500/10";
  } else if (lowerStatus === "critical" || lowerStatus === "accident" || lowerStatus === "error") {
    colorClasses = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 dark:border-rose-500/10";
    pulseClasses = "animate-pulse bg-rose-500";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
      {pulseClasses && (
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseClasses}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseClasses.split(" ")[1] || "bg-slate-400"}`}></span>
        </span>
      )}
      {text || status}
    </span>
  );
}
