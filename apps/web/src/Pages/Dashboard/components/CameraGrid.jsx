import React from "react";
import { Edit2, Trash2, MapPin, Plus, Play, Info } from "lucide-react";
import { StatusBadge } from "../../../Components/StatusBadge";
import { NoCamerasState } from "../../../Components/EmptyState";
import { themes } from "../../../design-system/tokens";

export default function CameraGrid({
  isDarkMode,
  cameras,
  cameraLabel,
  setCameraLabel,
  streamUrl,
  setStreamUrl,
  createCamera,
  isDeploying,
  editingCameraId,
  setEditingCameraId,
  editName,
  setEditName,
  editStream,
  setEditStream,
  editStatus,
  setEditStatus,
  editLat,
  setEditLat,
  editLng,
  setEditLng,
  updateCamera,
  deleteCamera,
  mapDraftCoords,
  setMapTargetType,
}) {
  const t = themes.getThemeClasses(isDarkMode);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* 1. Camera deployment controller form */}
      <div className={`p-4 sm:p-6 ${t.card} lg:col-span-4 space-y-4`}>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
            Node Deployer
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Register Live Camera
          </h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Feed Name</span>
            <input
              className={`${t.input}`}
              placeholder="e.g. Intersection A5"
              value={cameraLabel}
              onChange={(e) => setCameraLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Stream Connection URL</span>
            <input
              className={`${t.input}`}
              placeholder="RTSP / HLS URL"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold border-t border-slate-100 dark:border-white/5 pt-2">
            <span className="text-slate-400">
              {mapDraftCoords ? (
                <span className="text-emerald-500">📍 Pinned: {mapDraftCoords[0].toFixed(4)}, {mapDraftCoords[1].toFixed(4)}</span>
              ) : (
                "📍 Set location on map"
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setMapTargetType("new_camera");
                document.getElementById("camera-location-map")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-cyan-500 hover:underline"
            >
              Pin Coordinates
            </button>
          </div>

          <button
            type="button"
            onClick={createCamera}
            disabled={isDeploying || !cameraLabel.trim() || !streamUrl.trim()}
            className={`${t.buttonPrimary} w-full mt-2`}
          >
            <Plus size={15} /> {isDeploying ? "Deploying Node..." : "Deploy Camera Node"}
          </button>
        </div>
      </div>

      {/* 2. Deployed cameras visual list */}
      <div className={`p-4 sm:p-6 ${t.card} lg:col-span-8 space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
              Corridor Operations
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              CCTV Camera Nodes
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-black/35 font-mono text-slate-700 dark:text-gray-300 font-bold border border-slate-200/50 dark:border-white/5">
            {cameras?.length || 0} Registered
          </span>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          {cameras?.length > 0 ? (
            cameras.map((camera) => (
              <div
                key={camera.id}
                className={`p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {camera.name}
                      <StatusBadge status={camera.status} />
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono break-all">
                      Stream: {camera.stream} | URL: {camera.url}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Last pinged: {camera.lastPing || "No response logs"}
                    </p>
                  </div>

                  <div className="flex gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingCameraId === camera.id) {
                          setEditingCameraId(null);
                        } else {
                          setEditingCameraId(camera.id);
                          setEditName(camera.name);
                          setEditStream(camera.stream);
                          setEditStatus(camera.status);
                          setEditLat(camera.latitude ?? "");
                          setEditLng(camera.longitude ?? "");
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300"
                      title="Edit Configuration"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCamera(camera)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      title="Remove Node"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Inline Editing Drawer */}
                {editingCameraId === camera.id && (
                  <div className="mt-4 p-4 border-t border-slate-200/40 dark:border-white/5 pt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Node Name</span>
                        <input
                          className={`${t.input}`}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Protocol</span>
                          <select
                            className="w-full h-10 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/35 text-xs text-slate-900 dark:text-white focus:outline-none"
                            value={editStream}
                            onChange={(e) => setEditStream(e.target.value)}
                          >
                            <option value="HLS">HLS</option>
                            <option value="RTSP">RTSP</option>
                            <option value="Custom">Custom</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Status</span>
                          <select
                            className="w-full h-10 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/35 text-xs text-slate-900 dark:text-white focus:outline-none"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <option value="Online">Online</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Offline">Offline</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Latitude</span>
                        <input
                          className={`${t.input} font-mono text-xs`}
                          type="number"
                          step="any"
                          value={editLat}
                          onChange={(e) => setEditLat(e.target.value)}
                          placeholder="e.g. 30.3122"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Longitude</span>
                        <input
                          className={`${t.input} font-mono text-xs`}
                          type="number"
                          step="any"
                          value={editLng}
                          onChange={(e) => setEditLng(e.target.value)}
                          placeholder="e.g. 78.0322"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMapTargetType("camera");
                          document.getElementById("camera-location-map")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20"
                      >
                        Pin Coords on Map
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCamera(camera)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500"
                      >
                        Save Configurations
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCameraId(null)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <NoCamerasState />
          )}
        </div>
      </div>
    </div>
  );
}
