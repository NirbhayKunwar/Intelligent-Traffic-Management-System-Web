import React from "react";
import { Upload, Video, Trash2, MapPin, Film } from "lucide-react";
import { themes } from "../../../design-system/tokens";

export default function UploadManager({
  isDarkMode,
  uploads,
  selectedUploadId,
  setSelectedUploadId,
  uploadFile,
  setUploadFile,
  uploadVideo,
  isUploadingVideo,
  deleteUpload,
  setMapTargetType,
}) {
  const t = themes.getThemeClasses(isDarkMode);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* 1. Drag & drop uploader panel */}
      <div className={`p-6 ${t.card} lg:col-span-4 space-y-4 flex flex-col justify-between`}>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
            Storage Manager
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Upload Incident Footage
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-center py-6">
          <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-black/10 transition-colors flex flex-col items-center justify-center gap-3">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-500">
              <Upload size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {uploadFile ? uploadFile.name : "Select video clip"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                MP4, MOV up to 50MB
              </p>
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={uploadVideo}
          disabled={isUploadingVideo || !uploadFile}
          className={`${t.buttonPrimary} w-full`}
        >
          {isUploadingVideo ? "Uploading Stream..." : "Upload Incident Video"}
        </button>
      </div>

      {/* 2. Uploaded video lists panel */}
      <div className={`p-6 ${t.card} lg:col-span-8 space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
              Incident Database
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Footage Library
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-black/35 font-mono text-slate-700 dark:text-gray-300 font-bold border border-slate-200/50 dark:border-white/5">
            {uploads?.length || 0} Clips
          </span>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {uploads?.length > 0 ? (
            uploads.map((upload) => {
              const hasCoords = Number.isFinite(Number(upload.latitude)) && Number.isFinite(Number(upload.longitude));
              const isSelected = selectedUploadId === upload.id;

              return (
                <div
                  key={upload.id}
                  onClick={() => setSelectedUploadId(upload.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500/10 dark:bg-cyan-950/20"
                      : "border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-gray-400 rounded-lg">
                      <Film size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {upload.originalName}
                      </p>
                      <p className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${
                        hasCoords ? "text-emerald-500 font-medium" : "text-slate-400"
                      }`}>
                        <MapPin size={10} />
                        {hasCoords
                          ? `${Number(upload.latitude).toFixed(4)}°N, ${Number(upload.longitude).toFixed(4)}°E`
                          : "No location coordinates pinned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUploadId(upload.id);
                        setMapTargetType("upload");
                        document.getElementById("camera-location-map")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/25"
                      title="Pin on map"
                    >
                      Pin Coords
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUpload(upload)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      title="Remove file"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-10 space-y-2 opacity-60">
              <Video size={28} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                No footage clips available in database.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Upload MP4 files above to map accident zones.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
