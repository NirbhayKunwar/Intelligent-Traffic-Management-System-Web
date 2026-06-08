import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

// Subcomponents
import KPIGrid from "./components/KPIGrid";
import LivePreviewPanel from "./components/LivePreviewPanel";
import AlertFeed from "./components/AlertFeed";
import IncidentTimeline from "./components/IncidentTimeline";
import SystemHealth from "./components/SystemHealth";
import AnalyticsPanel from "./components/AnalyticsPanel";
import CameraGrid from "./components/CameraGrid";
import UploadManager from "./components/UploadManager";
import TrafficMap from "./components/TrafficMap";
import CongestionDetectionPanel from "./components/CongestionDetectionPanel";
import AccidentDetectionPanel from "./components/AccidentDetectionPanel";

// Skeletons
import { CardSkeleton, TableSkeleton, MapSkeleton, ChartSkeleton } from "../../Components/Skeleton";

// Tokens
import { themes } from "../../design-system/tokens";

export default function OperatorDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Operator Data States
  const [cameras, setCameras] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [jobMetrics, setJobMetrics] = useState({ accidents: 0, congestion: 0, alerts: 0 });
  const [congestionTrend, setCongestionTrend] = useState([]);
  const [trendHasRealData, setTrendHasRealData] = useState(false);
  const [jobHistory, setJobHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [operatorMessage, setOperatorMessage] = useState("");

  // Map & Controls state
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [congestionThreshold, setCongestionThreshold] = useState(65);
  const [liveCameraId, setLiveCameraId] = useState("");
  const [liveSourceType, setLiveSourceType] = useState("camera");
  const [congestionCameraId, setCongestionCameraId] = useState("");
  const [accidentCameraId, setAccidentCameraId] = useState("");
  const [congestionSourceType, setCongestionSourceType] = useState("camera");
  const [accidentSourceType, setAccidentSourceType] = useState("camera");
  const [isRunningCongestion, setIsRunningCongestion] = useState(false);
  const [isRunningAccident, setIsRunningAccident] = useState(false);

  const [cameraLabel, setCameraLabel] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStream, setEditStream] = useState("HLS");
  const [editStatus, setEditStatus] = useState("Online");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [mapDraftCoords, setMapDraftCoords] = useState(null); // Defaults to operator location or fallback
  const [mapTargetType, setMapTargetType] = useState("camera");

  // Mobile View Tabs: overview | map | analytics | settings
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const t = themes.getThemeClasses(isDarkMode);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const toMediaUrl = (value) => {
    if (!value) return "";
    const cleanValue = String(value).trim();
    if (/^https?:\/\//i.test(cleanValue) || /^data:/i.test(cleanValue) || /^blob:/i.test(cleanValue)) {
      return cleanValue;
    }
    const base = API_BASE.replace(/\/+$/, "");
    const path = cleanValue.replace(/^\/+/, "");
    return base ? `${base}/${path}` : `/${path}`;
  };

  const selectedLiveCamera = cameras.find((camera) => camera.id === liveCameraId) ?? cameras[0];
  const livePreviewUrl =
    liveSourceType === "camera"
      ? toMediaUrl(selectedLiveCamera?.previewUrl || selectedLiveCamera?.url || "")
      : "";

  const selectedCameraForMap = cameras.find((camera) => camera.id === liveCameraId) || cameras[0] || null;
  const selectedUploadForMap = uploads.find((upload) => upload.id === selectedUploadId) || uploads[0] || null;

  const selectedMapTarget =
    mapTargetType === "camera" ? selectedCameraForMap :
    mapTargetType === "upload" ? selectedUploadForMap :
    { name: "New Node Selection", id: "new_node" };

  const selectedCongestionCamera = cameras.find((camera) => camera.id === congestionCameraId) ?? cameras[0] ?? null;
  const selectedAccidentCamera = cameras.find((camera) => camera.id === accidentCameraId) ?? cameras[0] ?? null;
  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId) || null;

  const congestionPreviewUrl =
    congestionSourceType === "camera"
      ? toMediaUrl(selectedCongestionCamera?.previewUrl || selectedCongestionCamera?.url || "")
      : toMediaUrl(selectedUpload?.previewUrl || "");
  const accidentPreviewUrl =
    accidentSourceType === "camera"
      ? toMediaUrl(selectedAccidentCamera?.previewUrl || selectedAccidentCamera?.url || "")
      : toMediaUrl(selectedUpload?.previewUrl || "");

  const congestionTargetId = congestionSourceType === "camera" ? congestionCameraId : selectedUploadId;
  const mappedCongestionJob = jobHistory.find(j => j.type === "congestion" && j.status === "completed" && 
    (j.sourceId === congestionTargetId || j.fileId === congestionTargetId));
  const activeCongestionResult = mappedCongestionJob?.result || null;
  
  const accidentTargetId = accidentSourceType === "camera" ? accidentCameraId : selectedUploadId;
  const mappedAccidentJob =
    jobHistory.find(j => j.type === "accident" && j.status === "completed" && (j.sourceId === accidentTargetId || 
      j.fileId === accidentTargetId)) ||
    jobHistory.find(j => j.type === "accident" && j.status === "completed");
  const activeAccidentResult = mappedAccidentJob?.result || null;

  const applyCameraSelectionDefaults = (cameraList) => {
    const firstOnline = cameraList.find((camera) => camera.status === "Online");
    const fallbackId = firstOnline?.id || cameraList[0]?.id || "";
    setLiveCameraId((prev) => (cameraList.some((c) => c.id === prev) ? prev : fallbackId));
    setCongestionCameraId((prev) => (cameraList.some((c) => c.id === prev) ? prev : fallbackId));
    setAccidentCameraId((prev) => (cameraList.some((c) => c.id === prev) ? prev : fallbackId));
  };

  const loadDynamicOperatorData = useCallback(async () => {
    try {
      const [summaryData, trendData, jobsData, alertsData] = await Promise.all([
        apiRequest("/api/metrics/summary"),
        apiRequest("/api/metrics/congestion-trend"),
        apiRequest("/api/inference/jobs?limit=30"),
        apiRequest("/api/alerts?active=true"),
      ]);

      const summaryMetrics = summaryData?.metrics || {};
      setJobMetrics({
        accidents: Number(summaryMetrics.accidents) || 0,
        congestion: Number(summaryMetrics.congestion) || 0,
        alerts: Number(summaryMetrics.alerts) || 0,
      });

      const trendPoints = Array.isArray(trendData?.points) ? trendData.points : [];
      setTrendHasRealData(Boolean(trendData?.hasRealData));
      setCongestionTrend(trendPoints.map((value) => Math.max(0, Math.min(100, Number(value) || 0))));
      setJobHistory(Array.isArray(jobsData?.jobs) ? jobsData.jobs : []);
      setAlerts(Array.isArray(alertsData?.alerts) ? alertsData.alerts : []);
    } catch {
      // Keep UI resilient
    }
  }, []);

  const loadOperatorData = useCallback(async () => {
    try {
      const [cameraData, settingsData, uploadsData] = await Promise.all([
        apiRequest("/api/cameras"),
        apiRequest("/api/settings"),
        apiRequest("/api/uploads"),
      ]);

      const nextCameras = Array.isArray(cameraData?.cameras) ? cameraData.cameras : [];
      setCameras(nextCameras);
      applyCameraSelectionDefaults(nextCameras);

      const settings = settingsData?.settings || {};
      if (typeof settings.overlayEnabled === "boolean") setOverlayEnabled(settings.overlayEnabled);
      if (Number.isFinite(Number(settings.congestionThreshold))) {
        setCongestionThreshold(Number(settings.congestionThreshold));
      }

      const nextUploads = Array.isArray(uploadsData?.uploads) ? uploadsData.uploads : [];
      setUploads(nextUploads);
      setSelectedUploadId((prev) => (nextUploads.some((e) => e.id === prev) ? prev : nextUploads[0]?.id || ""));

      await loadDynamicOperatorData();
    } catch (err) {
      setOperatorMessage("Database communication failure. Retrying...");
    }
  }, [loadDynamicOperatorData]);

  // Session Loader
  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const data = await apiRequest("/api/auth/me");
        if (!mounted) return;
        if (data.user?.role === "user") {
          window.location.replace("/dashboard");
          return;
        }
        setUser(data.user);
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        if (err.message?.toLowerCase().includes("unauthorized")) {
          setStatus("unauth");
        } else {
          setStatus("error");
          setError(err.message || "Failed to load operations center.");
        }
      }
    }
    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    loadOperatorData().catch((err) => {
      setOperatorMessage(err.message || "Operations fetch failed.");
    });
  }, [status, user, loadOperatorData]);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    const interval = setInterval(() => {
      loadDynamicOperatorData().catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [status, user, loadDynamicOperatorData]);

  // Operations actions
  const saveCongestionThreshold = async (val) => {
    try {
      await apiRequest("/api/settings/congestion-threshold", {
        method: "PUT",
        body: { value: val },
      });
    } catch {}
  };

  const onThresholdChange = (val) => {
    setCongestionThreshold(val);
    saveCongestionThreshold(val);
  };

  const clearAllJobs = async () => {
    const ok = window.confirm("Are you sure you want to clear dispatch audit logs?");
    if (!ok) return;
    try {
      await apiRequest("/api/inference/jobs", { method: "DELETE" });
      setJobHistory([]);
      await loadOperatorData();
      setOperatorMessage("Inference statistics records cleared.");
    } catch (err) {
      setOperatorMessage(err.message || "Clean failed.");
    }
  };

  const uploadVideo = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append("video", uploadFile);
    setIsUploadingVideo(true);
    setOperatorMessage("");
    try {
      const response = await apiRequest("/api/uploads/video", {
        method: "POST",
        body: formData,
      });
      const upload = response?.upload;
      if (upload) {
        setUploads((prev) => [upload, ...prev]);
        setSelectedUploadId(upload.id);
        setMapTargetType("upload");
        if (upload.latitude && upload.longitude) {
          setMapDraftCoords([upload.latitude, upload.longitude]);
        }
        setOperatorMessage("Video clip uploaded. Pin its location coordinates on the map.");
      }
      setUploadFile(null);
    } catch (err) {
      setOperatorMessage(err.message || "Upload failed.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const deleteUpload = async (upload) => {
    const ok = window.confirm(`Permanently remove footage clip: "${upload.originalName}"?`);
    if (!ok) return;
    try {
      await apiRequest(`/api/uploads/${upload.id}`, { method: "DELETE" });
      setUploads((prev) => prev.filter((item) => item.id !== upload.id));
      if (selectedUploadId === upload.id) {
        setSelectedUploadId("");
      }
      setOperatorMessage("Video clip removed from database.");
    } catch (err) {
      setOperatorMessage(err.message || "Failed file deletion.");
    }
  };

  const deployAsCamera = async () => {
    if (mapTargetType !== "upload" || !selectedUploadId) return;
    try {
      const response = await apiRequest("/api/cameras/import-upload", {
        method: "POST",
        body: { uploadId: selectedUploadId },
      });
      const camera = response?.camera;
      if (camera) {
        setCameras((prev) => [camera, ...prev]);
        setLiveCameraId(camera.id);
        setOperatorMessage("Uploaded clip registered as camera feed.");
      }
    } catch (err) {
      setOperatorMessage(err.message || "Deployment failed.");
    }
  };

  const saveCameraCoordinates = async () => {
    if (!mapDraftCoords) return;
    try {
      if (mapTargetType === "camera" && selectedCameraForMap) {
        const response = await apiRequest(`/api/cameras/${selectedCameraForMap.id}`, {
          method: "PUT",
          body: { latitude: mapDraftCoords[0], longitude: mapDraftCoords[1] },
        });
        if (response?.camera) {
          setCameras((prev) =>
            prev.map((c) => (c.id === selectedCameraForMap.id ? response.camera : c))
          );
        }
      } else if (mapTargetType === "upload" && selectedUploadForMap) {
        const response = await apiRequest(`/api/uploads/${selectedUploadForMap.id}/coordinates`, {
          method: "PUT",
          body: { latitude: mapDraftCoords[0], longitude: mapDraftCoords[1] },
        });
        if (response?.upload) {
          setUploads((prev) =>
            prev.map((u) => (u.id === selectedUploadForMap.id ? { ...u, latitude: response.upload.latitude, longitude: response.upload.longitude } : u))
          );
        }
      }
      setOperatorMessage("Coordinates updated successfully.");
    } catch (err) {
      setOperatorMessage(err.message || "Failed update.");
    }
  };

  const createCamera = async () => {
    if (isDeploying || !cameraLabel.trim() || !streamUrl.trim()) return;
    setIsDeploying(true);
    try {
      const response = await apiRequest("/api/cameras", {
        method: "POST",
        body: {
          name: cameraLabel.trim(),
          url: streamUrl.trim(),
          latitude: mapDraftCoords?.[0] || null,
          longitude: mapDraftCoords?.[1] || null,
        },
      });
      if (response?.camera) {
        setCameras((prev) => [response.camera, ...prev]);
        setLiveCameraId(response.camera.id);
        setCameraLabel("");
        setStreamUrl("");
        setOperatorMessage("Camera registered successfully.");
      }
    } catch (err) {
      setOperatorMessage(err.message || "Deployment failed.");
    } finally {
      setIsDeploying(false);
    }
  };

  const updateCamera = async (camera) => {
    const nextName = editName.trim() || camera.name;
    try {
      const response = await apiRequest(`/api/cameras/${camera.id}`, {
        method: "PUT",
        body: {
          name: nextName,
          stream: editStream,
          status: editStatus,
          latitude: editLat === "" ? null : Number(editLat),
          longitude: editLng === "" ? null : Number(editLng),
        },
      });
      if (response?.camera) {
        setCameras((prev) => prev.map((c) => (c.id === camera.id ? response.camera : c)));
        setEditingCameraId(null);
        setOperatorMessage("Camera configurations updated.");
      }
    } catch (err) {
      setOperatorMessage(err.message || "Failed update.");
    }
  };

  const deleteCamera = async (camera) => {
    const ok = window.confirm(`Remove camera "${camera.name}"?`);
    if (!ok) return;
    try {
      await apiRequest(`/api/cameras/${camera.id}`, { method: "DELETE" });
      const nextCameras = cameras.filter((item) => item.id !== camera.id);
      setCameras(nextCameras);
      applyCameraSelectionDefaults(nextCameras);
      if (editingCameraId === camera.id) setEditingCameraId(null);
      setOperatorMessage("Camera removed.");
    } catch (err) {
      setOperatorMessage(err.message || "Deletion failed.");
    }
  };

  const runModel = async (type) => {
    const sourceType = type === "congestion" ? congestionSourceType : accidentSourceType;
    const sourceId = type === "congestion"
      ? (congestionSourceType === "camera" ? congestionCameraId : "")
      : (accidentSourceType === "camera" ? accidentCameraId : "");
    if (sourceType === "camera" && !sourceId) {
      setOperatorMessage("Select an online camera before running a model.");
      return;
    }
    if (sourceType === "upload" && !selectedUploadId) {
      setOperatorMessage("Upload/select a video before running a model.");
      return;
    }
    setOperatorMessage("");
    if (type === "congestion") setIsRunningCongestion(true);
    if (type === "accident") setIsRunningAccident(true);
    try {
      const response = await apiRequest("/api/inference/jobs", {
        method: "POST",
        body: {
          type,
          sourceType,
          sourceId: sourceType === "camera" ? sourceId : "",
          fileId: sourceType === "upload" ? selectedUploadId : "",
          threshold: congestionThreshold,
        },
      });
      await loadOperatorData();
      setOperatorMessage(
        `${type === "congestion" ? "Congestion" : "Accident"} job queued (${response?.job?.id || "pending"}).`
      );
    } catch (err) {
      setOperatorMessage(err.message || "Unable to run model.");
    } finally {
      if (type === "congestion") setIsRunningCongestion(false);
      if (type === "accident") setIsRunningAccident(false);
    }
  };

  // Video renderer
  const renderVideoPreview = (src, fallbackText, keyHint = "") => (
    <div className="aspect-video rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/40 flex items-center justify-center overflow-hidden">
      {src ? (
        <video key={`${src}-${keyHint}`} className="w-full h-full object-cover" controls muted autoPlay playsInline>
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="text-center p-6 space-y-2 opacity-50">
          <p className="text-xs font-semibold text-slate-800 dark:text-gray-300">{fallbackText}</p>
        </div>
      )}
    </div>
  );

  // Render loading skeletons
  if (status === "loading") {
    return (
      <div className={`min-h-screen pt-24 pb-16 ${t.bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <MapSkeleton />
            </div>
            <div className="lg:col-span-4">
              <ChartSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className={`min-h-screen pt-24 pb-16 flex items-center justify-center ${t.bg}`}>
        <div className="p-8 max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl text-center space-y-4">
          <h2 className="text-xl font-bold">Session Access Required</h2>
          <p className="text-sm text-slate-500">Please sign in to view the Traffic Operations Center.</p>
          <Link to="/login" className="inline-flex w-full justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`min-h-screen pt-24 pb-16 flex items-center justify-center ${t.bg}`}>
        <div className="p-8 max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-500">Operations Node Failure</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-xl">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-16 ${t.bg} font-inter transition-colors duration-300`}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Block */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 dark:border-white/5 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400 font-bold">
              Command & Control System
            </p>
            <h1 className="text-3xl font-poppins font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Traffic Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5">
              Operations Center Console for live streaming, deployment coordination, and incident routing.
            </p>
          </div>
          <Link to="/" className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-200">
            Back to Home
          </Link>
        </header>

        {operatorMessage && (
          <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-xs font-semibold animate-pulse">
            System Notice: {operatorMessage}
          </div>
        )}

        {/* 1. Mobile view tabs navigation */}
        <div className="lg:hidden flex gap-1 p-1 bg-slate-100 dark:bg-black/35 rounded-xl border border-slate-200/50 dark:border-white/5 text-xs font-bold">
          {[
            { id: "overview", label: "Overview" },
            { id: "map", label: "Live Map" },
            { id: "analytics", label: "Analytics" },
            { id: "settings", label: "Deployment" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2. Main Desktop / Mobile Grid Coordinator */}
        <div className="space-y-6">
          
          {/* Active on all views or tab "overview" */}
          {(activeTab === "overview" || activeTab === "settings") && (
            <KPIGrid
              isDarkMode={isDarkMode}
              jobMetrics={jobMetrics}
              cameras={cameras}
              congestionTrend={congestionTrend}
            />
          )}

          {/* Desktop Dual Columns Layout / Mobile Tabs Toggle */}
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Left Main (Map / Previews) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Live Preview Panel (Overview tab) */}
              {(activeTab === "overview" || activeTab === "map") && (
                <LivePreviewPanel
                  isDarkMode={isDarkMode}
                  liveSourceType={liveSourceType}
                  setLiveSourceType={setLiveSourceType}
                  liveCameraId={liveCameraId}
                  setLiveCameraId={setLiveCameraId}
                  selectedUploadId={selectedUploadId}
                  setSelectedUploadId={setSelectedUploadId}
                  cameras={cameras}
                  uploads={uploads}
                  livePreviewUrl={livePreviewUrl}
                  renderVideoPreview={renderVideoPreview}
                />
              )}

              {/* Congestion Detection Panel (Overview tab) */}
              {activeTab === "overview" && (
                <CongestionDetectionPanel
                  isDarkMode={isDarkMode}
                  congestionSourceType={congestionSourceType}
                  setCongestionSourceType={setCongestionSourceType}
                  congestionCameraId={congestionCameraId}
                  setCongestionCameraId={setCongestionCameraId}
                  selectedUploadId={selectedUploadId}
                  setSelectedUploadId={setSelectedUploadId}
                  cameras={cameras}
                  uploads={uploads}
                  congestionPreviewUrl={congestionPreviewUrl}
                  renderVideoPreview={renderVideoPreview}
                  runModel={runModel}
                  isRunningCongestion={isRunningCongestion}
                  mappedCongestionJob={mappedCongestionJob}
                  activeCongestionResult={activeCongestionResult}
                />
              )}

              {/* Accident Detection Panel (Overview tab) */}
              {activeTab === "overview" && (
                <AccidentDetectionPanel
                  isDarkMode={isDarkMode}
                  accidentSourceType={accidentSourceType}
                  setAccidentSourceType={setAccidentSourceType}
                  accidentCameraId={accidentCameraId}
                  setAccidentCameraId={setAccidentCameraId}
                  selectedUploadId={selectedUploadId}
                  setSelectedUploadId={setSelectedUploadId}
                  cameras={cameras}
                  uploads={uploads}
                  accidentPreviewUrl={accidentPreviewUrl}
                  renderVideoPreview={renderVideoPreview}
                  runModel={runModel}
                  isRunningAccident={isRunningAccident}
                  mappedAccidentJob={mappedAccidentJob}
                  activeAccidentResult={activeAccidentResult}
                />
              )}

              {/* Leaflet Map (Overview, Map, or Settings tab) */}
              {(activeTab === "overview" || activeTab === "map" || activeTab === "settings") && (
                <TrafficMap
                  isDarkMode={isDarkMode}
                  cameras={cameras}
                  uploads={uploads}
                  mapDraftCoords={mapDraftCoords}
                  setMapDraftCoords={setMapDraftCoords}
                  mapTargetType={mapTargetType}
                  setMapTargetType={setMapTargetType}
                  selectedMapTarget={selectedMapTarget}
                  saveCameraCoordinates={saveCameraCoordinates}
                  deployAsCamera={deployAsCamera}
                  isDeploying={isDeploying}
                  operatorMessage={operatorMessage}
                />
              )}
            </div>

            {/* Right Main (Feeds / Audits) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {(activeTab === "overview" || activeTab === "map") && (
                <AlertFeed
                  isDarkMode={isDarkMode}
                  alerts={alerts}
                  onRefresh={loadOperatorData}
                />
              )}

              {(activeTab === "overview" || activeTab === "analytics") && (
                <IncidentTimeline
                  isDarkMode={isDarkMode}
                  alerts={alerts}
                />
              )}
            </div>
          </div>

          {/* Analytics area (Desktop grid / Mobile tab) */}
          {(activeTab === "overview" || activeTab === "analytics") && (
            <AnalyticsPanel
              isDarkMode={isDarkMode}
              congestionTrend={congestionTrend}
              congestionThreshold={congestionThreshold}
              trendHasRealData={trendHasRealData}
              jobMetrics={jobMetrics}
            />
          )}

          {/* System health row (Desktop grid / Mobile tab) */}
          {(activeTab === "overview" || activeTab === "analytics") && (
            <SystemHealth
              isDarkMode={isDarkMode}
              cameras={cameras}
            />
          )}

          {/* Camera deployment configurations & upload files cards (Desktop grid / Mobile tab) */}
          {(activeTab === "overview" || activeTab === "settings") && (
            <div className="space-y-6">
              <CameraGrid
                isDarkMode={isDarkMode}
                cameras={cameras}
                cameraLabel={cameraLabel}
                setCameraLabel={setCameraLabel}
                streamUrl={streamUrl}
                setStreamUrl={setStreamUrl}
                createCamera={createCamera}
                isDeploying={isDeploying}
                editingCameraId={editingCameraId}
                setEditingCameraId={setEditingCameraId}
                editName={editName}
                setEditName={setEditName}
                editStream={editStream}
                setEditStream={setEditStream}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                editLat={editLat}
                setEditLat={setEditLat}
                editLng={editLng}
                setEditLng={setEditLng}
                updateCamera={updateCamera}
                deleteCamera={deleteCamera}
                mapDraftCoords={mapDraftCoords}
                setMapTargetType={setMapTargetType}
              />

              <UploadManager
                isDarkMode={isDarkMode}
                uploads={uploads}
                selectedUploadId={selectedUploadId}
                setSelectedUploadId={setSelectedUploadId}
                uploadFile={uploadFile}
                setUploadFile={setUploadFile}
                uploadVideo={uploadVideo}
                isUploadingVideo={isUploadingVideo}
                deleteUpload={deleteUpload}
                setMapTargetType={setMapTargetType}
              />

              {/* Threshold Adjuster Controller Card */}
              <div className={`p-6 ${t.card}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                      Operations Controls
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Overlay Sensitivity Limit
                    </h3>
                  </div>
                  <button type="button" onClick={clearAllJobs} className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/10 text-xs font-bold text-rose-600">
                    Purge Incident Records
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-600 dark:text-gray-300">Congestion Threshold Limit</span>
                    <span className="text-cyan-500 font-mono text-sm">{congestionThreshold} Vehicles</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={congestionThreshold}
                    onChange={(e) => onThresholdChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-1">
                    <span>Peak Alert (5)</span>
                    <span>Standard (40)</span>
                    <span>Lenient (80)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
