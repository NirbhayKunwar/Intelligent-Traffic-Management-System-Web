import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import UserDashboard from "./UserDashboard";
// This component renders the dashboard page based on authentication and role. Users see the user dashboard; operators see the operations layout with live preview, alerts, detection panels, controls, and camera setup.
export default function Dashboard() {
  const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // State variables for operator dashboard controls and data. These include toggles for overlays, congestion thresholds, selected live camera, camera list, input fields for adding/editing cameras, and deployment state.
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [congestionThreshold, setCongestionThreshold] = useState(65);
  const [liveCameraId, setLiveCameraId] = useState("clocktower");

  // Initial camera data for the dashboard, including ID, name, status, stream type, and last ping time. This state is used to manage the list of cameras displayed in the live preview and selection dropdowns.
  const [cameras, setCameras] = useState(() => [
    {
      id: "clocktower",
      name: "Clock Tower, Dehradun",
      status: "Online",
      stream: "HLS",
      lastPing: "Just now",
    },
    {
      id: "rajpur",
      name: "Rajpur Road",
      status: "Online",
      stream: "RTSP",
      lastPing: "2m ago",
    },
    {
      id: "isbt",
      name: "ISBT Intersection",
      status: "Maintenance",
      stream: "HLS",
      lastPing: "20m ago",
    },
  ]);

  // State variables for managing camera addition and editing forms. These include input fields for camera name and stream URL, deployment state to toggle between add/edit modes, and fields for editing existing cameras.
  const [cameraLabel, setCameraLabel] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [deployState, setDeployState] = useState("deploy");
  const [editingCameraId, setEditingCameraId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStream, setEditStream] = useState("HLS");
  const [editStatus, setEditStatus] = useState("Online");

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

// Define a set of common classes for the dashboard cards, including styling for gradient backgrounds, borders, shadows, and responsive design. This variable is used to maintain consistent styling across different sections of the dashboard.
  const cardClasses =
    "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl";
  const compactCardClasses =
    "relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl";
  const congestionTrend = [28, 36, 42, 39, 48, 58, 64, 60, 68, 72, 66, 74];
  const trendViewBoxWidth = 420;
  const trendViewBoxHeight = 160;
  const trendPaddingX = 24;
  const trendPaddingY = 20;
  const trendGraphWidth = trendViewBoxWidth - trendPaddingX * 2;
  const trendGraphHeight = trendViewBoxHeight - trendPaddingY * 2;
  const congestionTrendPoints = congestionTrend
    .map((value, index) => {
      const x =
        trendPaddingX +
        (index * trendGraphWidth) / Math.max(congestionTrend.length - 1, 1);
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
  const selectedLiveCamera =
    cameras.find((camera) => camera.id === liveCameraId) ?? cameras[0];
  const opsMetrics = [
    {
      key: "accidents",
      label: "Accidents",
      value: 12,
      barClass:
        "bg-gradient-to-t from-rose-500/80 via-orange-400/80 to-amber-300/80 dark:from-rose-500/70 dark:via-orange-400/70 dark:to-amber-300/70 shadow-rose-500/20",
    },
    {
      key: "congestion",
      label: "Congestion",
      value: 27,
      barClass:
        "bg-gradient-to-t from-cyan-500/80 via-blue-500/80 to-indigo-400/80 dark:from-cyan-500/70 dark:via-blue-500/70 dark:to-indigo-400/70 shadow-cyan-500/20",
    },
    {
      key: "alerts",
      label: "Alerts",
      value: 7,
      barClass:
        "bg-gradient-to-t from-fuchsia-500/70 via-purple-500/70 to-indigo-400/70 dark:from-fuchsia-500/60 dark:via-purple-500/60 dark:to-indigo-400/60 shadow-purple-500/20",
    },
  ];
  const maxOpsMetric = Math.max(...opsMetrics.map((metric) => metric.value), 1);

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
  const role = user?.role || "operator";
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
                      value={liveCameraId}
                      onChange={(e) => setLiveCameraId(e.target.value)}
                    >
                      {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id} disabled={camera.status !== "Online"}>
                          {camera.name}
                        </option>
                      ))}
                    </select>

                    {/* Status indicator for the live camera feed. It shows a green dot and "Live" text when the selected camera is online, providing a clear visual cue about the feed's status. The indicator is styled with a gradient background, borders, and responsive design to maintain consistency with the overall dashboard aesthetics. */}
                    <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/60 dark:border-cyan-500/25 bg-white/50 dark:bg-black/30 px-3 py-1 text-xs text-slate-900 dark:text-gray-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"></span>
                      Live
                    </div>
                  </div>
                </div>
                <div className="aspect-video rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center text-slate-800 dark:text-gray-400">
                  <div className="text-center space-y-2">
                    <p>Live camera stream preview</p>
                    <p className="text-xs text-slate-800 dark:text-gray-400">
                      {selectedLiveCamera ? `Feed: ${selectedLiveCamera.name}` : "Feed: --"}
                    </p>
                  </div>
                </div>
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
                      Moderate
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Corridor utilization trending upward.
                  </p>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                  </div>
                </div>
              </section>
{/* Accident alert card with a status indicator showing "Clear". It includes a brief description indicating that no active incidents are detected and displays the last check time as "Just now". The card is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. The visual design emphasizes the current status of accidents in the monitored area, providing operators with quick insights at a glance. */}
              <section className={compactCardClasses}>
                <div className="pointer-events-none absolute -top-8 left-6 h-16 w-40 -rotate-6 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Accident Alert
                    </h3>
                    <span className="rounded-full bg-rose-500/15 dark:bg-rose-400/15 px-2 py-1 text-[11px] font-semibold text-rose-900 dark:text-rose-200">
                      Clear
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    No active incidents detected.
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-800 dark:text-gray-400">
                    <span>Last check</span>
                    <span>Just now</span>
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
                      defaultValue="clocktower"
                    >
                      <option value="clocktower">Clock Tower, Dehradun</option>
                      <option value="rajpur">Rajpur Road</option>
                      <option value="isbt">ISBT Intersection</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-indigo-600"
                    >
                      Run Congestion Model
                    </button>
                  </div>
                </div>
                <div className="aspect-video rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center text-slate-800 dark:text-gray-400">
                  Congestion stream preview
                </div>
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
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">--</span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Congestion level</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">--</span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Avg. speed</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">--</span>
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
                      defaultValue="clocktower"
                    >
                      <option value="clocktower">Clock Tower, Dehradun</option>
                      <option value="rajpur">Rajpur Road</option>
                      <option value="isbt">ISBT Intersection</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-orange-600"
                    >
                      Run Accident Model
                    </button>
                  </div>
                </div>
                <div className="aspect-video rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center text-slate-800 dark:text-gray-400">
                  Accident stream preview
                </div>
              </div>
            </section>
{/* Accident information card displaying incidents detected, confidence level, and response ETA. Each piece of information is presented in a separate section with a label and a value placeholder. The card is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This section provides operators with a quick summary of the accident status for the selected feed, allowing them to make informed decisions based on real-time data and respond effectively to incidents as they are detected. */}
            <section className={`${cardClasses} lg:col-span-4`}>
              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Accident Information
                  </h3>
                  <p className="text-sm text-slate-900 dark:text-gray-300">
                    Summary for the current feed selection.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Incidents detected</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">--</span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Confidence</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">--</span>
                  </div>
                  <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-gray-200">Response ETA</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">--</span>
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
                    Threshold: {congestionThreshold}%
                  </span>
                </div>
              </div>
{/* SVG graph visualizing the congestion trend over time, with a gradient line representing the congestion levels and a dashed line indicating the congestion threshold. The graph includes horizontal grid lines for better readability and is styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This visualization allows operators to quickly assess congestion patterns and identify trends in traffic conditions across the monitored corridors. */}
              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4">
                <svg viewBox={`0 0 ${trendViewBoxWidth} ${trendViewBoxHeight}`} className="w-full h-56">
                  <defs>
                    <linearGradient id="congestionLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="55%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="congestionFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
                      <stop offset="100%" stopColor="rgba(236,72,153,0.03)" />
                    </linearGradient>
                  </defs>
{/* Horizontal grid lines for better readability. The lines are spaced evenly across the graph and styled with a light color to maintain visibility without overpowering the main congestion trend line. This helps operators to easily gauge the congestion levels at different points in time and understand the overall trend more effectively. */}
                  {[0, 1, 2, 3].map((row) => (
                    <line
                      key={row}
                      x1={trendPaddingX}
                      x2={trendViewBoxWidth - trendPaddingX}
                      y1={trendPaddingY + (row * trendGraphHeight) / 3}
                      y2={trendPaddingY + (row * trendGraphHeight) / 3}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                    />
                  ))}

                  <line
                    x1={trendPaddingX}
                    x2={trendViewBoxWidth - trendPaddingX}
                    y1={congestionThresholdY}
                    y2={congestionThresholdY}
                    stroke="rgba(34,211,238,0.55)"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                  />

                  <polyline fill="url(#congestionFill)" points={congestionTrendAreaPoints} />
                  <polyline
                    fill="none"
                    stroke="url(#congestionLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={congestionTrendPoints}
                  />
                </svg>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-gray-400">
                    Current
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {congestionTrend[congestionTrend.length - 1]}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-gray-400">
                    Peak
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {Math.max(...congestionTrend)}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-gray-400">
                    Avg
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {Math.round(
                      congestionTrend.reduce((sum, value) => sum + value, 0) /
                        congestionTrend.length
                    )}
                    %
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

              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-gray-400">
                  <span>Today</span>
                  <span>Live Metrics</span>
                </div>

                <div className="mt-6 grid grid-cols-3 items-end gap-6 h-44 sm:h-48">
                  {opsMetrics.map((metric) => (
                    <div key={metric.key} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-full max-w-[110px] rounded-2xl border border-white/60 dark:border-white/10 shadow-lg ${metric.barClass}`}
                        style={{
                          height: `${Math.round((metric.value / maxOpsMetric) * 100)}%`,
                        }}
                      ></div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {metric.value}
                      </p>
                      <p className="text-xs text-slate-900 dark:text-gray-300">{metric.label}</p>
                    </div>
                  ))}
                </div>
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
                  {congestionThreshold}%
                </span>
              </div>

              {/* CUSTOM RANGE INPUT WITH GRADIENT TRACK */}
              <div className="relative w-full">

                {/* Background Track */}
                <div className="w-full h-2 rounded-full bg-slate-300 dark:bg-slate-800"></div>

                {/* Gradient Fill */}
                <div
                  className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${congestionThreshold}%` }}
                ></div>

                {/* Invisible Range Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={congestionThreshold}
                  onChange={(e) => setCongestionThreshold(Number(e.target.value))}
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
                <span>Strict</span>
                <span>Balanced</span>
                <span>Lenient</span>
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
                  {congestionThreshold < 30
                    ? "High Sensitivity"
                    : congestionThreshold < 70
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
                      onChange={(e) => {
                        setCameraLabel(e.target.value);
                        setDeployState("deploy");
                      }}
                    />
                    <input
                      className="w-full rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 px-4 py-3 text-sm text-slate-900 dark:text-gray-200 placeholder:text-slate-500 dark:placeholder:text-gray-500"
                      placeholder="Stream URL (RTSP / HLS)"
                      value={streamUrl}
                      onChange={(e) => {
                        setStreamUrl(e.target.value);
                        setDeployState("deploy");
                      }}
                    />
                  </div>
{/* Video preview area for the camera feed, styled with gradient backgrounds, borders, shadows, and responsive design to maintain consistency with the overall dashboard aesthetics. This area is intended to display the live video stream from the configured camera feed once deployed. The placeholder text indicates that the video should load here, providing operators with a visual confirmation of the camera setup and allowing them to verify that the feed is working correctly. */}
                  <div className="aspect-video rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center text-slate-800 dark:text-gray-400">
                    Video of the camera should load here
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Incident video upload
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      className="block w-full text-sm text-blue-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800 dark:text-cyan-200 dark:file:bg-cyan-600 dark:hover:file:bg-cyan-500"
                    />
                    <button
                      type="button"
                      disabled={deployState === "deployed"}
                      onClick={() => {
                        if (deployState === "deployed") return;
                        const name = cameraLabel.trim();
                        const url = streamUrl.trim();
                        setDeployState("deployed");
                        if (!name || !url) return;

                        const slug = name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, "");
                        const unique = Date.now().toString(36);
                        const id = slug ? `${slug}-${unique}` : `camera-${unique}`;
                        const lowerUrl = url.toLowerCase();
                        const inferredStream = lowerUrl.startsWith("rtsp")
                          ? "RTSP"
                          : lowerUrl.includes(".m3u8")
                            ? "HLS"
                            : "Custom";

                        const nextCamera = {
                          id,
                          name,
                          status: "Online",
                          stream: inferredStream,
                          lastPing: "Just now",
                        };

                        setCameras((prev) => [nextCamera, ...prev]);
                        setLiveCameraId(id);
                      }}
                      className="w-full rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deployState === "deployed" ? "Deployed" : "Deploy"}
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
                                }}
                              >
                                {editingCameraId === camera.id ? "Cancel" : "Edit"}
                              </button>
                              <button
                                type="button"
                                className="rounded-full px-3 py-1 text-[11px] font-semibold border border-white/60 dark:border-rose-500/25 bg-white/60 dark:bg-black/30 text-rose-700 dark:text-rose-200 hover:bg-rose-50/80 dark:hover:bg-rose-500/10"
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Delete ${camera.name}?`
                                  );
                                  if (!ok) return;
                                  const nextCameras = cameras.filter(
                                    (item) => item.id !== camera.id
                                  );
                                  setCameras(nextCameras);
                                  if (liveCameraId === camera.id) {
                                    setLiveCameraId(nextCameras[0]?.id ?? "");
                                  }
                                  if (editingCameraId === camera.id) {
                                    setEditingCameraId(null);
                                  }
                                }}
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
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="flex-1 rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-indigo-600"
                                  onClick={() => {
                                    const nextName = editName.trim();
                                    setCameras((prev) =>
                                      prev.map((item) =>
                                        item.id === camera.id
                                          ? {
                                              ...item,
                                              name: nextName || item.name,
                                              stream: editStream,
                                              status: editStatus,
                                              lastPing: "Just now",
                                            }
                                          : item
                                      )
                                    );
                                    setEditingCameraId(null);
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="flex-1 rounded-full px-4 py-2 border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 text-slate-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-black/40"
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
                <div className="lg:col-span-8 flex flex-col gap-4 lg:border-l lg:border-white/50 dark:lg:border-cyan-500/20 lg:pl-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Camera Location Map
                    </h2>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Set or verify camera coordinates for the selected feed.
                    </p>
                  </div>
                  <div className="min-h-[340px] flex-1 rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center text-slate-800 dark:text-gray-400">
                    Map to set coordinates of the camera
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
