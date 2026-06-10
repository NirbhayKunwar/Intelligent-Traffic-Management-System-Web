import React from "react";
import { Play, ShieldAlert, VideoOff, RefreshCw, Eye } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function AccidentDetectionPanel({
  isDarkMode,
  accidentSourceType,
  setAccidentSourceType,
  accidentCameraId,
  setAccidentCameraId,
  selectedUploadId,
  setSelectedUploadId,
  cameras,
  uploads,
  accidentPreviewUrl,
  renderVideoPreview,
  runModel,
  isRunningAccident,
  mappedAccidentJob,
  activeAccidentResult,
}) {
  const t = themes.getThemeClasses(isDarkMode);
  const accidentTargetId = accidentSourceType === "camera" ? accidentCameraId : selectedUploadId;

  return (
    <div className={`p-4 sm:p-6 ${t.card}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200/40 dark:border-white/5 pb-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400 font-bold">
            Emergency Diagnostics
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-500" /> Accident CAM Analyser
          </h3>
        </div>

        {/* Controls and Run button */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
          <select
            className="w-full sm:w-auto h-11 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-900 dark:text-white focus:outline-none"
            value={accidentSourceType}
            onChange={(e) => setAccidentSourceType(e.target.value)}
          >
            <option value="camera">Live Camera</option>
            <option value="upload">Uploaded Footage</option>
          </select>

          <select
            className="w-full sm:w-auto h-11 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-900 dark:text-white focus:outline-none sm:max-w-[160px] truncate"
            value={accidentSourceType === "camera" ? accidentCameraId : selectedUploadId}
            onChange={(e) =>
              accidentSourceType === "camera"
                ? setAccidentCameraId(e.target.value)
                : setSelectedUploadId(e.target.value)
            }
          >
            {accidentSourceType === "camera" ? (
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
            onClick={() => runModel("accident")}
            disabled={
              isRunningAccident ||
              (accidentSourceType === "camera" ? !accidentCameraId : !selectedUploadId)
            }
            className={`w-full sm:w-auto h-11 text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 ${
              isRunningAccident
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-95"
            }`}
          >
            {isRunningAccident ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Run Accident Model
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: video preview */}
        <div className="lg:col-span-8 relative">
          {renderVideoPreview(
            accidentPreviewUrl,
            "Select a camera or uploaded clip and click 'Run Accident Model' to evaluate crash & vehicle hazard risk index",
            "accident"
          )}
        </div>

        {/* Right: reports output */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold flex items-center gap-1.5">
                <Eye size={14} className="text-rose-500" /> Incident Assessment
              </h4>
              {activeAccidentResult && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    Number(activeAccidentResult?.incidentsDetected) > 0
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {Number(activeAccidentResult?.incidentsDetected) > 0 ? "CRITICAL HAZARD" : "SECURED / CLEAR"}
                </span>
              )}
            </div>

            {/* Warnings if fallback result is loaded */}
            {mappedAccidentJob &&
              mappedAccidentJob.sourceId !== accidentTargetId &&
              mappedAccidentJob.fileId !== accidentTargetId && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                  ⚠️ Showing previous incident logs. Select feed and trigger diagnostic model to scan this node specifically.
                </div>
              )}

            <div className="grid gap-3.5">
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400 block">Incidents Logged</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Active road collisions</span>
                </div>
                <span
                  className={`text-xl font-bold font-mono ${
                    Number(activeAccidentResult?.incidentsDetected) > 0 ? "text-rose-500" : "text-slate-900 dark:text-white"
                  }`}
                >
                  {activeAccidentResult ? (Number(activeAccidentResult.incidentsDetected) > 0 ? "1 Active" : "0 Clean") : "--"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400 block">Inference Confidence</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Deep-learning rating</span>
                </div>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {activeAccidentResult?.confidence
                    ? `${Math.round(Number(activeAccidentResult.confidence) * 100)}%`
                    : "--"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-500 dark:text-gray-400 block">Response Agency ETA</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Dispatched responders</span>
                </div>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {activeAccidentResult?.responseEta || "--"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-200/40 dark:border-white/5 pt-3">
            Positive classifications trigger automatic GPS routing offsets for citizens and alert the emergency services network immediately.
          </div>
        </div>
      </div>
    </div>
  );
}
