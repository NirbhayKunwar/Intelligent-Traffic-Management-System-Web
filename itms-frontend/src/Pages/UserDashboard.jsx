import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { useCallback } from "react";
import { apiRequest } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Utility function to calculate distance between two coordinates using the Haversine formula, returning the distance in kilometers. This is used to determine when to perform reverse geocoding based on the user's movement.
const calcDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Fix Leaflet's default icon paths for React apps
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
    if (!map || !center) return;
    if (routePath && routePath.length > 1) {
      map.fitBounds(routePath, { padding: [40, 40] });
      return;
    }
    map.setView(center, 13);
  }, [center, map, routePath]);
  return null;
}

// Main user dashboard component
export default function UserDashboard({ user }) {
  const [locationLabel, setLocationLabel] = useState("Dehradun, India");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | ready | denied | error
  const [locationMeta, setLocationMeta] = useState("");
  const [locationCoords, setLocationCoords] = useState({
    lat: 30.3165,
    lon: 78.0322,
  });
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

  // Real-time data states
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

      // Filter alerts specifically for Dehradun area (Approx bounding box)
      const DEHRADUN_BOUNDS = {
        latMin: 30.1, latMax: 30.5,
        lonMin: 77.8, lonMax: 78.2
      };

      if (alertsData && Array.isArray(alertsData.alerts)) {
        const localAlerts = alertsData.alerts.filter(alert => {
          if (!alert.latitude || !alert.longitude) return false;
          const lat = parseFloat(alert.latitude);
          const lon = parseFloat(alert.longitude);
          return (
            lat >= DEHRADUN_BOUNDS.latMin && lat <= DEHRADUN_BOUNDS.latMax &&
            lon >= DEHRADUN_BOUNDS.lonMin && lon <= DEHRADUN_BOUNDS.lonMax
          );
        });
        setRealAlerts(localAlerts.slice(0, 10));
      }

      if (summaryData && summaryData.metrics) {
        setRealMetrics(summaryData.metrics);
      }
      
      if (trendData && Array.isArray(trendData.points)) {
        // Map trend data into objects for the SVG chart
        const points = trendData.points.map(val => ({ index: Number(val) || 0 }));
        setRealTrend(points);
      }
    } catch (err) {
      console.error("Real-time fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    loadRealTimeData();
    const inv = setInterval(loadRealTimeData, 5000);
    return () => clearInterval(inv);
  }, [loadRealTimeData]);
// Common card styles for consistency
  const cardClasses =
    "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl";
  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "there";
// Effect to handle geolocation tracking and reverse geocoding
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationMeta("Location unavailable");
      return;
    }
// Configuration for geolocation tracking and reverse geocoding
    let watchId;
    const geocodeIntervalMs = 5 * 60 * 1000;
    const geocodeDistanceKm = 1;
// Function to reverse geocode coordinates into a human-readable location
    const reverseGeocode = async (latitude, longitude, coordsLabel) => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        const address = data?.address || {};
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          address.state ||
          "";
        const country = address.country || "";
        const label = [city, country].filter(Boolean).join(", ");
        if (label) {
          setLocationLabel(label);
        }
        setLocationStatus("ready");
        setLocationMeta(coordsLabel);
        lastGeocodeRef.current = {
          lat: latitude,
          lon: longitude,
          ts: Date.now(),
        };
      } catch {
        setLocationStatus("ready");
      }
    };
// Start watching the user's location
    setLocationStatus("loading");
    setLocationMeta("Detecting location...");
// Use watchPosition to get continuous updates as the user moves
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordsLabel = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
        setLocationCoords({ lat: latitude, lon: longitude });
        setLocationMeta(coordsLabel);
        setLocationStatus("ready");
// Determine if we should reverse geocode based on time and distance thresholds
        const last = lastGeocodeRef.current;
        const now = Date.now();
        const shouldReverse =
          !last ||
          now - last.ts > geocodeIntervalMs ||
          calcDistanceKm(latitude, longitude, last.lat, last.lon) > geocodeDistanceKm;
// Perform reverse geocoding if needed to update the location label
        if (shouldReverse) {
          reverseGeocode(latitude, longitude, coordsLabel);
        }
      },
      (err) => {
        if (err?.code === 1) {
          setLocationStatus("denied");
          setLocationMeta("Location permission denied");
        } else {
          setLocationStatus("error");
          setLocationMeta("Unable to fetch location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
// Clean up the geolocation watch when the component unmounts
    return () => {
      if (typeof watchId === "number") {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
// Effect to disable background scrolling when the map is expanded
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMapExpanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMapExpanded]);
// Determine if the current location is in Dehradun to tailor UI and data accordingly
  const isDehradun = useMemo(
    () => locationLabel.toLowerCase().includes("dehradun"),
    [locationLabel]
  );
// Function to geocode a place name into coordinates using Nominatim API
  const geocodePlace = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query
    )}&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("Location not found.");
    }
    const entry = results[0];
    return {
      lat: Number(entry.lat),
      lon: Number(entry.lon),
      label: entry.display_name,
    };
  };
// Estimate traffic impact based on local time and travel mode
  const getTrafficMultiplier = (mode) => {
    const hour = new Date().getHours();
    const isPeak = (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19);
    if (mode === "car") return isPeak ? 1.35 : 1.1;
    if (mode === "bike") return isPeak ? 1.15 : 1.05;
    return 1.0;
  };
// Function to fetch a route between two coordinates using OSRM(Open Source Routing Machine) API
  const fetchRoute = async (start, end, mode) => {
    const profile = mode === "bike" ? "cycling" : mode === "walk" ? "foot" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.routes?.length) {
      throw new Error("Route not found.");
    }
    return data.routes[0];
  };
// Handler for finding the route based on user input and updating the state accordingly
  const handleFindRoute = async () => {
    setRouteError("");
    setRouteStatus("loading");
    setRouteSummary(null);
    setRoutePath([]);
    setDestinationCoords(null);
// Validate user input and determine start and destination coordinates
    try {
      const startQuery = routeStart.trim();
      const destinationQuery = routeDestination.trim();
      if (!destinationQuery) {
        throw new Error("Please enter a destination.");
      }
// Determine if the user wants to use their current location or a specified start location
      const normalizedStart = startQuery.toLowerCase();
      const useCurrentLocation =
        !startQuery || normalizedStart === "current location" || normalizedStart === "current";
      if (useCurrentLocation && (locationStatus === "denied" || locationStatus === "error")) {
        throw new Error("Enable location access or enter a start location.");
      }
// Geocode the start and destination locations to get their coordinates
      let startCoords = locationCoords;
      if (!useCurrentLocation) {
        const startResult = await geocodePlace(startQuery);
        startCoords = { lat: startResult.lat, lon: startResult.lon };
      }
// Geocode the destination location
      const destinationResult = await geocodePlace(destinationQuery);
      const destCoords = { lat: destinationResult.lat, lon: destinationResult.lon };
// Fetch the route between the start and destination coordinates
      const route = await fetchRoute(startCoords, destCoords, transportMode);
      const polyline = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
// Update the state with the route path, destination coordinates, and route summary for display
      setRoutePath(polyline);
      setDestinationCoords(destCoords);
      const distanceKm = route.distance / 1000;
      const minMinutesByMode = () => {
        if (transportMode === "walk") return (distanceKm / 4.5) * 60;
        if (transportMode === "bike") return (distanceKm / 15) * 60;
        return (distanceKm / 30) * 60;
      };
      const baseDurationMin = Math.max(
        1,
        Math.round(Math.max(route.duration / 60, minMinutesByMode()))
      );
      const trafficMultiplier = getTrafficMultiplier(transportMode);
      const trafficDurationMin = Math.max(1, Math.round(baseDurationMin * trafficMultiplier));
      setRouteSummary({
        distanceKm: distanceKm.toFixed(1),
        durationMin: baseDurationMin,
        trafficDurationMin,
        trafficMultiplier,
        mode: transportMode,
      });
      setRouteStatus("ready");
    } catch (err) {
      setRouteStatus("error");
      setRouteError(err.message || "Unable to fetch route.");
    }
  };
// Dynamic placeholders, labels, and data based on whether the user is in Dehradun or not
  const routeStartPlaceholder = isDehradun ? "Rajpur Road" : "Current location";
  const routeDestinationPlaceholder = isDehradun ? "Clock Tower" : "Where to?";
  const safestRouteMinutes = routeSummary
    ? Math.max(
        routeSummary.trafficDurationMin,
        Math.round(routeSummary.trafficDurationMin * 1.2)
      )
    : null;
  const fastestRouteLabel = routeSummary
    ? `${formatDuration(routeSummary.trafficDurationMin)} - ${routeSummary.distanceKm} km`
    : isDehradun
    ? "22 min - Rajpur Rd"
    : "24 min - Main Route";
  const safestRouteLabel = routeSummary
    ? `${formatDuration(safestRouteMinutes)} - safer route`
    : isDehradun
    ? "28 min - Canal Rd"
    : "29 min - Scenic Route";

  // Dynamic Content derived from real-time metrics
  const travelTips = useMemo(() => {
    const tips = [];
    if (realMetrics.congestion > 60) {
      tips.push("High congestion detected. Consider delaying travel by 30 mins.");
    } else {
      tips.push("Traffic flow is stable. It's a great time to head out.");
    }
    
    if (realAlerts.some(a => a.type === 'accident')) {
      tips.push("Accident response in progress. Keep emergency lanes clear.");
    } else {
      tips.push("No major accidents reported on primary city routes.");
    }

    if (isDehradun) {
      tips.push("City Center (Clock Tower) area currently shows moderate flow.");
    }
    return tips;
  }, [realMetrics.congestion, realAlerts, isDehradun]);

  const bestTravelTime = useMemo(() => {
    if (realMetrics.congestion < 30) return "Right Now";
    // Mocking a future low-point logic: if now is high, pick 2 hours later
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [realMetrics.congestion]);

  const savedRoutes = isDehradun
    ? [
        "Home -> Clock Tower - 26 min",
        "ISBT -> Pacific Mall - 18 min",
        "Airport -> Clement Town - 35 min",
      ]
    : [
        "Home -> Downtown - 28 min",
        "Office -> Campus - 18 min",
        "Airport -> Home - 35 min",
      ];
// JSX for rendering the route map with Leaflet, including markers for current location and destination, and a polyline for the route path
  const mapCenter = [locationCoords.lat, locationCoords.lon];
  const routeMap = (
    <MapContainer
      center={mapCenter}
      zoom={13}
      scrollWheelZoom={isMapExpanded}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapAutoCenter center={mapCenter} routePath={routePath} />
      <Marker position={mapCenter}>
        <Popup>Your location</Popup>
      </Marker>
      {destinationCoords && (
        <Marker position={[destinationCoords.lat, destinationCoords.lon]}>
          <Popup>Destination</Popup>
        </Marker>
      )}
      {routePath.length > 1 && (
        <Polyline positions={routePath} pathOptions={{ color: "#06b6d4", weight: 5 }} />
      )}
      {realAlerts.map((alert) => (
        <Marker 
          key={alert.id} 
          position={[alert.latitude, alert.longitude]}
          icon={L.divIcon({
            className: 'custom-icon',
            html: `<div class="p-1 rounded-full ${alert.type === 'Accident' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-amber-500 shadow-amber-500/50'} shadow-lg border-2 border-white w-4 h-4 animate-bounce"></div>`,
            iconSize: [20, 20],
          })}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{alert.type}</p>
              <p className="text-xs text-slate-600 leading-tight">{alert.message}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
// Main JSX return for the user dashboard, including conditional rendering for the expanded map and various sections for traffic snapshot, travel tips, route planner, saved routes, incident alerts, and location status
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {isMapExpanded && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setIsMapExpanded(false)}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[70] rounded-full px-4 py-2 bg-white/90 text-slate-900 shadow-lg hover:bg-white dark:bg-slate-900/90 dark:text-white dark:hover:bg-slate-900 pointer-events-auto"
          >
            Close Map
          </button>
          <div className="relative h-full w-full max-w-6xl mx-auto">
            <div className="h-full rounded-2xl overflow-hidden border border-white/40 dark:border-cyan-500/20 bg-white/70 dark:bg-slate-950/80">
              <div className="h-full">{routeMap}</div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-800 dark:text-gray-400">
              Personal Mobility
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-slate-900 dark:text-gray-300">
              Live mobility insights tailored for {locationLabel}.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-xs text-slate-700 dark:text-gray-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200">
              {locationLabel}
            </span>
            {locationStatus !== "idle" && (
              <span className="text-[11px] text-slate-600 dark:text-gray-400">
                {locationMeta}
              </span>
            )}
          </div>
          <Link
            to="/"
            className="text-sm text-slate-900 hover:text-slate-900 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Back to Home
          </Link>
        </header>
{/* Grid layout for the main dashboard sections, with responsive design for larger screens */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className={`${cardClasses} lg:col-span-2`}>
            <div className="pointer-events-none absolute -top-8 left-8 h-24 w-24 rounded-full bg-cyan-200/60 blur-3xl dark:bg-cyan-500/20"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Live Traffic Snapshot
                  </h2>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Local traffic conditions updated every few minutes.
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  realMetrics.congestion > 0 
                  ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${realMetrics.congestion > 0 ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                  {realMetrics.congestion > 0 ? "Heavy Congestion" : "Smooth Flow"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-700 dark:text-gray-400">
                    Avg Delay
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    +{realMetrics.congestion > 0 ? (realMetrics.congestion * 3).toFixed(0) : "2"} min
                  </p>
                  <p className="text-xs text-slate-700 dark:text-gray-400">Live system data</p>
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-700 dark:text-gray-400">
                    Active Alerts
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {realMetrics.alerts}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-gray-400">
                    {realAlerts.length > 0 ? `${realAlerts[0].type.toUpperCase()} reported` : "No urgent alerts"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-700 dark:text-gray-400">
                    Best Time
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {bestTravelTime}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-gray-400">
                    {realMetrics.congestion < 30 ? "Optimal flow now" : "Projected recovery"}
                  </p>
                </div>
              </div>
            </div>
          </section>
{/* Section for travel tips with dynamic content based on location */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Travel Tips
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Personalized guidance for smoother commutes.
                </p>
              </div>
              <div className="space-y-3 text-sm text-slate-900 dark:text-gray-300">
                {travelTips.map((tip, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-4 py-3"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
{/* Section for route planning with user input, dynamic placeholders, and route summary display */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className={`${cardClasses} lg:col-span-2`}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Route Planner
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Compare fastest vs safest routes based on live congestion.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                    Start
                  </span>
                  <input
                    type="text"
                    value={routeStart}
                    onChange={(event) => setRouteStart(event.target.value)}
                    placeholder={routeStartPlaceholder}
                    className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-slate-900 shadow-sm focus:outline-none dark:border-cyan-500/20 dark:bg-black/30 dark:text-white"
                  />
                  <p className="text-xs text-slate-700 dark:text-gray-400">
                    Leave blank to use your current location.
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                    Destination
                  </span>
                  <input
                    type="text"
                    value={routeDestination}
                    onChange={(event) => setRouteDestination(event.target.value)}
                    placeholder={routeDestinationPlaceholder}
                    className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-slate-900 shadow-sm focus:outline-none dark:border-cyan-500/20 dark:bg-black/30 dark:text-white"
                  />
                </label>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                  Travel Mode
                </span>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "car", label: "Car" },
                    { id: "bike", label: "Bike" },
                    { id: "walk", label: "Walk" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTransportMode(mode.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                        transportMode === mode.id
                          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200"
                          : "border-white/60 bg-white/70 text-slate-700 hover:bg-white dark:border-cyan-500/30 dark:bg-black/30 dark:text-gray-200 dark:hover:bg-black/50"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleFindRoute}
                  disabled={routeStatus === "loading"}
                  className="rounded-full px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30"
                >
                  {routeStatus === "loading" ? "Finding Route..." : "Find Fastest Route"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(true)}
                  className="rounded-full px-5 py-2 border border-cyan-200 bg-white/70 text-cyan-700 hover:bg-white dark:border-cyan-500/40 dark:bg-black/30 dark:text-cyan-200 dark:hover:bg-black/50"
                >
                  Expand Map
                </button>
                <button
                  type="button"
                  className="rounded-full px-5 py-2 border border-cyan-200 bg-white/70 text-cyan-700 hover:bg-white dark:border-cyan-500/40 dark:bg-black/30 dark:text-cyan-200 dark:hover:bg-black/50"
                >
                  Avoid Incident Zones
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-700 dark:text-gray-400">
                    Fastest
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {fastestRouteLabel}
                  </p>
                  {routeSummary && routeSummary.trafficDurationMin !== routeSummary.durationMin && (
                    <p className="mt-1 text-xs text-slate-700 dark:text-gray-400">
                      Base {formatDuration(routeSummary.durationMin)} - traffic x{routeSummary.trafficMultiplier}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-700 dark:text-gray-400">
                    Safest
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {safestRouteLabel}
                  </p>
                </div>
              </div>
              {routeError && (
                <p className="text-sm text-rose-600 dark:text-rose-300">{routeError}</p>
              )}
              {!isMapExpanded && (
                <div className="rounded-xl overflow-hidden border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 h-72">
                  {routeMap}
                </div>
              )}
            </div>
          </section>
{/* Section for saved routes with dynamic content based on location */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Saved Routes
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Quick checks for your daily commutes.
                </p>
              </div>
              <div className="space-y-3 text-sm text-slate-900 dark:text-gray-300">
                {savedRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 px-4 py-3"
                  >
                    {route}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
{/* Section for incident alerts with dynamic content based on location */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Incident Alerts
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Real-time accidents or congestion within Dehradun, India.
                </p>
              </div>
              <div className="space-y-4 text-sm text-slate-900 dark:text-gray-300">
                {realAlerts.length > 0 ? (
                  realAlerts.map((alert, index) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl overflow-hidden border ${
                        alert.type === 'accident'
                          ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5 shadow-lg shadow-rose-500/5"
                          : "border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5 shadow-lg shadow-amber-500/5"
                      }`}
                    >
                      <div className="px-4 py-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className={`font-black uppercase text-[9px] tracking-[0.2em] mb-0.5 ${
                              alert.type === 'accident' ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                            }`}>
                              {alert.type} detected
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">{alert.message}</p>
                          </div>
                          <span className="text-[10px] font-mono opacity-60 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5">
                             {alert.latitude && alert.longitude ? `${Number(alert.latitude).toFixed(3)}N, ${Number(alert.longitude).toFixed(3)}E` : ""}
                          </span>
                        </div>
                        
                        {alert.type === 'accident' && alert.agencyETAs && (
                          <div className="mt-4 pt-3 border-t border-rose-500/10">
                            <div className="flex items-center gap-2 mb-3">
                               <div className="relative flex h-2 w-2">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                               </div>
                               <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                 Emergency Response Active
                               </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white/40 dark:bg-white/5 rounded-lg p-2 text-center border border-rose-500/5">
                                <p className="text-[8px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">Police</p>
                                <p className="text-xs font-black text-rose-600 dark:text-rose-400">{alert.agencyETAs.police} min</p>
                              </div>
                              <div className="bg-white/40 dark:bg-white/5 rounded-lg p-2 text-center border border-rose-500/5">
                                <p className="text-[8px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">Medic</p>
                                <p className="text-xs font-black text-rose-600 dark:text-rose-400">{alert.agencyETAs.ambulance} min</p>
                              </div>
                              <div className="bg-white/40 dark:bg-white/5 rounded-lg p-2 text-center border border-rose-500/5">
                                <p className="text-[8px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">Fire</p>
                                <p className="text-xs font-black text-rose-600 dark:text-rose-400">{alert.agencyETAs.fire} min</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-4 py-6 text-center">
                    <p className="text-emerald-800 dark:text-emerald-300 font-medium">No major road incidents detected in your area.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
{/* Section for location status with dynamic content based on geolocation permissions and data availability */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Location Status
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Using your browser GPS to tailor insights.
                </p>
              </div>
              <div className="text-xs text-slate-700 dark:text-gray-400">
                {locationStatus === "denied"
                  ? "Location permission denied - showing fallback area."
                  : locationStatus === "error"
                  ? "Location unavailable - showing fallback area."
                  : "Map centered on your current area."}
              </div>
              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/70 dark:bg-black/30 p-4 text-sm text-slate-900 dark:text-gray-200 space-y-2">
                <p className="font-semibold">{locationLabel}</p>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  {locationMeta || "Coordinates pending"}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Route map is shown in the Route Planner section.
                </p>
              </div>
            </div>
          </section>
        </div>
{/* Section for traffic trend visualization with a simple SVG line chart */}
        <section className={cardClasses}>
          <div className="relative z-10 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Traffic Trend
              </h2>
              <p className="text-sm text-slate-900 dark:text-gray-300">
                Congestion trend for the last 24 hours.
              </p>
            </div>
            <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-2" style={{ height: '240px' }}>
              {realTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realTrend.map((d, i) => ({ time: i, value: d.index }))}>
                    <defs>
                      <linearGradient id="userFlowLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.stroke} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.stroke} stopOpacity={0} />
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
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        border: 'none', 
                        borderRadius: '8px', 
                        color: chartColors.tooltipText, 
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: chartColors.stroke }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={chartColors.stroke} 
                      fillOpacity={isDarkMode ? 0.3 : 0.1} 
                      fill="url(#userFlowLine)" 
                      strokeWidth={3}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs opacity-50 uppercase tracking-tighter">
                  Accumulating historical trend data...
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}