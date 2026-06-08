import React from "react";
import { Info, AlertCircle, VideoOff, BarChart2 } from "lucide-react";

export function EmptyState({ 
  icon: Icon = Info, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm">
      <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 dark:text-slate-500 mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-500 dark:to-indigo-500 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoIncidentsState({ onRefresh }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="No Active Incidents"
      description="All monitored intersections are operating normally within expected traffic density thresholds."
      actionLabel={onRefresh ? "Refresh Feed" : null}
      onAction={onRefresh}
    />
  );
}

export function NoCamerasState({ onAdd }) {
  return (
    <EmptyState
      icon={VideoOff}
      title="No Registered Cameras"
      description="Connect street cameras or deploy nodes to stream traffic statistics in real-time."
      actionLabel={onAdd ? "Register Camera" : null}
      onAction={onAdd}
    />
  );
}

export function NoAnalyticsState() {
  return (
    <EmptyState
      icon={BarChart2}
      title="No Data Captured"
      description="Select active streams or upload recorded media clips to view system flow analytics."
    />
  );
}
