import React, { useEffect, useState, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, MapPin, Compass, ShieldAlert } from "lucide-react";
import { themes } from "../../../design-system/tokens";

// Centering Helper Component
function MapAutoCenter({ center, triggerFly }) {
  const map = useMap();
  const prevCoordsRef = useRef("");

  useEffect(() => {
    if (map) {
      map.invalidateSize();
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [map]);

  useEffect(() => {
    if (!center || !map) return;
    map.invalidateSize();
    const coordStr = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;
    if (prevCoordsRef.current === coordStr) return;
    prevCoordsRef.current = coordStr;
    map.flyTo(center, 14, { animate: true, duration: 1.2 });
  }, [center, map, triggerFly]);

  return null;
}

// Map Click Location Picker
function MapClickPicker({ onPick, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !enabled) return;
    const onClick = (e) => {
      const { lat, lng } = e.latlng;
      onPick([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    };
    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, [map, onPick, enabled]);
  return null;
}

export default function TrafficMap({
  isDarkMode,
  cameras,
  uploads,
  mapDraftCoords,
  setMapDraftCoords,
  mapTargetType,
  setMapTargetType,
  selectedMapTarget,
  saveCameraCoordinates,
  deployAsCamera,
  isDeploying,
  operatorMessage,
}) {
  const t = themes.getThemeClasses(isDarkMode);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [browserCoords, setBrowserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("detecting"); // detecting | ready | unavailable

  const defaultCenter = [30.3165, 78.0322];

  // Map Tile Layers
  const tileLayerUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  // 1. Operator Geolocation Centering Hook
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setBrowserCoords(coords);
        setGeoStatus("ready");
        // Center draft on current location if there are no existing selections
        if (mapTargetType === "new_camera") {
          setMapDraftCoords(coords);
        }
      },
      () => {
        setGeoStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [mapTargetType, setMapDraftCoords]);

  // Centering heuristic: Geolocation -> First active Camera -> Fallback defaultCenter
  const mapCenter = browserCoords || (cameras?.length && cameras[0].latitude ? [cameras[0].latitude, cameras[0].longitude] : defaultCenter);

  // Markers
  const activeMarkers = [
    ...(cameras || []).map((c) => ({
      id: `cam-${c.id}`,
      type: "camera",
      coords: c.latitude && c.longitude ? [c.latitude, c.longitude] : null,
      label: c.name,
      status: c.status,
      stream: c.stream,
    })),
    ...(uploads || [])
      .filter((u) => u.latitude && u.longitude)
      .map((u) => ({
        id: `upload-${u.id}`,
        type: "upload",
        coords: [u.latitude, u.longitude],
        label: u.originalName,
        status: "Online",
        stream: "Video upload",
      })),
  ].filter((m) => m.coords && m.coords[0] !== 0);

  return (
    <div
      id="camera-location-map"
      className={`transition-all duration-300 relative rounded-2xl overflow-hidden border ${t.border} bg-slate-100 dark:bg-slate-950/40 flex flex-col ${
        mapExpanded ? "fixed inset-4 z-[99] shadow-2xl h-[calc(100vh-2rem)]" : "h-[320px] sm:h-[500px]"
      }`}
    >
      {/* Map floating control bar */}
      <div className="absolute top-4 left-4 z-[999] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setMapExpanded(!mapExpanded)}
          className="p-2.5 rounded-xl bg-slate-900/90 dark:bg-slate-900/95 text-white hover:bg-slate-800 border border-white/10 shadow-lg flex items-center justify-center transition-colors"
          title={mapExpanded ? "Minimize Map" : "Maximize Map"}
        >
          {mapExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {browserCoords && (
          <button
            type="button"
            onClick={() => setMapDraftCoords(browserCoords)}
            className="p-2.5 rounded-xl bg-slate-900/90 dark:bg-slate-900/95 text-white hover:bg-slate-800 border border-white/10 shadow-lg flex items-center justify-center transition-colors"
            title="Focus operator location"
          >
            <Compass size={16} className="animate-spin-hover" />
          </button>
        )}
      </div>

      {/* Dynamic Status Overlay */}
      <div className="absolute top-4 right-4 z-[999] bg-slate-900/95 dark:bg-slate-900/95 border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs shadow-lg space-y-1.5 pointer-events-auto max-w-[280px]">
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${geoStatus === "ready" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          <p className="font-semibold">
            {geoStatus === "ready" ? "Operator Geolocation Lock" : "Standard Map Overlay"}
          </p>
        </div>
        <p className="text-[10px] text-slate-300 leading-tight">
          Target: {selectedMapTarget?.name || selectedMapTarget?.originalName || "New Node Deployment"}
        </p>
      </div>

      {/* Map Leaflet Canvas */}
      <div className="flex-1 w-full h-full z-10">
        <MapContainer center={mapCenter} zoom={14} className="w-full h-full">
          <TileLayer attribution="&copy; CartoDB" url={tileLayerUrl} />
          
          <MapAutoCenter center={mapDraftCoords || mapCenter} />
          
          <MapClickPicker onPick={setMapDraftCoords} enabled={true} />

          {/* Draft marker (pin placement) */}
          {mapDraftCoords && (
            <Marker
              position={mapDraftCoords}
              icon={L.divIcon({
                className: "custom-draft-marker",
                html: `<div class="p-1 rounded-full bg-cyan-400 shadow-cyan-400/50 shadow-xl border-2 border-white w-4.5 h-4.5 animate-bounce"></div>`,
                iconSize: [22, 22],
              })}
            >
              <Popup>
                <div className="text-xs space-y-1 font-inter">
                  <p className="font-semibold text-slate-900">Deployment Target Position</p>
                  <p className="text-slate-500 font-mono text-[9px]">{mapDraftCoords[0].toFixed(5)}°N, {mapDraftCoords[1].toFixed(5)}°E</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active markers for camera and uploads */}
          {activeMarkers.map((marker) => {
            const isCam = marker.type === "camera";
            return (
              <Marker
                key={marker.id}
                position={marker.coords}
                icon={L.divIcon({
                  className: "custom-cam-marker",
                  html: `<div class="p-1 rounded-full ${
                    marker.status === "Online" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
                  } shadow-md border border-white w-3.5 h-3.5 hover:scale-125 transition-transform duration-200"></div>`,
                  iconSize: [16, 16],
                })}
              >
                <Popup>
                  <div className="text-xs space-y-1 font-inter">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${marker.status === "Online" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <p className="font-bold text-slate-900 leading-none">{marker.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-500">Stream: {marker.stream}</p>
                    <p className="text-[10px] text-slate-500">Type: {isCam ? "CCTV Monitor" : "Video upload"}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map bottom coordinate status bar */}
      <div className="bg-white/90 dark:bg-slate-900/95 border-t border-slate-200 dark:border-white/10 p-4 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-inner backdrop-blur-sm">
        <div className="text-xs text-slate-700 dark:text-gray-300">
          <p className="font-medium">
            Coordinates:{" "}
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              {mapDraftCoords ? `${mapDraftCoords[0].toFixed(5)}°N, ${mapDraftCoords[1].toFixed(5)}°E` : "Not Pinned"}
            </span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Click anywhere on the map to pin deployment node coordinates.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {mapTargetType === "upload" && (
            <button
              type="button"
              onClick={deployAsCamera}
              disabled={isDeploying}
              className="w-full sm:w-auto h-11 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isDeploying ? "Deploying..." : "Deploy Video stream as Camera"}
            </button>
          )}

          <button
            type="button"
            onClick={saveCameraCoordinates}
            disabled={!mapDraftCoords}
            className="w-full sm:w-auto h-11 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-cyan-500/15 flex items-center justify-center"
          >
            Save Pinned Coordinates
          </button>
        </div>
      </div>
    </div>
  );
}
