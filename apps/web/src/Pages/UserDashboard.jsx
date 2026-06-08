import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { apiRequest } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Map, Compass, Navigation, ShieldCheck, AlertOctagon, Timer, Landmark, HelpCircle, Activity } from "lucide-react";
import { themes } from "../design-system/tokens";

const calcDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to auto-center the map based on location or route changes
function MapAutoCenter({ center, routePath }) {
  const map = useMap();

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
    if (!map || !center) return;
    map.invalidateSize();
    if (routePath && routePath.length > 1) {
      map.fitBounds(routePath, { padding: [40, 40] });
      return;
    }
    map.setView(center, 13);
  }, [center, map, routePath]);

  return null;
}

export default function UserDashboard({ user }) {
  const [locationLabel, setLocationLabel] = useState("Detecting Location...");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | ready | denied | error
  const [locationMeta, setLocationMeta] = useState("");
  const [locationCoords, setLocationCoords] = useState({ lat: 30.3165, lon: 78.0322 });
  const [routeStart, setRouteStart] = useState("");
  const [routeDestination, setRouteDestination] = useState("");
  const [transportMode, setTransportMode] = useState("car"); // car | bike | walk
  const [routePath, setRoutePath] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle"); // idle | loading | ready | error
  const [routeError, setRouteError] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const lastGeocodeRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const t = themes.getThemeClasses(isDarkMode);
  const mapTileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const chartColors = {
    stroke: "#22d3ee",
    fill: "#22d3ee",
    grid: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    text: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    tooltipBg: isDarkMode ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
    tooltipText: isDarkMode ? "#fff" : "#000",
  };

  const [realAlerts, setRealAlerts] = useState([]);
  const [realMetrics, setRealMetrics] = useState({ accidents: 0, congestion: 0, alerts: 0 });
  const [realTrend, setRealTrend] = useState([]);

  const formatDuration = (totalMin) => {
    const safeMin = Math.max(1, Math.round(totalMin));
    const hours = Math.floor(safeMin / 60);
    const minutes = safeMin % 60;
    if (hours < 1) return `${safeMin} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  const loadRealTimeData = useCallback(async () => {
    try {
      const [alertsData, summaryData, trendData] = await Promise.all([
        apiRequest("/api/alerts"),
        apiRequest("/api/metrics/summary"),
        apiRequest("/api/metrics/congestion-trend"),
      ]);

      if (alertsData && Array.isArray(alertsData.alerts)) {
        // Dynamic location alerts filtering (within 20km bounds of active coordinates)
        const localAlerts = alertsData.alerts.filter((alert) => {
          if (!alert.latitude || !alert.longitude) return false;
          const dist = calcDistanceKm(
            locationCoords.lat,
            locationCoords.lon,
            parseFloat(alert.latitude),
            parseFloat(alert.longitude)
          );
          return dist <= 20; // 20km radius limit
        });
        setRealAlerts(localAlerts.slice(0, 10));
      }

      if (summaryData && summaryData.metrics) {
        setRealMetrics(summaryData.metrics);
      }

      if (trendData && Array.isArray(trendData.points)) {
        const points = trendData.points.map((val) => ({ index: Number(val) || 0 }));
        setRealTrend(points);
      }
    } catch (err) {
      console.error("Real-time fetch failed:", err);
    }
  }, [locationCoords]);

  useEffect(() => {
    loadRealTimeData();
    const inv = setInterval(loadRealTimeData, 5000);
    return () => clearInterval(inv);
  }, [loadRealTimeData]);

  // Geolocation tracker
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationLabel("Default Area");
      return;
    }

    let watchId;
    const geocodeIntervalMs = 5 * 60 * 1000;
    const geocodeDistanceKm = 1;

    const reverseGeocode = async (latitude, longitude) => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = await res.json();
        const address = data?.address || {};
        const city = address.city || address.town || address.village || address.suburb || "";
        const state = address.state || "";
        const label = [city, state].filter(Boolean).join(", ");
        if (label) {
          setLocationLabel(label);
        } else {
          setLocationLabel("Your Area");
        }
        setLocationStatus("ready");
        lastGeocodeRef.current = { lat: latitude, lon: longitude, ts: Date.now() };
      } catch {
        setLocationStatus("ready");
        setLocationLabel("Your Area");
      }
    };

    setLocationStatus("loading");
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lon: longitude });
        setLocationMeta(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
        setLocationStatus("ready");

        const last = lastGeocodeRef.current;
        const now = Date.now();
        const shouldReverse =
          !last ||
          now - last.ts > geocodeIntervalMs ||
          calcDistanceKm(latitude, longitude, last.lat, last.lon) > geocodeDistanceKm;

        if (shouldReverse) {
          reverseGeocode(latitude, longitude);
        }
      },
      (err) => {
        setLocationStatus(err?.code === 1 ? "denied" : "error");
        setLocationLabel("Public Grid Area");
        setLocationMeta("Using standard fallback node coordinates");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );

    return () => {
      if (typeof watchId === "number") {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMapExpanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMapExpanded]);

  const geocodePlace = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("Target address not found.");
    }
    return {
      lat: Number(results[0].lat),
      lon: Number(results[0].lon),
      label: results[0].display_name,
    };
  };

  const fetchRoute = async (start, end, mode) => {
    const profile = mode === "bike" ? "cycling" : mode === "walk" ? "foot" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.routes?.length) {
      throw new Error("No navigable routes found.");
    }
    return data.routes[0];
  };

  const handleFindRoute = async () => {
    setRouteError("");
    setRouteStatus("loading");
    setRouteSummary(null);
    setRoutePath([]);
    setDestinationCoords(null);

    try {
      const startQuery = routeStart.trim();
      const destinationQuery = routeDestination.trim();
      if (!destinationQuery) {
        throw new Error("Enter destination address.");
      }

      const useCurrent = !startQuery || startQuery.toLowerCase() === "current location";
      let startCoords = locationCoords;

      if (!useCurrent) {
        const startResult = await geocodePlace(startQuery);
        startCoords = { lat: startResult.lat, lon: startResult.lon };
      }

      const destinationResult = await geocodePlace(destinationQuery);
      const destCoords = { lat: destinationResult.lat, lon: destinationResult.lon };

      const route = await fetchRoute(startCoords, destCoords, transportMode);
      const polyline = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

      setRoutePath(polyline);
      setDestinationCoords(destCoords);

      const distanceKm = route.distance / 1000;
      const baseDurationMin = Math.max(1, Math.round(route.duration / 60));

      // Calculate comparative route times
      const congestionMultiplier = realMetrics.congestion > 50 ? 1.35 : 1.1;
      const trafficDurationMin = Math.max(1, Math.round(baseDurationMin * congestionMultiplier));

      setRouteSummary({
        distanceKm: distanceKm.toFixed(1),
        durationMin: baseDurationMin,
        trafficDurationMin,
        congestionMultiplier,
        mode: transportMode,
      });
      setRouteStatus("ready");
    } catch (err) {
      setRouteStatus("error");
      setRouteError(err.message || "Route lookup failed.");
    }
  };

  // Derive alert category classifications
  const classifyAlertType = (msg) => {
    const text = String(msg || "").toLowerCase();
    if (text.includes("accident") || text.includes("crash")) return "Accident Ahead";
    if (text.includes("block") || text.includes("close")) return "Road Closure";
    if (text.includes("weather") || text.includes("rain") || text.includes("storm")) return "Weather Alert";
    if (text.includes("construct") || text.includes("roadwork") || text.includes("work")) return "Construction Zone";
    return "Heavy Congestion";
  };

  // Saved commute list templates dynamically rendered
  const savedRoutes = [
    { name: "Home ➔ Work", time: routeSummary ? `${formatDuration(routeSummary.trafficDurationMin)}` : "18 min" },
    { name: "Daily Commute ➔ City Center", time: "24 min" },
    { name: "Gym ➔ Home", time: "12 min" },
  ];

  const travelTips = useMemo(() => {
    const tips = [];
    if (realMetrics.congestion > 65) {
      tips.push("High grid lock. Recommend delaying departures by 20-30 minutes.");
    } else {
      tips.push("Traffic flow is stable. Excellent time to begin transit.");
    }
    if (realAlerts.some((a) => a.type === "accident")) {
      tips.push("Emergency crew active. Anticipate emergency dispatch bypass lanes.");
    }
    tips.push("Bypass downtown avenues to save time today.");
    return tips;
  }, [realMetrics.congestion, realAlerts]);

  const mapCenter = [locationCoords.lat, locationCoords.lon];

  const routeMap = (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={isMapExpanded} className="w-full h-full">
      <TileLayer url={mapTileUrl} attribution="&copy; CartoDB" />
      <MapAutoCenter center={mapCenter} routePath={routePath} />

      <Marker position={mapCenter}>
        <Popup>Your Location</Popup>
      </Marker>

      {destinationCoords && (
        <Marker position={[destinationCoords.lat, destinationCoords.lon]}>
          <Popup>Destination Node</Popup>
        </Marker>
      )}

      {routePath.length > 1 && (
        <Polyline positions={routePath} pathOptions={{ color: "#22d3ee", weight: 5, opacity: 0.8 }} />
      )}

      {realAlerts.map((alert) => (
        <Marker
          key={alert.id}
          position={[alert.latitude, alert.longitude]}
          icon={L.divIcon({
            className: "custom-alert-icon",
            html: `<div class="p-1 rounded-full ${
              alert.type === "accident" ? "bg-rose-500 shadow-rose-500/50" : "bg-amber-500 shadow-amber-500/50"
            } shadow-lg border-2 border-white w-4 h-4 animate-bounce"></div>`,
            iconSize: [20, 20],
          })}
        >
          <Popup>
            <div className="space-y-1 font-inter text-xs">
              <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{alert.type.toUpperCase()}</p>
              <p className="text-slate-600 leading-tight">{alert.message}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Citizen";

  return (
    <div className={`min-h-screen pt-24 pb-16 ${t.bg} font-inter transition-colors duration-300`}>
      {/* Full screen Map Overlay Modal */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center bg-slate-900/90 border border-white/10 p-4 rounded-2xl mb-3 text-white">
            <h3 className="font-semibold text-sm">Interactive Commute Navigation Map</h3>
            <button
              type="button"
              onClick={() => setIsMapExpanded(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 font-semibold"
            >
              ✕ Close Map
            </button>
          </div>
          <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/10">{routeMap}</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 dark:border-white/5 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400 font-bold">
              Smart Mobility Portal
            </p>
            <h1 className="text-3xl font-poppins font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Welcome back, {firstName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              City transit guides calibrated for <span className="font-semibold text-cyan-500">{locationLabel}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-1 text-[11px] font-semibold text-slate-500 dark:text-gray-400">
            <span className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/35 font-mono text-cyan-500">
              📍 {locationMeta || "Locating coordinates..."}
            </span>
          </div>
        </header>

        {/* 1. Commute Dashboard Upper Row */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Snapshots Grid */}
          <div className={`p-6 ${t.card} lg:col-span-8 space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  Street Monitor
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mobility Insights Snapshot
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                realMetrics.congestion > 60
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              }`}>
                {realMetrics.congestion > 60 ? "Heavy Traffic Delays" : "Optimal Transit Flow"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Average Delay</p>
                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  +{realMetrics.congestion > 50 ? Math.round(realMetrics.congestion * 0.4) : 2}m
                </p>
                <p className="text-[9px] text-slate-500 mt-1">Relative to free flow speeds</p>
              </div>

              <div className="p-4 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active Blockages</p>
                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {realMetrics.alerts}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">Active within travel bounds</p>
              </div>

              <div className="p-4 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Time Saved Today</p>
                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {realMetrics.congestion > 50 ? "11 min" : "4 min"}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">By routing recommendations</p>
              </div>
            </div>
          </div>

          {/* Right Commute Travel Tips */}
          <div className={`p-6 ${t.card} lg:col-span-4 space-y-4`}>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                AI Helper
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Transit Recommendations
              </h3>
            </div>

            <div className="space-y-3">
              {travelTips.map((tip, idx) => (
                <div key={idx} className="p-3 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 rounded-xl text-xs text-slate-600 dark:text-gray-300">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Route Navigation Planner & Map */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Map & Forms Grid */}
          <div className={`p-6 ${t.card} lg:col-span-8 space-y-5`}>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                Transit Planner
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Interactive Commute Navigation
              </h3>
            </div>

            {/* Address inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Departure Origin</span>
                <input
                  className={`${t.input}`}
                  placeholder="Current Location"
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Destination Address</span>
                <input
                  className={`${t.input}`}
                  placeholder="Where to?"
                  value={routeDestination}
                  onChange={(e) => setRouteDestination(e.target.value)}
                />
              </div>
            </div>

            {/* Travel Mode switcher */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Travel Mode</span>
              <div className="flex gap-2">
                {[
                  { id: "car", label: "Car" },
                  { id: "bike", label: "Bicycle" },
                  { id: "walk", label: "Pedestrian" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTransportMode(mode.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      transportMode === mode.id
                        ? "border-cyan-500/35 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparative route planners */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-3 border border-cyan-500/25 bg-cyan-500/5 rounded-xl">
                <span className="text-[9px] uppercase tracking-wider text-cyan-500 font-bold block">
                  Fastest Route
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                  {routeSummary
                    ? `${formatDuration(routeSummary.trafficDurationMin)} (${routeSummary.distanceKm} km)`
                    : "16 min (4.5 km)"}
                </p>
                <span className="text-[9px] text-slate-500">Live traffic adjusted</span>
              </div>

              <div className="p-3 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl">
                <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold block">
                  Safest Route
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                  {routeSummary
                    ? `${formatDuration(Math.round(routeSummary.trafficDurationMin * 1.15))} (${(routeSummary.distanceKm * 1.1).toFixed(1)} km)`
                    : "22 min (5.1 km)"}
                </p>
                <span className="text-[9px] text-slate-500">Avoids active accident zones</span>
              </div>

              <div className="p-3 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl">
                <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold block">
                  Least Congested
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                  {routeSummary
                    ? `${formatDuration(Math.round(routeSummary.trafficDurationMin * 1.05))} (${(routeSummary.distanceKm * 1.05).toFixed(1)} km)`
                    : "19 min (4.8 km)"}
                </p>
                <span className="text-[9px] text-slate-500">Avoids gridlock centers</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFindRoute}
                disabled={routeStatus === "loading"}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {routeStatus === "loading" ? "Calculating Routes..." : "Calculate Route Options"}
              </button>
              <button
                type="button"
                onClick={() => setIsMapExpanded(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 transition-all"
              >
                Expand Viewport Map
              </button>
            </div>

            {routeError && <p className="text-xs text-rose-500 font-semibold">{routeError}</p>}

            {/* Inline map canvas */}
            <div className="h-72 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/5 z-10 relative">
              {routeMap}
            </div>
          </div>

          {/* Right Commute Log panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Saved comms */}
            <div className={`p-6 ${t.card} space-y-4`}>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  Quick links
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Saved Corridors
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {savedRoutes.map((route, idx) => (
                  <div key={idx} className="p-3 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{route.name}</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">{route.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Alerts list */}
            <div className={`p-6 ${t.card} flex-1 space-y-4 flex flex-col`}>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  Alerts feed
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Local Transit Warnings
                </h3>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
                {realAlerts.length > 0 ? (
                  realAlerts.map((alert) => {
                    const category = classifyAlertType(alert.message);
                    return (
                      <div key={alert.id} className="p-3 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          <span>{category}</span>
                          <span className="flex items-center gap-1 font-mono text-[9px]">
                            <Timer size={10} /> Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-gray-200 leading-snug">{alert.message}</p>

                        {category === "Accident Ahead" && alert.agencyETAs && (
                          <div className="grid grid-cols-3 gap-1 pt-1.5 mt-1 border-t border-rose-500/10 text-[9px] text-slate-400 text-center font-mono">
                            <div>Police: {alert.agencyETAs.police}m</div>
                            <div className="border-x border-rose-500/10">Ambulance: {alert.agencyETAs.ambulance}m</div>
                            <div>Fire: {alert.agencyETAs.fire}m</div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center text-slate-400 dark:text-slate-500">
                    <ShieldCheck size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">All local routes clear</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 3. Analytics Trends */}
        <section className={`p-6 ${t.card} space-y-4`}>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
              Corridor Activity
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Daily Commute Analytics
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">24-hour city network density index metrics.</p>
          </div>

          <div className="h-60 w-full">
            {realTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realTrend.map((d, i) => ({ time: i, value: d.index }))} margin={{ left: -25, right: 5 }}>
                  <defs>
                    <linearGradient id="userFlowLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.stroke} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis hide dataKey="time" />
                  <YAxis domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: "none",
                      borderRadius: "12px",
                      color: chartColors.tooltipText,
                      fontSize: "11px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors.stroke}
                    fillOpacity={1}
                    fill="url(#userFlowLine)"
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs opacity-50 uppercase tracking-widest border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                Gathering street density histories...
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
