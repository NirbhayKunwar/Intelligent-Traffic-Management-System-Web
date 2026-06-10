import React from "react";
import { Play, Activity, VideoOff, RefreshCw, BarChart2 } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function CongestionDetectionPanel({
  isDarkMode,
  congestionSourceType,
  setCongestionSourceType,
  congestionCameraId,
  setCongestionCameraId,
  selectedUploadId,
  setSelectedUploadId,
  cameras,
  uploads,
  congestionPreviewUrl,
  renderVideoPreview,
  runModel,
  isRunningCongestion,
  mappedCongestionJob,
  activeCongestionResult,
}) {
  const t = themes.getThemeClasses(isDarkMode);
  const congestionTargetId = congestionSourceType === "camera" ? congestionCameraId : selectedUploadId;

  // Color mappings for congestion levels
  const getCongestionBadge = (level, index) => {
    const lvl = String(level || "").toLowerCase();
    if (lvl.includes("high") || lvl.includes("critical") || index >= 75) {
      return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    }
    if (lvl.includes("moderate") || index >= 50) {
      return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }
    if (lvl.includes("low") || index >= 25) {
      return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400";
    }
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  };

  return (
    <div className={`p-4 sm:p-6 ${t.card}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200/40 dark:border-white/5 pb-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400 font-bold">
            Inference Pipelines
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-cyan-500" /> Congestion CAM Analyser
          </h3>
        </div>

        {/* Control selects and Run button */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
          <select
            className="w-full sm:w-auto h-11 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-900 dark:text-white focus:outline-none"
            value={congestionSourceType}
            onChange={(e) => setCongestionSourceType(e.target.value)}
          >
            <option value="camera">Live Camera</option>
            <option value="upload">Uploaded Footage</option>
          </select>

          <select
            className="w-full sm:w-auto h-11 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-900 dark:text-white focus:outline-none sm:max-w-[160px] truncate"
            value={congestionSourceType === "camera" ? congestionCameraId : selectedUploadId}
            onChange={(e) =>
              congestionSourceType === "camera"
                ? setCongestionCameraId(e.target.value)
                : setSelectedUploadId(e.target.value)
            }
          >
            {congestionSourceType === "camera" ? (
              cameras?.length ? (
                cameras.map((camera) => (
                  <option key={camera.id} value={camera.id} disabled={camera.status !== "Online"}>
                    {camera.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No cameras deployed
                </option>
              )
            ) : uploads?.length ? (
              uploads.map((upload) => (
                <option key={upload.id} value={upload.id}>
                  {upload.originalName}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No footage uploaded
              </option>
            )}
          </select>

          <button
            type="button"
            onClick={() => runModel("congestion")}
            disabled={
              isRunningCongestion ||
              (congestionSourceType === "camera" ? !congestionCameraId : !selectedUploadId)
            }
            className={`w-full sm:w-auto h-11 text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 ${
              isRunningCongestion
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 active:scale-95"
            }`}
          >
            {isRunningCongestion ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Run congestion model
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Video Preview */}
        <div className="lg:col-span-8 relative">
          {renderVideoPreview(
            congestionPreviewUrl,
            "Select a camera or uploaded clip and click 'Run congestion model' to trigger real-time AI density profiling",
            "congestion"
          )}
        </div>

        {/* Right: Metrics & Output results */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold flex items-center gap-1.5">
                <BarChart2 size={14} className="text-cyan-500" /> Profiling Output
              </h4>
              {activeCongestionResult && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCongestionBadge(
                    activeCongestionResult?.congestionLevel,
                    activeCongestionResult?.index
                  )}`}
                >
                  {activeCongestionResult?.congestionLevel || "Clear"}
                </span>
              )}
            </div>

            {/* Warn user if showing fallbacks or if current source has not run */}
            {mappedCongestionJob &&
              mappedCongestionJob.sourceId !== congestionTargetId &&
              mappedCongestionJob.fileId !== congestionTargetId && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                  ⚠️ Showing previous results. Run model to profile the currently selected source.
                </div>
              )}

            <div className="grid gap-3.5">
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400 block">Peak Vehicle Count</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Inside detection frame</span>
                </div>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {activeCongestionResult?.vehicleCount ?? "--"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400 block">Average Velocity</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Estimated flow rate</span>
                </div>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {activeCongestionResult?.avgSpeed ? `${activeCongestionResult.avgSpeed} m/s` : "--"}
                </span>
              </div>

              {/* Congestion Index Meter */}
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Congestion Severity Index</span>
                  <span className="text-xs font-bold text-cyan-500 font-mono">
                    {activeCongestionResult?.index ?? 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${activeCongestionResult?.index ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-200/40 dark:border-white/5 pt-3">
            Inference engine maps vehicle coordinates to derive stopped/moving statistics. High values prompt active signal schedule tuning.
          </div>
        </div>
      </div>
    </div>
  );
}
