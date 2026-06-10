import React, { useState, useMemo } from "react";
import { Cpu, Activity, ShieldAlert, CheckCircle2, XCircle, Loader2, Search, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function JobQueue({ isDarkMode, jobs, onClearJobs }) {
  const t = themes.getThemeClasses(isDarkMode);
  
  const [statusFilter, setStatusFilter] = useState("all"); // all | running | completed | failed
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJobIds, setExpandedJobIds] = useState({});

  const toggleExpandJob = (jobId) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((job) => {
      // 1. Status Filter
      if (statusFilter === "running" && !["running", "queued"].includes(job.status)) return false;
      if (statusFilter === "completed" && job.status !== "completed") return false;
      if (statusFilter === "failed" && job.status !== "failed") return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLabel = String(job.sourceLabel || "").toLowerCase().includes(query);
        const matchesId = String(job.id || "").toLowerCase().includes(query);
        const matchesType = String(job.type || "").toLowerCase().includes(query);
        return matchesLabel || matchesId || matchesType;
      }

      return true;
    });
  }, [jobs, statusFilter, searchQuery]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className={`p-6 ${t.card} space-y-4`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-theme-border pb-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-theme-text-secondary font-bold">
            Audit logs
          </p>
          <h3 className="text-lg font-semibold text-theme-text-primary flex items-center gap-2">
            <Cpu size={18} className="text-theme-accent" /> AI Inference Pipelines
          </h3>
        </div>
        
        {onClearJobs && jobs && jobs.length > 0 && (
          <button
            type="button"
            onClick={onClearJobs}
            className="px-3 py-1.5 rounded-lg border border-theme-error/25 bg-theme-error/5 hover:bg-theme-error/10 text-xs font-bold text-theme-error flex items-center gap-1.5 transition duration-200"
          >
            <Trash2 size={13} /> Purge Audit Logs
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Tabs */}
        <div className="flex gap-1 p-1 bg-theme-bg/50 border border-theme-border rounded-lg text-xs font-semibold self-start sm:self-center">
          {[
            { id: "all", label: "All Logs" },
            { id: "running", label: "Active" },
            { id: "completed", label: "Success" },
            { id: "failed", label: "Failed" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === tab.id
                  ? "bg-theme-card text-theme-text-primary shadow-sm"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary/50" />
          <input
            type="text"
            placeholder="Search by camera, file name or job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-theme-border bg-theme-bg/25 text-theme-text-primary placeholder:text-theme-text-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-theme-accent/30 transition duration-200"
          />
        </div>
      </div>

      {/* Jobs list */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const isExpanded = !!expandedJobIds[job.id];
            const isFinished = ["completed", "failed"].includes(job.status);
            
            return (
              <div 
                key={job.id} 
                className={`p-4 border rounded-xl transition-all duration-300 ${
                  job.status === "running"
                    ? "border-theme-accent/30 bg-theme-accent/5"
                    : job.status === "queued"
                    ? "border-theme-accent/20 bg-theme-bg/30"
                    : "border-theme-border bg-theme-bg/15 hover:bg-theme-bg/35"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  {/* Job Type & Info */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${
                      job.type === "congestion"
                        ? "text-theme-accent bg-theme-accent/10 border-theme-accent/15"
                        : "text-theme-error bg-theme-error/10 border-theme-error/15"
                    }`}>
                      {job.type === "congestion" ? <Activity size={15} /> : <ShieldAlert size={15} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-theme-text-primary">
                          {job.type === "congestion" ? "Congestion Analysis" : "Accident Detection"}
                        </span>
                        <span className="font-mono text-[9px] text-theme-text-secondary font-semibold bg-theme-bg px-1.5 py-0.5 rounded border border-theme-border">
                          #{job.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-[10px] text-theme-text-secondary font-medium mt-0.5">
                        Source: <span className="text-theme-text-primary">{job.sourceLabel || "Unknown Input"}</span> ({job.sourceType || "input"})
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-[10px] text-theme-text-secondary/80 font-medium flex items-center gap-1">
                      <Clock size={12} /> {getRelativeTime(job.timestamp || job.createdAt)}
                    </span>
                    
                    {/* Status badges */}
                    {job.status === "queued" && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-theme-accent/30 bg-theme-accent/10 text-theme-accent animate-pulse">
                        QUEUED
                      </span>
                    )}
                    {job.status === "running" && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-theme-warning/30 bg-theme-warning/10 text-theme-warning flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> {job.progress || 5}% RUNNING
                      </span>
                    )}
                    {job.status === "completed" && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-theme-success/30 bg-theme-success/10 text-theme-success flex items-center gap-1">
                        <CheckCircle2 size={10} /> SUCCESS
                      </span>
                    )}
                    {job.status === "failed" && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-theme-error/30 bg-theme-error/10 text-theme-error flex items-center gap-1">
                        <XCircle size={10} /> FAILED
                      </span>
                    )}

                    {/* Expand/Collapse Button for completed metrics */}
                    {isFinished && (
                      <button
                        type="button"
                        onClick={() => toggleExpandJob(job.id)}
                        className="p-1 rounded hover:bg-theme-bg/60 text-theme-text-secondary hover:text-theme-text-primary transition"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar for running jobs */}
                {job.status === "running" && (
                  <div className="mt-3.5 space-y-1.5">
                    <div className="w-full h-1.5 bg-theme-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-theme-accent to-theme-accent-alt transition-all duration-300"
                        style={{ width: `${job.progress || 5}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expandable Result Metrics */}
                {isFinished && isExpanded && (
                  <div className="mt-3 pt-3 border-t border-theme-border/50 text-[11px] space-y-2.5 animate-in slide-in-from-top duration-200">
                    {job.status === "completed" ? (
                      <div>
                        <p className="font-bold text-theme-text-secondary uppercase tracking-wider text-[9px] mb-2">Metrics Output:</p>
                        {job.type === "congestion" ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Vehicles</span>
                              <span className="text-sm font-bold font-mono text-theme-text-primary">{job.result?.vehicleCount ?? 0}</span>
                            </div>
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Avg Speed</span>
                              <span className="text-sm font-bold font-mono text-theme-text-primary">{job.result?.avgSpeed ?? "--"} m/s</span>
                            </div>
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Density Level</span>
                              <span className="text-sm font-bold text-theme-text-primary">{job.result?.congestionLevel ?? "Clear"}</span>
                            </div>
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Severity Index</span>
                              <span className="text-sm font-bold font-mono text-theme-accent">{job.result?.index ?? 0}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Accidents Detected</span>
                              <span className="text-sm font-bold font-mono text-theme-text-primary">{job.result?.incidentsDetected ?? 0}</span>
                            </div>
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Confidence</span>
                              <span className="text-sm font-bold font-mono text-theme-text-primary">{job.result?.confidence ? `${Math.round(job.result.confidence * 100)}%` : "--"}</span>
                            </div>
                            <div className="p-2 bg-theme-bg/30 border border-theme-border/60 rounded-lg">
                              <span className="text-[10px] text-theme-text-secondary block">Dispatch Response ETA</span>
                              <span className="text-sm font-bold font-mono text-theme-error">{job.result?.responseEta ?? "--"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 bg-theme-error/5 border border-theme-error/20 rounded-xl text-theme-error font-medium">
                        Pipeline processing failed: {job.error || "Background execution aborted."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 border border-dashed border-theme-border rounded-xl text-center text-theme-text-secondary/50">
            <Cpu size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No audit logs matching this search</p>
          </div>
        )}
      </div>
    </div>
  );
}
