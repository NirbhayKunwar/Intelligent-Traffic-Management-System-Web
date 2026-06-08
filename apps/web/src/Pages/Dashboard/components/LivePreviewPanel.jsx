import React from "react";
import { Play, ShieldAlert, Monitor, VideoOff } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function LivePreviewPanel({
  isDarkMode,
  liveSourceType,
  setLiveSourceType,
  liveCameraId,
  setLiveCameraId,
  selectedUploadId,
  setSelectedUploadId,
  cameras,
  uploads,
  livePreviewUrl,
  renderVideoPreview,
}) {
  const t = themes.getThemeClasses(isDarkMode);

  return (
    <div className={`p-6 ${t.card}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
            Operations Center
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor size={18} /> Live Corridor Feed
          </h3>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            value={liveSourceType}
            onChange={(e) => setLiveSourceType(e.target.value)}
          >
            <option value="camera">Live Camera</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none max-w-[160px] truncate"
            value={liveCameraId}
            onChange={(e) => setLiveCameraId(e.target.value)}
          >
            {cameras?.length ? (
              cameras.map((camera) => (
                <option key={camera.id} value={camera.id} disabled={camera.status !== "Online"}>
                  {camera.name} ({camera.status})
                </option>
              ))
            ) : (
              <option value="" disabled>
                No cameras online
              </option>
            )}
          </select>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            OPERATIONAL
          </div>
        </div>
      </div>

      {/* Main player box */}
      <div className="relative">
        {renderVideoPreview(
          livePreviewUrl,
          "Select an active camera to begin streaming operational corridor feeds",
          "live"
        )}
      </div>
    </div>
  );
}
