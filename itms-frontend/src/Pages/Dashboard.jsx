import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { apiRequest } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, LabelList } from "recharts";
import UserDashboard from "./UserDashboard";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// This component renders the dashboard page based on authentication and role. Users see the user dashboard; operators see the operations layout with live preview, alerts, detection panels, controls, and camera setup.
export default function Dashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartColors = {
    stroke: "#06b6d4",
    fill: "#06b6d4",
    grid: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    text: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    tooltipBg: isDarkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
    tooltipText: isDarkMode ? "#fff" : "#000"
  };

  const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // State variables for operator dashboard controls and data. These include toggles for overlays, congestion thresholds, selected live camera, camera list, input fields for adding/editing cameras, and deployment state.
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [congestionThreshold, setCongestionThreshold] = useState(65);
  const [liveCameraId, setLiveCameraId] = useState("");
  const [liveSourceType, setLiveSourceType] = useState("camera");
  const [congestionCameraId, setCongestionCameraId] = useState("");
  const [accidentCameraId, setAccidentCameraId] = useState("");
  const [congestionSourceType, setCongestionSourceType] = useState("camera");
  const [accidentSourceType, setAccidentSourceType] = useState("camera");
  const [cameras, setCameras] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [sampleVideos, setSampleVideos] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [congestionResult] = useState(null);
  const [accidentResult] = useState(null);
  const [isRunningCongestion, setIsRunningCongestion] = useState(false);
  const [isRunningAccident, setIsRunningAccident] = useState(false);
  const [operatorMessage, setOperatorMessage] = useState("");
  const [jobMetrics, setJobMetrics] = useState({ accidents: 0, congestion: 0, alerts: 0 });
  const [congestionTrend, setCongestionTrend] = useState([]);
  const [trendHasRealData, setTrendHasRealData] = useState(false);
  const [sampleScanInfo, setSampleScanInfo] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // State variables for managing camera addition and editing forms. These include input fields for camera name and stream URL, deployment state to toggle between add/edit modes, and fields for editing existing cameras.
  const [cameraLabel, setCameraLabel] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStream, setEditStream] = useState("HLS");
  const [editStatus, setEditStatus] = useState("Online");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [mapDraftCoords, setMapDraftCoords] = useState([30.3165, 78.0322]);
  const [mapTargetType, setMapTargetType] = useState("camera");
  const [mapCameraId, setMapCameraId] = useState("");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [shouldMapFly, setShouldMapFly] = useState(false); // New flag to control focal jumps


  const applyCameraSelectionDefaults = (cameraList) => {
    const firstOnline = cameraList.find((camera) => camera.status === "Online");
    const fallbackId = firstOnline?.id || cameraList[0]?.id || "";
    setLiveCameraId((prev) =>
      cameraList.some((camera) => camera.id === prev) ? prev : fallbackId
    );
    setCongestionCameraId((prev) =>
      cameraList.some((camera) => camera.id === prev) ? prev : fallbackId
    );
    setAccidentCameraId((prev) =>
      cameraList.some((camera) => camera.id === prev) ? prev : fallbackId
    );
    setMapCameraId((prev) =>
      cameraList.some((camera) => camera.id === prev) ? prev : fallbackId
    );
  };
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
  const selectedCameraForMap = cameras.find((camera) => camera.id === mapCameraId) || cameras[0] || null;
  const selectedUploadForMap = uploads.find((upload) => upload.id === selectedUploadId) || uploads[0] || null;
  const selectedMapTarget = 
    mapTargetType === "camera" ? selectedCameraForMap : 
    mapTargetType === "upload" ? selectedUploadForMap : 
    { name: "New Camera Deployment", id: "new_camera_selection" };
  
  const selectedLiveCamera = cameras.find((camera) => camera.id === liveCameraId) ?? cameras[0];
  const selectedCongestionCamera =
    cameras.find((camera) => camera.id === congestionCameraId) ?? cameras[0] ?? null;
  const selectedAccidentCamera =
    cameras.find((camera) => camera.id === accidentCameraId) ?? cameras[0] ?? null;
  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId) || null;
  const livePreviewUrl =
    liveSourceType === "camera"
      ? toMediaUrl(selectedLiveCamera?.previewUrl || selectedLiveCamera?.url || "")
      : ""; // Cloudinary uploads hidden from main Live Preview until deployed as camera
  const congestionPreviewUrl =
    congestionSourceType === "camera"
      ? toMediaUrl(selectedCongestionCamera?.previewUrl || selectedCongestionCamera?.url || "")
      : toMediaUrl(selectedUpload?.previewUrl || "");
  const accidentPreviewUrl =
    accidentSourceType === "camera"
      ? toMediaUrl(selectedAccidentCamera?.previewUrl || selectedAccidentCamera?.url || "")
      : toMediaUrl(selectedUpload?.previewUrl || "");

  const settingPreviewUrl = useMemo(() => {
    if (mapTargetType === "camera") {
      const target = cameras.find(c => c.id === mapCameraId) || cameras[0];
      return toMediaUrl(target?.previewUrl || target?.url || "");
    }
    if (mapTargetType === "upload") {
      const target = uploads.find(u => u.id === selectedUploadId) || uploads[0];
      return toMediaUrl(target?.path || target?.previewUrl || "");
    }
    if (mapTargetType === "sample") {
      const target = sampleVideos.find(v => v.id === selectedSampleId) || sampleVideos[0];
      return toMediaUrl(target?.path || "");
    }
    return "";
  }, [mapTargetType, mapCameraId, cameras, uploads, selectedUploadId, sampleVideos, selectedSampleId]);
  const renderVideoPreview = (src, fallbackText, keyHint = "") => (
    <div className="aspect-video rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center overflow-hidden text-slate-800 dark:text-gray-400">
      {src ? (
        <video
          key={`${src}-${keyHint}`}
          className="w-full h-full object-cover"
          controls
          muted
          autoPlay
          playsInline
          onError={(e) => {
            const videoEl = e.currentTarget; // Always targets the <video>
            if (src.includes("itms_datasets") && !videoEl.dataset.retried) {
              const altSrc = src.replace("itms_datasets", "itms%20datasets");
              console.warn("⚠️ Preview 404 [itms_datasets]. Retrying with [itms datasets]:", altSrc);
              videoEl.dataset.retried = "true";
              videoEl.src = altSrc;
              if (typeof videoEl.load === 'function') videoEl.load();
            } else {
              console.error(`❌ CLIP FAILED:`, src);
            }
          }}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="text-center space-y-2 px-3">
          <p>{fallbackText}</p>
        </div>
      )}
    </div>
  );
  function MapClickPicker({ onPick }) {
    useMapEvents({
      click(event) {
        const { lat, lng } = event.latlng;
        onPick([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      },
    });
    return null;
  }
  function MapFlyTo({ coords, active }) {
    const map = useMap();
    const lastCoordsRef = useRef("");
    
    useEffect(() => {
      if (!coords || !map || !active) return;
      const coordStr = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
      if (lastCoordsRef.current === coordStr) return;
      
      // Large moves (target switch jumps)
      map.flyTo(coords, 15, { animate: true, duration: 1.5 });
      lastCoordsRef.current = coordStr;
      
      // Reset trigger after flying to prevent shaking on subsequent state updates
      setShouldMapFly(false);
    }, [coords, map, active]);
    return null;
  }
  const loadDynamicOperatorData = useCallback(async () => {
    // These need high-frequency updates (2s)
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
    setCongestionTrend(
      trendPoints.map((value) => Math.max(0, Math.min(100, Number(value) || 0)))
    );

    setJobHistory(Array.isArray(jobsData?.jobs) ? jobsData.jobs : []);
    setAlerts(Array.isArray(alertsData?.alerts) ? alertsData.alerts : []);
  }, []);

  const loadOperatorData = useCallback(async () => {
    try {
      // Initial fetch of static configuration and media lists
      const [cameraData, settingsData, uploadsData, samplesData] = await Promise.all([
        apiRequest("/api/cameras"),
        apiRequest("/api/settings"),
        apiRequest("/api/uploads"),
        apiRequest("/api/samples/videos"),
      ]);
      
      // Update persistent settings and CCTV feeds
      const nextCameras = Array.isArray(cameraData?.cameras) ? cameraData.cameras : [];
      setCameras(nextCameras);
      applyCameraSelectionDefaults(nextCameras);

      const settings = settingsData?.settings || {};
      if (typeof settings.overlayEnabled === "boolean") {
        setOverlayEnabled(settings.overlayEnabled);
      }
      if (Number.isFinite(Number(settings.congestionThreshold))) {
        setCongestionThreshold(Number(settings.congestionThreshold));
      }

      const nextUploads = Array.isArray(uploadsData?.uploads) ? uploadsData.uploads : [];
      setUploads(nextUploads);
      setSelectedUploadId((prev) =>
        nextUploads.some((entry) => entry.id === prev) ? prev : nextUploads[0]?.id || ""
      );

      // Map the samples (backend uses 'videos' key)
      const samples = Array.isArray(samplesData?.videos) ? samplesData.videos : [];
      setSampleVideos(samples);
      setSampleScanInfo(Array.isArray(samplesData?.scanned) ? samplesData.scanned : []);
      setSelectedSampleId((prev) =>
        samples.some((entry) => entry.id === prev) ? prev : samples[0]?.id || ""
      );

      // Now fetch the dynamic metrics (Jobs, Alerts)
      await loadDynamicOperatorData();
    } catch (err) {
      console.error("Dashboard Load Fail:", err);
      setOperatorMessage("Hardware communication failure. Retrying...");
    }
  }, [loadDynamicOperatorData]);
  const saveCongestionThreshold = async (nextValue) => {
    try {
      await apiRequest("/api/settings/congestion-threshold", {
        method: "PUT",
        body: { value: nextValue },
      });
    } catch {
      // Keep UI responsive even if save fails temporarily.
    }
  };
  const onThresholdChange = (nextValue) => {
    setCongestionThreshold(nextValue);
    saveCongestionThreshold(nextValue);
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
  const clearAllJobs = async () => {
    const ok = window.confirm("Are you sure you want to clear all inference jobs from history?");
    if (!ok) return;
    try {
      await apiRequest("/api/inference/jobs", { method: "DELETE" });
      setJobHistory([]);
      await loadOperatorData();
      setOperatorMessage("Inference job history and alert metrics cleared.");
    } catch (err) {
      setOperatorMessage(err.message || "Unable to clear jobs.");
    }
  };
  const uploadVideo = async () => {
    if (!uploadFile) {
      setOperatorMessage("Choose a video file first.");
      return;
    }
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
        setAccidentSourceType("upload");
        setCongestionSourceType("upload");
        // Auto-switch map to this upload so user can pin its location immediately
        setMapTargetType("upload");
        setMapCameraId("");
        setShouldMapFly(true); // Jump to new upload on map
      }
      setUploadFile(null);
      setOperatorMessage("Video uploaded! Click on the map below to pin its location.");
    } catch (err) {
      setOperatorMessage(err.message || "Video upload failed.");
    } finally {
      setIsUploadingVideo(false);
    }
  };
  const deployAsCamera = async () => {
    if (mapTargetType === "sample") {
      if (!selectedSampleId) {
        setOperatorMessage("Choose a sample video first.");
        return;
      }
      try {
        const response = await apiRequest("/api/cameras/import-sample", {
          method: "POST",
          body: { sampleId: selectedSampleId },
        });
        const camera = response?.camera;
        if (camera) {
          setCameras((prev) => [camera, ...prev]);
          setLiveCameraId(camera.id);
          setOperatorMessage("Sample video deployed as camera feed.");
        }
      } catch (err) {
        setOperatorMessage(err.message || "Unable to deploy sample video.");
      }
    } else if (mapTargetType === "upload") {
      if (!selectedUploadId) {
        setOperatorMessage("Select an upload first.");
        return;
      }
      try {
        const response = await apiRequest("/api/cameras/import-upload", {
          method: "POST",
          body: { uploadId: selectedUploadId },
        });
        const camera = response?.camera;
        if (camera) {
          setCameras((prev) => [camera, ...prev]);
          setLiveCameraId(camera.id);
          setOperatorMessage("Uploaded video deployed as camera feed.");
        }
      } catch (err) {
        setOperatorMessage(err.message || "Unable to deploy uploaded video.");
      }
    }
  };
  const saveCameraCoordinates = async () => {
    if (!selectedMapTarget || !mapDraftCoords) {
      setOperatorMessage("Select a source and pick a location on the map first.");
      return;
    }
    try {
      if (mapTargetType === "camera") {
        const response = await apiRequest(`/api/cameras/${selectedMapTarget.id}`, {
          method: "PUT",
          body: {
            latitude: mapDraftCoords[0],
            longitude: mapDraftCoords[1],
          },
        });
        const updated = response?.camera;
        if (updated) {
          setCameras((prev) =>
            prev.map((entry) => (entry.id === selectedMapTarget.id ? updated : entry))
          );
        }
      } else if (mapTargetType === "upload") {
        const response = await apiRequest(`/api/uploads/${selectedMapTarget.id}/coordinates`, {
          method: "PUT",
          body: {
            latitude: mapDraftCoords[0],
            longitude: mapDraftCoords[1],
          },
        });
        const updatedUpload = response?.upload;
        if (updatedUpload) {
          setUploads((prev) =>
            prev.map((entry) =>
              entry.id === selectedMapTarget.id
                ? { ...entry, latitude: updatedUpload.latitude, longitude: updatedUpload.longitude }
                : entry
            )
          );
        }
      } else {
        // new_camera mode: coordinates are stored in mapDraftCoords state and used on Deploy button click
        setOperatorMessage("New location pinned! Now scroll up and click 'Deploy Camera' to save.");
        return;
      }
      setOperatorMessage(
        mapTargetType === "camera" ? "Camera coordinates saved." : "Uploaded video coordinates saved."
      );
    } catch (err) {
      setOperatorMessage(err.message || "Unable to save camera coordinates.");
    }
  };
  const createCamera = async () => {
    if (isDeploying) return;
    const name = cameraLabel.trim();
    const url = streamUrl.trim();
    if (!name || !url) {
      setOperatorMessage("Camera label and stream URL are required.");
      return;
    }
    setIsDeploying(true);
    try {
      let finalUrl = url;
      let finalName = name;
      
      // Auto-logic: if user is on map target but URL is empty, pull from target
      if (!finalUrl) {
        if (mapTargetType === "upload" && selectedUploadForMap) {
          finalUrl = selectedUploadForMap.path;
          if (!finalName) finalName = `Deployed: ${selectedUploadForMap.originalName}`;
        } else if (mapTargetType === "sample") {
          const s = sampleVideos.find(v => v.id === selectedSampleId);
          if (s) {
            finalUrl = s.path;
            if (!finalName) finalName = `Sample: ${s.name}`;
          }
        }
      }

      if (!finalUrl) {
        setIsDeploying(false);
        setOperatorMessage("Stream URL is required (or select an upload/sample first).");
        return;
      }

      let response;
      let repairedRole = false;
      try {
        response = await apiRequest("/api/cameras", {
          method: "POST",
          body: { 
            name: finalName || "City Camera", 
            url: finalUrl, 
            latitude: mapDraftCoords?.[0] || null, 
            longitude: mapDraftCoords?.[1] || null 
          },
        });
      } catch (err) {
        const message = String(err.message || "").toLowerCase();
        if (message.includes("operator access required")) {
          await apiRequest("/api/auth/bootstrap-operator", { method: "POST" });
          response = await apiRequest("/api/cameras", {
            method: "POST",
            body: { 
              name, 
              url, 
              latitude: mapDraftCoords?.[0] || null, 
              longitude: mapDraftCoords?.[1] || null 
            },
          });
          repairedRole = true;
          setUser((prev) => (prev ? { ...prev, role: "operator" } : prev));
        } else {
          throw err;
        }
      }
      const nextCamera = response?.camera;
      if (!nextCamera) return;
      setCameras((prev) => [nextCamera, ...prev]);
      setLiveCameraId(nextCamera.id);
      setCongestionCameraId(nextCamera.id);
      setAccidentCameraId(nextCamera.id);
      setCameraLabel("");
      setStreamUrl("");
      setMapDraftCoords(DEHRADUN);
      setOperatorMessage(
        repairedRole ? "Operator role repaired and camera deployed with location." : "Camera deployed successfully with location."
      );
    } catch (err) {
      setOperatorMessage(err.message || "Unable to deploy camera.");
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
      const updatedCamera = response?.camera;
      if (!updatedCamera) return;
      setCameras((prev) => prev.map((item) => (item.id === camera.id ? updatedCamera : item)));
      setEditingCameraId(null);
      setOperatorMessage("Camera updated.");
    } catch (err) {
      setOperatorMessage(err.message || "Unable to update camera.");
    }
  };
  const deleteCamera = async (camera) => {
    const ok = window.confirm(`Delete ${camera.name}?`);
    if (!ok) return;
    try {
      await apiRequest(`/api/cameras/${camera.id}`, { method: "DELETE" });
      const nextCameras = cameras.filter((item) => item.id !== camera.id);
      setCameras(nextCameras);
      applyCameraSelectionDefaults(nextCameras);
      if (editingCameraId === camera.id) {
        setEditingCameraId(null);
      }
      setOperatorMessage("Camera deleted.");
    } catch (err) {
      setOperatorMessage(err.message || "Unable to delete camera.");
    }
  };

  const deleteUpload = async (upload) => {
    const ok = window.confirm(`Delete "${upload.originalName}"? The file will be permanently removed.`);
    if (!ok) return;
    try {
      await apiRequest(`/api/uploads/${upload.id}`, { method: "DELETE" });
      const nextUploads = uploads.filter((item) => item.id !== upload.id);
      setUploads(nextUploads);
      // Clear references if this was the selected upload
      if (selectedUploadId === upload.id) {
        setSelectedUploadId(nextUploads[0]?.id || "");
      }
      setOperatorMessage(`"${upload.originalName}" deleted.`);
    } catch (err) {
      setOperatorMessage(err.message || "Unable to delete upload.");
    }
  };

// useEffect hook to load the user's session data when the component mounts. It makes an API request to check the user's authentication status and retrieves their information. The component manages different states for loading, error, and unauthenticated scenarios, and updates the UI accordingly.
  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const data = await apiRequest("/api/auth/me");
        if (!mounted) return;
        setUser(data.user);
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        if (err.message?.toLowerCase().includes("unauthorized")) {
          setStatus("unauth");
        } else {
          setStatus("error");
          setError(err.message || "Unable to load dashboard.");
        }
      }
    }

// Call the loadSession function to check the user's authentication status and load their information when the component mounts. The function handles different scenarios for unauthenticated users and errors, updating the component's state accordingly.
    loadSession();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (status !== "ready" || !user || user.role === "user") return;
    loadOperatorData().catch((err) => {
      setOperatorMessage(err.message || "Unable to load operator data.");
    });
  }, [status, user, loadOperatorData]);
  useEffect(() => {
    if (status !== "ready" || !user || user.role === "user") return;
    const interval = setInterval(() => {
      loadDynamicOperatorData().catch(() => {});
    }, 2000); // 2s polling for smoother progress (metrics/jobs only)
    return () => clearInterval(interval);
  }, [status, user, loadOperatorData]);
  const DEHRADUN = [30.3165, 78.0322];
  useEffect(() => {
    if (!selectedMapTarget || mapTargetType === "new_camera") return;
    const lat = Number(selectedMapTarget.latitude);
    const lng = Number(selectedMapTarget.longitude);
    if (
      selectedMapTarget.latitude !== undefined &&
      selectedMapTarget.latitude !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !(lat === 0 && lng === 0) &&
      lat > 6 && lat < 38 && lng > 68 && lng < 101
    ) {
      setMapDraftCoords(prev => {
        if (prev && Math.abs(prev[0] - lat) < 0.000001 && Math.abs(prev[1] - lng) < 0.000001) {
          return prev;
        }
        setShouldMapFly(true); // Signal a jump because the target has valid coordinates
        return [lat, lng];
      });
    }
  }, [selectedMapTarget, mapTargetType]);

  // Derived state for results dynamically scoped to selected views
  const liveTargetId = liveSourceType === "camera" ? liveCameraId : selectedUploadId;
  const mappedLiveCongestionJob = jobHistory.find(j => j.type === "congestion" && j.status === "completed" && (j.sourceId === liveTargetId || j.fileId === liveTargetId));
  const mappedLiveAccidentJob = jobHistory.find(j => j.type === "accident" && j.status === "completed" && (j.sourceId === liveTargetId || j.fileId === liveTargetId));
  
  const congestionTargetId = congestionSourceType === "camera" ? congestionCameraId : selectedUploadId;
  const mappedCongestionJob = jobHistory.find(j => j.type === "congestion" && j.status === "completed" && (j.sourceId === congestionTargetId || j.fileId === congestionTargetId));
  const activeCongestionResult = mappedCongestionJob?.result || congestionResult;
  
  const accidentTargetId = accidentSourceType === "camera" ? accidentCameraId : selectedUploadId;
  // First try to find a result for the selected camera/upload
  // Fall back to the most recent completed accident job so the panel is never blank
  const mappedAccidentJob =
    jobHistory.find(j => j.type === "accident" && j.status === "completed" && (j.sourceId === accidentTargetId || j.fileId === accidentTargetId)) ||
    jobHistory.find(j => j.type === "accident" && j.status === "completed");
  const activeAccidentResult = mappedAccidentJob?.result || accidentResult;


// Define a set of common classes for the dashboard cards, including styling for gradient backgrounds, borders, shadows, and responsive design. This variable is used to maintain consistent styling across different sections of the dashboard.
  const cardClasses =
    "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl";
  const compactCardClasses =
    "relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl";
  const trendViewBoxWidth = 420;
  const trendViewBoxHeight = 160;
  const trendPaddingX = 24;
  const trendPaddingY = 20;
  const trendGraphWidth = trendViewBoxWidth - trendPaddingX * 2;
  const trendGraphHeight = trendViewBoxHeight - trendPaddingY * 2;
  const safeTrend = congestionTrend.length ? congestionTrend : [0, 0];
  const congestionTrendPoints = safeTrend
    .map((value, index) => {
      const x =
        trendPaddingX +
        (index * trendGraphWidth) / Math.max(safeTrend.length - 1, 1);
      const y = trendPaddingY + (1 - value / 100) * trendGraphHeight;
      return `${x},${y}`;
    })
    .join(" ");
  const congestionTrendAreaPoints = `${trendPaddingX},${
    trendViewBoxHeight - trendPaddingY
  } ${congestionTrendPoints} ${trendViewBoxWidth - trendPaddingX},${
    trendViewBoxHeight - trendPaddingY
  }`;
  const congestionThresholdY =
    trendPaddingY + (1 - congestionThreshold / 100) * trendGraphHeight;
  const opsMetrics = [
    {
      key: "accidents",
      label: "Accidents",
      value: jobMetrics.accidents,
      barClass:
        "bg-gradient-to-t from-rose-500/80 via-orange-400/80 to-amber-300/80 dark:from-rose-500/70 dark:via-orange-400/70 dark:to-amber-300/70 shadow-rose-500/20",
    },
    {
      key: "congestion",
      label: "Congestion",
      value: jobMetrics.congestion,
      barClass:
        "bg-gradient-to-t from-cyan-500/80 via-blue-500/80 to-indigo-400/80 dark:from-cyan-500/70 dark:via-blue-500/70 dark:to-indigo-400/70 shadow-cyan-500/20",
    },
    {
      key: "alerts",
      label: "Alerts",
      value: jobMetrics.alerts,
      barClass:
        "bg-gradient-to-t from-fuchsia-500/70 via-purple-500/70 to-indigo-400/70 dark:from-fuchsia-500/60 dark:via-purple-500/60 dark:to-indigo-400/60 shadow-purple-500/20",
    },
  ];
  const maxOpsMetric = Math.max(...opsMetrics.map((metric) => metric.value), 1);
  const formatTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "--";
    return date.toLocaleString();
  };
  const statusBadgeClass = (jobStatus) => {
    if (jobStatus === "completed") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    if (jobStatus === "running") return "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200";
    if (jobStatus === "queued") return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
    return "bg-rose-500/15 text-rose-800 dark:text-rose-200";
  };

// Conditional rendering based on the status of the dashboard. If the status is "loading", it displays a loading message. If the status is "unauth", it prompts the user to log in to access the dashboard. If there is an error, it shows the error message and provides a retry button. If the user is authenticated, it checks their role and renders either a user-specific dashboard or an operator dashboard with various sections for live camera feed, video upload, model analysis, traffic flow graph, and traffic chart.
  if (status === "loading") {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-900 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

// If the user is not authenticated, display a message prompting them to log in, along with a link to the login page. The content is styled with a gradient background, borders, shadows, and responsive design to maintain a consistent look and feel with the rest of the application.
  if (status === "unauth") {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="max-w-3xl mx-auto">
          <div className={cardClasses}>
            <div className="pointer-events-none absolute -top-10 left-1/4 h-16 w-40 -rotate-12 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
            <div className="pointer-events-none absolute top-8 right-6 h-1 w-24 bg-white/60 blur-sm opacity-70 dark:bg-white/20"></div>
            <div className="relative z-10 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                Dashboard Access
              </h1>
              <p className="text-slate-900 dark:text-gray-300">
                Please log in to view the traffic operations dashboard.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-500/30"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
// If there is an error loading the dashboard, display the error message and provide a retry button. The content is styled with a gradient background, borders, shadows, and responsive design to maintain a consistent look and feel with the rest of the application.
  if (status === "error") {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="max-w-3xl mx-auto">
          <div className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                Dashboard Error
              </h1>
              <p className="text-red-700 dark:text-red-200">{error}</p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
// If the user is authenticated, check their role and render the appropriate dashboard. If the user's role is "user", render the UserDashboard component with the user's information. Otherwise, render the operator dashboard with various sections for live camera feed, video upload, model analysis, traffic flow graph, and traffic chart. The operator dashboard is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations.
  const role = user?.role || "user";
  if (role === "user") {
    return <UserDashboard user={user} />;
  }
// Render the operator dashboard with various sections for live camera feed, video upload, model analysis, traffic flow graph, and traffic chart. Each section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations.
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-800 dark:text-gray-400">
              Operations Center
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
              Traffic Operations Dashboard
            </h1>
            <p className="mt-2 text-slate-900 dark:text-gray-300">
              Monitor live intersections, analyze flow trends, and upload incident footage.
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-slate-900 hover:text-slate-900 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Back to Home
          </Link>
        </header>
        {operatorMessage ? (
          <div className="rounded-xl border border-cyan-200/60 dark:border-cyan-500/30 bg-cyan-50/70 dark:bg-cyan-500/10 px-4 py-3 text-sm text-cyan-900 dark:text-cyan-100">
            {operatorMessage}
          </div>
        ) : null}
{/* Grid layout for live preview, alerts, detection menus, controls, and camera setup. */}
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <section className={`${cardClasses} lg:col-span-8`}>
              <div className="pointer-events-none absolute -top-6 right-10 h-24 w-24 rounded-full bg-cyan-200/60 blur-3xl dark:bg-cyan-500/20"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Live Preview
                    </h2>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Real-time intersection feed with operator overlays.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <select
                      className="w-full sm:w-auto rounded-3xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                      value={liveSourceType}
                      onChange={(e) => setLiveSourceType(e.target.value)}
                    >
                      <option value="camera">Camera</option>
                      {/* Upload source removed from main preview to satisfy deployment requirements */}
                    </select>
                    <select
                      className="w-full sm:w-auto rounded-3xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                      value={liveSourceType === "camera" ? liveCameraId : selectedUploadId}
                      onChange={(e) =>
                        liveSourceType === "camera"
                          ? setLiveCameraId(e.target.value)
                          : setSelectedUploadId(e.target.value)
                      }
                    >
                      {liveSourceType === "camera" ? (
                        cameras.length ? (
                          cameras.map((camera) => (
                            <option
                              key={camera.id}
                              value={camera.id}
                              disabled={camera.status !== "Online"}
                            >
                              {camera.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No cameras deployed
                          </option>
                        )
                      ) : uploads.length ? (
                        uploads.map((upload) => (
                          <option key={upload.id} value={upload.id}>
                            {upload.originalName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No uploaded videos
                        </option>
                      )}
                    </select>

                    {/* Status indicator for the live camera feed. It shows a green dot and "Live" text when the selected camera is online, providing a clear visual cue about the feed's status. The indicator is styled with a gradient background, borders, and responsive design to maintain consistency with the overall dashboard aesthetics. */}
                    <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/60 dark:border-cyan-500/25 bg-white/50 dark:bg-black/30 px-3 py-1 text-xs text-slate-900 dark:text-gray-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"></span>
                      Live
                    </div>
                  </div>
                </div>
                {renderVideoPreview(
                  livePreviewUrl,
                  liveSourceType === "camera"
                    ? "Live camera stream preview"
                    : "Uploaded video preview",
                  "live"
                )}
              </div>
            </section>
{/* Two compact cards for congestion and accident alerts. Each card displays the alert type, severity level, a brief description, and a visual indicator of the current status. The cards are styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. The congestion alert includes a progress bar indicating corridor utilization, while the accident alert shows the last check time. */}
            <div className="grid gap-6 lg:col-span-4">
              <section className={compactCardClasses}>
                <div className="pointer-events-none absolute -top-8 left-6 h-16 w-40 -rotate-6 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Congestion Alert
                    </h3>
                    <span className="rounded-full bg-cyan-500/15 dark:bg-cyan-400/15 px-2 py-1 text-[11px] font-semibold text-cyan-900 dark:text-cyan-200">
                      {mappedLiveCongestionJob?.result?.congestionLevel || "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    {mappedLiveCongestionJob?.result
                      ? `${mappedLiveCongestionJob.result.vehicleCount || 0} vehicles detected (Threshold: ${congestionThreshold}).`
                      : "Run congestion model to generate live utilization."}
                  </p>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                      style={{ width: `${Math.max(0, Math.min(100, mappedLiveCongestionJob?.result?.index || 0))}%` }}
                    ></div>
                  </div>
                </div>
              </section>
              <section className={compactCardClasses}>
                <div className="pointer-events-none absolute -top-8 left-6 h-16 w-40 -rotate-6 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Accident Alert
                    </h3>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      alerts.filter(a => a.type === 'accident' && a.active).length > 0
                        ? "bg-rose-500/20 dark:bg-rose-400/20 text-rose-700 dark:text-rose-300 animate-pulse"
                        : "bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200"
                    }`}>
                      {alerts.filter(a => a.type === 'accident' && a.active).length > 0 ? "⚠ Emergency" : "Clear"}
                    </span>
                  </div>
                  
                  <div className="space-y-4 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    {alerts.filter(a => a.type === 'accident' && a.active).length > 0 ? (
                      alerts.filter(a => a.type === 'accident' && a.active).map((alert) => (
                        <div key={alert.id} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                               📍 {alert.latitude && alert.longitude ? `${Number(alert.latitude).toFixed(4)}°N, ${Number(alert.longitude).toFixed(4)}°E` : "Location Unknown"}
                            </p>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                              Emergency Dispatched
                            </span>
                          </div>
                          
                          <p className="text-[10px] font-medium text-rose-800 dark:text-rose-300 leading-tight">
                            {alert.message}
                          </p>

                          {alert.agencyETAs && (
                            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-rose-500/10">
                              <div className="text-center">
                                <p className="text-[8px] uppercase font-bold text-slate-500 dark:text-gray-400">Police</p>
                                <p className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">{alert.agencyETAs.police}m</p>
                              </div>
                              <div className="text-center border-x border-rose-500/10">
                                <p className="text-[8px] uppercase font-bold text-slate-500 dark:text-gray-400">Medic</p>
                                <p className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">{alert.agencyETAs.ambulance}m</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase font-bold text-slate-500 dark:text-gray-400">Fire</p>
                                <p className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">{alert.agencyETAs.fire}m</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-gray-300">
                        No active incidents detected.
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-800 dark:text-gray-400 border-t border-rose-500/10 pt-2">
                    <span>Last check</span>
                    <span>{mappedLiveAccidentJob?.result ? formatTime(mappedLiveAccidentJob.updatedAt) : "--"}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
          {/* Grid layout for congestion and accident CAM sections. Each section includes a header with a title, description, feed selection dropdown, and a button to run the respective model. Below the header, there is a video preview area styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. The congestion CAM section allows operators to select a feed and preview congestion detections, while the accident CAM section provides similar functionality for accident detections. Both sections are designed to provide operators with real-time insights into traffic conditions based on the selected camera feeds. */}
          <div className="grid gap-6 lg:grid-cols-12">
            <section className={`${cardClasses} lg:col-span-8`}>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Congestion CAM
                    </h2>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Select a feed and preview congestion detections.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <select
                      className="rounded-3xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                      value={congestionSourceType}
                      onChange={(e) => setCongestionSourceType(e.target.value)}
                    >
                      <option value="camera">Camera</option>
                      <option value="upload">Uploaded Video</option>
                    </select>
                    <select
                      className="rounded-3xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                      value={congestionSourceType === "camera" ? congestionCameraId : selectedUploadId}
                      onChange={(e) =>
                        congestionSourceType === "camera"
                          ? setCongestionCameraId(e.target.value)
                          : setSelectedUploadId(e.target.value)
                      }
                    >
                      {congestionSourceType === "camera" ? (
                        cameras.length ? (
                          cameras.map((camera) => (
                            <option
                              key={camera.id}
                              value={camera.id}
                              disabled={camera.status !== "Online"}
                            >
                              {camera.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No cameras deployed
                          </option>
                        )
                      ) : uploads.length ? (
                        uploads.map((upload) => (
                          <option
                            key={upload.id}
                            value={upload.id}
                          >
                            {upload.originalName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No uploaded videos
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
                      className="rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-indigo-600"
                    >
                      {isRunningCongestion ? "Running..." : "Run Congestion Model"}
                    </button>
                  </div>
                </div>
                {renderVideoPreview(
                  congestionPreviewUrl,
                  "Congestion stream preview",
                  "congestion"
                )}
              </div>
            </section>
{/* Congestion information card displaying vehicle count, congestion level, and average speed. Each piece of information is presented in a separate section with a label and a value placeholder. The card is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This section provides operators with a quick summary of the congestion status for the selected feed, allowing them to make informed decisions based on real-time data. */}
            <section className={`${cardClasses} lg:col-span-4`}>
              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Congestion Information
                  </h3>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Summary for the current feed selection.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Vehicle count</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activeCongestionResult?.vehicleCount ?? "--"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Congestion level</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activeCongestionResult?.congestionLevel ?? "--"}
                    </span>
                  </div>

                </div>
              </div>
            </section>
          </div>
{/* Similar layout for the accident CAM section, allowing operators to select a feed and preview accident detections. The card includes a header with a title, description, feed selection dropdown, and a button to run the accident model. Below the header, there is a video preview area styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This section provides operators with real-time insights into potential accidents based on the selected camera feeds, enabling them to respond quickly to incidents as they are detected. */} 
          <div className="grid gap-6 lg:grid-cols-12">
            <section className={`${cardClasses} lg:col-span-8`}>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Accident CAM
                    </h2>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Select a feed and preview accident detections.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <select
                      className="rounded-3xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                      value={accidentSourceType}
                      onChange={(e) => setAccidentSourceType(e.target.value)}
                    >
                      <option value="camera">Camera</option>
                      <option value="upload">Uploaded Video</option>
                    </select>
                    <select
                      className="rounded-3xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                      value={accidentSourceType === "camera" ? accidentCameraId : selectedUploadId}
                      onChange={(e) =>
                        accidentSourceType === "camera"
                          ? setAccidentCameraId(e.target.value)
                          : setSelectedUploadId(e.target.value)
                      }
                    >
                      {accidentSourceType === "camera" ? (
                        cameras.length ? (
                          cameras.map((camera) => (
                            <option
                              key={camera.id}
                              value={camera.id}
                              disabled={camera.status !== "Online"}
                            >
                              {camera.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No cameras deployed
                          </option>
                        )
                      ) : uploads.length ? (
                        uploads.map((upload) => (
                          <option
                            key={upload.id}
                            value={upload.id}
                          >
                            {upload.originalName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No uploaded videos
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
                      className="rounded-full px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-orange-600"
                    >
                      {isRunningAccident ? "Running..." : "Run Accident Model"}
                    </button>
                  </div>
                </div>
                {renderVideoPreview(
                  accidentPreviewUrl,
                  "Accident stream preview",
                  "accident"
                )}
              </div>
            </section>
            <section className={`${cardClasses} lg:col-span-4 flex flex-col`}>
              <div className="relative z-10 flex-1 flex flex-col space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Accident Information
                  </h3>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Summary for the current feed selection.
                  </p>
                </div>
                
                <div className="grid gap-3">
                  {mappedAccidentJob && mappedAccidentJob.sourceId !== accidentTargetId && mappedAccidentJob.fileId !== accidentTargetId && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
                      ⚠️ Showing latest result — no run yet for selected source.
                    </div>
                  )}
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Incidents detected</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activeAccidentResult?.incidentsDetected ?? "--"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Confidence</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {Number.isFinite(Number(activeAccidentResult?.confidence))
                        ? `${Math.round(Number(activeAccidentResult.confidence) * 100)}%`
                        : "--"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Response ETA</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activeAccidentResult?.responseEta || "3.5 mins"}
                    </span>
                  </div>
                </div>


              </div>
            </section>
          </div>
{/* Congestion trends section displaying a live congestion index trend across deployed corridors. The section includes a header with a title, description, and indicators for the window size and congestion threshold. Below the header, there is an SVG graph that visualizes the congestion trend over time, with a gradient line representing the congestion levels and a dashed line indicating the congestion threshold. Additionally, there are three summary cards below the graph showing the current congestion level, peak congestion level, and average congestion level. The entire section is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This section provides operators with insights into congestion patterns and helps them monitor traffic conditions effectively. */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Congestion Trends
                  </h2>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Live congestion index trend across deployed corridors.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/60 dark:border-white/10 bg-white/50 dark:bg-black/30 px-3 py-1 text-xs text-slate-900 dark:text-gray-200">
                    Window: 60m
                  </span>
                  <span className="rounded-full border border-white/60 dark:border-white/10 bg-white/50 dark:bg-black/30 px-3 py-1 text-xs text-slate-900 dark:text-gray-200">
                    Threshold: {congestionThreshold} Vehicles
                  </span>
                </div>
              </div>
{/* SVG graph visualizing the congestion trend over time, with a gradient line representing the congestion levels and a dashed line indicating the congestion threshold. The graph includes horizontal grid lines for better readability and is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This visualization allows operators to quickly assess congestion patterns and identify trends in traffic conditions across the monitored corridors. */}
              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-2" style={{ height: '320px' }}>
                {!trendHasRealData ? (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 backdrop-blur-md shadow-xl">
                      📊 Waiting for congestion data history...
                    </div>
                  </div>
                ) : null}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={
                      safeTrend.length < 10 
                        ? [...Array(10 - safeTrend.length).fill(0), ...safeTrend].map((v, i) => ({ time: i, value: v }))
                        : safeTrend.map((v, i) => ({ time: i, value: v }))
                    }
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis hide dataKey="time" />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: chartColors.text, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-white/20 bg-black/80 p-2 shadow-xl backdrop-blur-md">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Index</p>
                              <p className="text-lg font-bold text-white">{payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      y={congestionThreshold} 
                      stroke="#f59e0b" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: "Limit", 
                        fill: "#f59e0b", 
                        fontSize: 10, 
                        position: 'insideTopRight',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#22d3ee" 
                      fillOpacity={1} 
                      fill="url(#colorCongestion)" 
                      strokeWidth={4}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/20 p-4 transition-all hover:bg-white/80 dark:hover:bg-black/40">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-gray-400">
                      Current
                    </p>
                    <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {safeTrend[safeTrend.length - 1] ?? 0}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/20 p-4 transition-all hover:bg-white/80 dark:hover:bg-black/40">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-gray-400">
                    Peak
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {safeTrend.length ? Math.max(...safeTrend) : 0}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/20 p-4 transition-all hover:bg-white/80 dark:hover:bg-black/40">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-gray-400">
                    Average
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {safeTrend.length ? Math.round(
                      safeTrend.reduce((sum, value) => sum + value, 0) /
                        safeTrend.length
                    ) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </section>
{/* Operational chart section displaying live counts for accidents, congestion events, and system alerts. The section includes a header with a title and description, followed by a card that contains a grid of metrics. Each metric is represented by a vertical bar whose height corresponds to its value relative to the maximum metric value, along with a label and the current count. The bars are styled with different gradient colors to visually differentiate between the types of metrics. The entire section is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This section provides operators with real-time insights into key operational metrics, allowing them to quickly assess the current traffic conditions and respond accordingly. */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Operational Chart
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Live counts for accidents, congestion events, and system alerts.
                </p>
              </div>

              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-2" style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opsMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: chartColors.text, fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: chartColors.text, fontSize: 10 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        border: 'none', 
                        borderRadius: '8px', 
                        color: chartColors.tooltipText, 
                        fontSize: '12px' 
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        style={{ fill: chartColors.text, fontSize: '12px', fontWeight: 'bold' }} 
                      />
                      {opsMetrics.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.key === 'accidents' ? '#f43f5e' : 
                            entry.key === 'congestion' ? '#f59e0b' : '#3b82f6'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                {opsMetrics.map((metric) => (
                  <div key={metric.key} className="flex flex-col items-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-800 dark:text-gray-400">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Inference Jobs
                  </h2>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Live job status with automatic polling every 5 seconds.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      loadOperatorData().catch((err) =>
                        setOperatorMessage(err.message || "Unable to refresh jobs.")
                      );
                    }}
                    className="rounded-full px-4 py-2 border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 text-slate-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-black/40"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={clearAllJobs}
                    className="rounded-full px-4 py-2 border border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100 dark:border-rose-400/20 hover:bg-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-800 dark:text-gray-300 border-b border-white/40 dark:border-cyan-500/20">
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Progress</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                      <th className="px-4 py-3 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobHistory.length ? (
                      jobHistory.slice(0, 12).map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-white/30 dark:border-cyan-500/10 text-slate-900 dark:text-gray-200"
                        >
                          <td className="px-4 py-3 capitalize">{job.type}</td>
                          <td className="px-4 py-3">
                            <div className="max-w-[250px] truncate" title={job.sourceLabel || job.source}>
                              {job.sourceLabel || "--"}
                            </div>
                            <div className="text-xs text-slate-700 dark:text-gray-400 uppercase">
                              {job.sourceType}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadgeClass(job.status)}`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-32 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                                    style={{ 
                                      width: `${Math.max(0, Math.min(100, Number(job.progress || 0)))}%` 
                                    }}
                                  ></div>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-gray-400 mt-1">
                              {Math.max(0, Math.min(100, Number(job.progress || 0)))}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">{formatTime(job.createdAt)}</td>
                          <td className="px-4 py-3 text-xs">{formatTime(job.updatedAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-700 dark:text-gray-400"
                        >
                          No inference jobs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

{/* Controls for toggling overlays and adjusting congestion detection thresholds. Includes a custom-styled toggle switch and a range slider with a gradient track. The section is styled with a gradient background, borders, shadows, and responsive design to provide an intuitive interface for operators to fine-tune their monitoring preferences. */}
        <section className={cardClasses}>
          <div className="relative z-10 space-y-6">

            {/* CONTROLS HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Overlay & Threshold Controls
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Tune overlays and AI sensitivity for congestion detection.
                </p>
              </div>

              {/* OVERLAY TOGGLE */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={overlayEnabled}
                    onChange={(e) => setOverlayEnabled(e.target.checked)}
                    className="sr-only peer"
                  />

                  {/* Track */}
                  <div className="
                    w-14 h-7 rounded-full 
                    bg-slate-300 dark:bg-slate-700
                    peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-indigo-500
                    peer-checked:shadow-[0_0_10px_rgba(34,211,238,0.7)]
                    transition-all duration-300
                  "></div>

                  {/* Thumb */}
                  <div className="
                    absolute top-1 left-1 
                    w-5 h-5 rounded-full bg-white 
                    shadow-md transition-all duration-300
                    peer-checked:translate-x-7
                    flex items-center justify-center
                  ">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 opacity-0 peer-checked:opacity-100 transition"></div>
                  </div>
                </div>

                <span className="text-sm font-medium text-slate-900 dark:text-gray-200">
                  Show Overlay
                </span>
              </label>
            </div>

            {/* CONGESTION THRESHOLD SLIDER */}
            <div className="rounded-2xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-white/60 via-slate-50/40 to-indigo-100/60 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-indigo-950/60 p-6 shadow-inner backdrop-blur-xl">

              {/* THRESHOLD LABEL */}
              <div className="flex justify-between text-sm text-slate-900 dark:text-gray-200 mb-3">
                <span>Congestion Threshold</span>
                <span className="font-semibold text-cyan-500">
                  {congestionThreshold} Vehicles
                </span>
              </div>

              {/* CUSTOM RANGE INPUT WITH GRADIENT TRACK */}
              <div className="relative w-full">

                {/* Background Track */}
                <div className="w-full h-2 rounded-full bg-slate-300 dark:bg-slate-800"></div>

                {/* Gradient Fill */}
                <div
                  className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${(congestionThreshold / 30) * 100}%` }}
                ></div>

                {/* Invisible Range Input */}
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={congestionThreshold}
                  onChange={(e) => onThresholdChange(Number(e.target.value))}
                  className="absolute top-0 w-full h-2 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-cyan-400
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.8)]
                  [&::-webkit-slider-thumb]:transition"
                />
              </div>

              {/* THRESHOLD LABELS */}
              <div className="flex justify-between text-xs mt-2 text-slate-800 dark:text-gray-400">
                <span>Strict (0)</span>
                <span>Moderate (15)</span>
                <span>Lenient (30+)</span>
              </div>

              {/* THRESHOLD DESCRIPTION */}
              <p className="mt-4 text-xs text-slate-800 dark:text-gray-400">
                Lower values trigger alerts faster. Higher values reduce sensitivity and false positives.
              </p>

              {/* THRESHOLD STATUS BADGE */}
              <div className="mt-4">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full
                  ${
                    congestionThreshold < 30
                      ? "bg-red-500/10 text-red-500"
                      : congestionThreshold < 70
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-green-500/10 text-green-500"
                  }`}
                >
                  {congestionThreshold < 10
                    ? "High Sensitivity"
                    : congestionThreshold < 20
                    ? "Balanced"
                    : "Low Sensitivity"}
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* CAMERA SETUP AND VIDEO UPLOAD SECTION */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Camera Setting
                    </h2>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Configure feed details and upload incident footage.
                    </p>
                  </div>
                  {/* Input fields for camera label and stream URL. The inputs are styled with rounded borders, gradient backgrounds, and responsive design to maintain consistency with the overall dashboard aesthetics. As the user types in either field, the deploy button's state is updated to allow deployment once both fields have valid input. This section provides operators with an intuitive interface to set up new camera feeds by entering a descriptive label and the corresponding stream URL. */}
                  <div className="grid gap-3">
                    <input
                      className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-4 py-3 text-sm text-slate-900 dark:text-gray-200 placeholder:text-slate-500 dark:placeholder:text-gray-500"
                      placeholder="Camera label (e.g., Clock Tower)"
                      value={cameraLabel}
                      onChange={(e) => setCameraLabel(e.target.value)}
                    />
                    <input
                      className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-4 py-3 text-sm text-slate-900 dark:text-gray-200 placeholder:text-slate-500 dark:placeholder:text-gray-500"
                      placeholder="Stream URL (RTSP / HLS)"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                    />
                    <div className="flex items-center justify-between px-1">
                      <div className="text-[11px] text-slate-700 dark:text-gray-400">
                        {mapDraftCoords && mapTargetType === 'new_camera' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">📍 {mapDraftCoords[0].toFixed(4)}, {mapDraftCoords[1].toFixed(4)}</span>
                        ) : "Location not pinned yet"}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMapTargetType("new_camera");
                          document.getElementById("camera-location-map")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        📍 Set Location on Map
                      </button>
                    </div>
                  </div>
{/* Video preview area for the camera feed, styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This area is intended to display the live video stream from the configured camera feed once deployed. The placeholder text indicates that the video should load here, providing operators with a visual confirmation of the camera setup and allowing them to verify that the feed is working correctly. */}
                  {renderVideoPreview(settingPreviewUrl, "Video preview for map target", "setting")}

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Incident video upload
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setUploadFile(file);
                      }}
                      className="block w-full text-sm text-blue-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800 dark:text-cyan-200 dark:file:bg-cyan-600 dark:hover:file:bg-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={uploadVideo}
                      disabled={isUploadingVideo || !uploadFile}
                      className="w-full rounded-full px-4 py-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUploadingVideo ? "Uploading..." : "Upload Video"}
                    </button>
                    {/* Uploaded videos list with inline location pinning */}
                    {uploads.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-700 dark:text-gray-400 font-medium">Uploaded videos — click 📍 Pin to set location on map</p>
                        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                          {uploads.map((upload) => {
                            const hasCoords = Number.isFinite(Number(upload.latitude)) && Number.isFinite(Number(upload.longitude));
                            const isSelected = selectedUploadId === upload.id;
                            return (
                              <div
                                key={upload.id}
                                onClick={() => setSelectedUploadId(upload.id)}
                                className={`rounded-xl border p-3 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-cyan-400/60 bg-cyan-500/10 dark:bg-cyan-900/20"
                                    : "border-white/60 dark:border-cyan-500/20 bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/30"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{upload.originalName}</p>
                                    <p className={`text-[11px] mt-0.5 ${hasCoords ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-gray-500"}`}>
                                      {hasCoords
                                        ? `📍 ${Number(upload.latitude).toFixed(4)}°N, ${Number(upload.longitude).toFixed(4)}°E`
                                        : "📍 No location set"}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1 shrink-0">
                                    <button
                                      type="button"
                                      title="Pin location on map"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUploadId(upload.id);
                                        setMapTargetType("upload");
                                        setMapCameraId("");
                                        document.getElementById("camera-location-map")?.scrollIntoView({ behavior: "smooth" });
                                      }}
                                      className="rounded-full px-2 py-1 text-[11px] font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/25"
                                    >
                                      📍 Pin
                                    </button>
                                    <button
                                      type="button"
                                      title="Delete video"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteUpload(upload);
                                      }}
                                      className="rounded-full px-2 py-1 text-[11px] font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 hover:bg-rose-500/25"
                                    >
                                      🗑 Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-gray-500">No uploaded videos yet.</p>
                    )}
                    <p className="text-xs text-slate-700 dark:text-gray-400">
                      Or use bundled model sample videos:
                    </p>
                    <select
                      className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-4 py-3 text-sm text-slate-900 dark:text-gray-200"
                      value={selectedSampleId}
                      onClick={() => setMapTargetType("sample")}
                      onChange={(e) => {
                        setSelectedSampleId(e.target.value);
                        setMapTargetType("sample");
                      }}
                    >
                      {sampleVideos.length ? (
                        sampleVideos.map((sample) => (
                          <option key={sample.id} value={sample.id}>
                            {sample.modelType.toUpperCase()} - {sample.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No sample videos found</option>
                      )}
                    </select>
                    {!sampleVideos.length && sampleScanInfo.length ? (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200">
                        Sample scan paths: {sampleScanInfo.join(" | ")}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={deployAsCamera}
                      disabled={!selectedSampleId}
                      className="w-full rounded-full px-4 py-2 border border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 hover:bg-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Import Sample As Camera
                    </button>
                    <button
                      type="button"
                      disabled={isDeploying}
                      onClick={createCamera}
                      className="w-full rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isDeploying ? "Deploying..." : "Deploy to City"}
                    </button>
                  </div>
{/* List of deployed cameras with options to edit or delete each camera. Each camera entry displays the camera name, stream type, status, and last ping time. The edit button allows operators to modify the camera details, while the delete button prompts for confirmation before removing the camera from the list. The section is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This section provides operators with an overview of all deployed cameras and easy access to manage their configurations as needed. */}
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Cameras Deployed
                      </p>
                      <span className="rounded-full bg-slate-900/5 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-900 dark:text-gray-200">
                        {cameras.length}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3">
                      {cameras.map((camera) => (
                        <div
                          key={camera.id}
                          className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/50 dark:bg-black/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {camera.name}
                              </p>
                              <p className="text-xs text-slate-800 dark:text-gray-400">
                                Stream: {camera.stream}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span
                                className={[
                                  "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold",
                                  camera.status === "Online"
                                    ? "bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200"
                                    : camera.status === "Offline"
                                      ? "bg-rose-500/15 text-rose-900 dark:bg-rose-400/15 dark:text-rose-200"
                                      : "bg-amber-500/15 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
                                ].join(" ")}
                              >
                                {camera.status}
                              </span>
                              <button
                                type="button"
                                className="rounded-full px-3 py-1 text-[11px] font-semibold border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 text-slate-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-black/40"
                                onClick={() => {
                                  if (editingCameraId === camera.id) {
                                    setEditingCameraId(null);
                                    return;
                                  }
                                  setEditingCameraId(camera.id);
                                  setEditName(camera.name);
                                  setEditStream(camera.stream);
                                  setEditStatus(camera.status);
                                  setEditLat(camera.latitude ?? "");
                                  setEditLng(camera.longitude ?? "");
                                }}
                              >
                                {editingCameraId === camera.id ? "Cancel" : "Edit"}
                              </button>
                              <button
                                type="button"
                                className="rounded-full px-3 py-1 text-[11px] font-semibold border border-white/60 dark:border-rose-500/25 bg-white/60 dark:bg-black/30 text-rose-700 dark:text-rose-200 hover:bg-rose-50/80 dark:hover:bg-rose-500/10"
                                onClick={() => deleteCamera(camera)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-800 dark:text-gray-400">
                            <span>Last ping</span>
                            <span>{camera.lastPing}</span>
                          </div>
{/* If the camera is in edit mode, display input fields for editing the camera name, stream type, and status, along with save and cancel buttons. The inputs are styled with rounded borders, gradient backgrounds, and responsive design to maintain consistency with the overall dashboard aesthetics. This allows operators to easily update the camera details as needed, ensuring that the information displayed on the dashboard remains accurate and up-to-date. */}
                          {editingCameraId === camera.id ? (
                            <div className="mt-3 grid gap-2">
                              <input
                                className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200 placeholder:text-slate-500 dark:placeholder:text-gray-500"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Camera name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                                  value={editStream}
                                  onChange={(e) => setEditStream(e.target.value)}
                                >
                                  <option value="HLS">HLS</option>
                                  <option value="RTSP">RTSP</option>
                                  <option value="Custom">Custom</option>
                                </select>
                                <select
                                  className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                >
                                  <option value="Online">Online</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Offline">Offline</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200 placeholder:text-gray-500"
                                  value={editLat}
                                  onChange={(e) => setEditLat(e.target.value)}
                                  placeholder="Latitude"
                                  type="number"
                                  step="any"
                                />
                                <input
                                  className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200 placeholder:text-gray-500"
                                  value={editLng}
                                  onChange={(e) => setEditLng(e.target.value)}
                                  placeholder="Longitude"
                                  type="number"
                                  step="any"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMapTargetType("camera");
                                    setMapCameraId(camera.id);
                                    document.getElementById("camera-location-map")?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="flex-1 rounded-full px-4 py-2 text-[11px] font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/25"
                                >
                                  📍 Pin on Map
                                </button>
                                <button
                                  type="button"
                                  className="flex-1 rounded-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 font-semibold text-xs"
                                  onClick={() => updateCamera(camera)}
                                >
                                  Save Updates
                                </button>
                                <button
                                  type="button"
                                  className="flex-1 rounded-full px-4 py-2 border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 text-slate-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-black/40 font-semibold text-xs"
                                  onClick={() => setEditingCameraId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Camera location map section for setting or verifying camera coordinates. The section includes a header with a title and description, followed by a placeholder area styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This area is intended to display an interactive map where operators can set the coordinates of the camera feed, allowing for accurate placement and monitoring of the camera's location within the traffic management system. */}
                <div id="camera-location-map" className="lg:col-span-8 flex flex-col gap-4 lg:border-l lg:border-white/50 dark:lg:border-cyan-500/20 lg:pl-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Camera Location Map
                    </h2>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Set or verify coordinates for selected camera/uploaded video.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <select
                        className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                        value={mapTargetType}
                        onChange={(e) => {
                          setMapTargetType(e.target.value);
                          setShouldMapFly(true);
                        }}
                      >
                        <option value="camera">Camera</option>
                        <option value="upload">Uploaded Video</option>
                        <option value="new_camera">New Camera Deployment</option>
                      </select>
                      {mapTargetType !== "new_camera" && (
                        <select
                          className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-2 text-sm text-slate-900 dark:text-gray-200"
                          value={mapTargetType === "camera" ? mapCameraId : selectedUploadId}
                          onChange={(e) =>
                            mapTargetType === "camera"
                              ? setMapCameraId(e.target.value)
                              : setSelectedUploadId(e.target.value)
                          }
                        >
                          {mapTargetType === "camera" ? (
                            cameras.length ? (
                              cameras.map((camera) => (
                                <option key={camera.id} value={camera.id}>
                                  {camera.name}
                                </option>
                              ))
                            ) : (
                              <option value="">No cameras</option>
                            )
                          ) : uploads.length ? (
                            uploads.map((upload) => (
                              <option key={upload.id} value={upload.id}>
                                {upload.originalName}
                              </option>
                            ))
                          ) : (
                            <option value="">No uploads</option>
                          )}
                        </select>
                      )}
                    </div>
                  </div>
                  {/* Map section with expand toggle */}
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-3">
                    {/* Expand / collapse header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-700 dark:text-gray-400">Click anywhere on map to place marker</span>
                      <button
                        type="button"
                        onClick={() => setMapExpanded((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 text-slate-900 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-black/40 transition-all"
                      >
                        {mapExpanded ? (
                          <><span>⛶</span> Collapse</>
                        ) : (
                          <><span>⛶</span> Expand map</>
                        )}
                      </button>
                    </div>

                    {/* Fullscreen overlay when expanded */}
                    {mapExpanded && (
                      <div className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-sm">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-cyan-500/20">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white">📍 Camera Location Map — Dehradun, India</span>
                            {mapDraftCoords && (
                              <span className="text-xs text-cyan-300">{mapDraftCoords[0].toFixed(4)}°N, {mapDraftCoords[1].toFixed(4)}°E</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={saveCameraCoordinates}
                              disabled={!selectedMapTarget || !mapDraftCoords}
                              className="rounded-full px-4 py-1.5 text-xs bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save Coordinates
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapExpanded(false)}
                              className="rounded-full px-3 py-1.5 text-xs border border-white/20 bg-white/10 text-white hover:bg-white/20"
                            >
                              ✕ Close
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <MapContainer
                            key="dehradun-map-fullscreen"
                            center={[30.3165, 78.0322]}
                            zoom={14}
                            scrollWheelZoom
                            className="w-full h-full"
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapClickPicker onPick={setMapDraftCoords} />
                            {mapDraftCoords ? <Marker position={mapDraftCoords} /> : null}
                          </MapContainer>
                        </div>
                      </div>
                    )}

                    {/* Inline coord input */}
                    <div className="mt-2 mb-2 flex items-center gap-2">
                      <span className="text-xs text-slate-700 dark:text-gray-400 shrink-0">Jump to:</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        className="flex-1 rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-1.5 text-xs text-slate-900 dark:text-gray-200 placeholder:text-gray-500"
                        value={mapDraftCoords ? mapDraftCoords[0].toFixed(6) : ""}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (Number.isFinite(lat) && mapDraftCoords) {
                            setMapDraftCoords([lat, mapDraftCoords[1]]);
                          }
                        }}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        className="flex-1 rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-3 py-1.5 text-xs text-slate-900 dark:text-gray-200 placeholder:text-gray-500"
                        value={mapDraftCoords ? mapDraftCoords[1].toFixed(6) : ""}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value);
                          if (Number.isFinite(lng) && mapDraftCoords) {
                            setMapDraftCoords([mapDraftCoords[0], lng]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setMapDraftCoords(mapDraftCoords ? [...mapDraftCoords] : DEHRADUN)}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/20"
                      >
                        Go
                      </button>
                    </div>
                    {/* Inline map */}
                    <div className="h-[500px] rounded-lg overflow-hidden">
                      <MapContainer
                        key="itms-operational-map"
                        center={DEHRADUN}
                        zoom={15}
                        scrollWheelZoom
                        className="w-full h-full"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickPicker onPick={setMapDraftCoords} />
                        <MapFlyTo coords={mapDraftCoords} active={shouldMapFly} />
                        {mapDraftCoords ? <Marker position={mapDraftCoords} /> : null}
                      </MapContainer>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-800 dark:text-gray-300">
                        <div>
                          Target:{" "}
                          <span className="font-semibold">
                            {selectedMapTarget?.name ||
                              selectedMapTarget?.originalName ||
                              "No source selected"}
                          </span>
                        </div>
                        <div>
                          Coordinates:{" "}
                          <span className="font-semibold">
                            {mapDraftCoords ? `${mapDraftCoords[0].toFixed(4)}°N, ${mapDraftCoords[1].toFixed(4)}°E` : "--"}
                          </span>
                        </div>
                        <div className="text-slate-700 dark:text-gray-400">
                          Click on map to place marker, then save.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={saveCameraCoordinates}
                        disabled={mapTargetType !== "new_camera" && (!selectedMapTarget || !mapDraftCoords)}
                        className="rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Save Coordinates
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
