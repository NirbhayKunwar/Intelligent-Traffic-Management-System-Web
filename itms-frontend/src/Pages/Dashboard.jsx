import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import UserDashboard from "./UserDashboard";
// This component renders the dashboard page, which displays different content based on the user's authentication status and role. It uses the useEffect hook to load the user's session data when the component mounts, and manages loading, error, and unauthenticated states. Depending on the user's role, it either renders a user-specific dashboard or an operator dashboard with various sections for live camera feed, video upload, model analysis, traffic flow graph, and traffic chart. The component also includes styling for a gradient background, borders, shadows, and responsive design.
export default function Dashboard() {
  const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
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
      <div className="max-w-7xl mx-auto space-y-8">
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
{/* Grid layout for the dashboard sections, including live camera feed, video upload, model analysis, traffic flow graph, and traffic chart. Each section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations. The sections include interactive elements such as file uploads and buttons to run models, along with placeholders for live data and visualizations. */}
        <div className="grid gap-6">
          <section className={cardClasses}>
            <div className="pointer-events-none absolute -top-6 right-10 h-24 w-24 rounded-full bg-cyan-200/60 blur-3xl dark:bg-cyan-500/20"></div>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Live Camera Feed
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Real-time intersection footage with Accident and Traffic congestion models.
                </p>
              </div>
              <div className="aspect-video rounded-xl border border-white/60 dark:border-cyan-500/20 bg-gradient-to-br from-slate-100/80 via-white/70 to-indigo-100/80 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/70 flex items-center justify-center text-slate-800 dark:text-gray-400">
                Live camera stream preview
              </div>
            </div>
          </section>
{/* Section for video upload and model analysis, including a file input for uploading traffic incident videos and buttons to run accident and congestion detection models. The section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations. The model analysis section includes placeholders for displaying the results of the accident and congestion detection models. */}
          <section className={cardClasses}>
            <div className="pointer-events-none absolute -top-8 left-6 h-20 w-32 -rotate-6 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Unified Video Upload
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Upload once and run both accident + congestion models together.
                </p>
              </div>
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/80 dark:border-cyan-500/30 bg-white/50 dark:bg-black/30 p-6 text-center">
                <span className="text-sm text-slate-900 dark:text-gray-300">
                  Drag and drop a traffic incident video, or click to browse.
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="block w-full text-sm text-blue-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800 dark:file:bg-cyan-600 dark:hover:file:bg-cyan-500"
                />
              </label>
              <button
                type="button"
                className="w-full rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Run Both Models
              </button>
            </div>
          </section>
{/* Section for model analysis, including placeholders for displaying the results of the accident and congestion detection models. The section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations. The model analysis section includes buttons to run the accident and congestion detection models, along with notes about processing time. */}
          <section className={cardClasses}>
            <div className="pointer-events-none absolute -top-8 left-6 h-20 w-32 -rotate-6 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Model Analysis
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Accident and congestion detections run side by side.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Accident Detection Model
                    </h3>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Accident detection results for the uploaded video.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-full px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Detect the Accident
                  </button>
                  <p className="text-xs text-slate-900 dark:text-gray-200">
                    Process takes time.
                  </p>
                </div>
{/* Model analysis section for congestion detection, including a placeholder for displaying the results of the congestion detection model. The section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations. The congestion detection model includes a button to run the model and a note about processing time. */}
                <div className="rounded-2xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Congestion Detection Model
                    </h3>
                    <p className="text-sm text-slate-900 dark:text-gray-300">
                      Congestion detection results for the uploaded video.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Detect the congestion
                  </button>

                  <p className="text-xs text-slate-900 dark:text-gray-200">
                    Process takes time.
                  </p>
                </div>
              </div>
            </div>
          </section>
{/* Section for traffic flow graph, including a placeholder SVG for visualizing hourly vehicle throughput across priority corridors. The section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations. The traffic flow graph includes a heading and description, along with a stylized line graph to represent traffic flow data. */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Traffic Flow Graph
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Hourly vehicle throughput across priority corridors.
                </p>
              </div>
              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-4">
                <svg viewBox="0 0 360 140" className="w-full h-40">
                  <defs>
                    <linearGradient id="flowLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#flowLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="10,110 60,70 110,90 160,40 210,60 260,30 310,50 350,20"
                  />
                  <polyline
                    fill="rgba(34,211,238,0.15)"
                    points="10,140 10,110 60,70 110,90 160,40 210,60 260,30 310,50 350,20 350,140"
                  />
                </svg>
              </div>
            </div>
          </section>
{/* Section for traffic flow graph, including a placeholder SVG for visualizing hourly vehicle throughput across priority corridors. The section is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for monitoring traffic operations. The traffic flow graph includes a heading and description, along with a stylized line graph to represent traffic flow data. */}
          <section className={cardClasses}>
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Traffic Chart
                </h2>
                <p className="text-sm text-slate-900 dark:text-gray-300">
                  Live operational indicators for accidents, congestion, and more.
                </p>
              </div>
              <div className="rounded-xl border border-white/60 dark:border-cyan-500/20 bg-white/60 dark:bg-black/30 p-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-gray-400">
                  <span>Today</span>
                  <span>Live Metrics</span>
                </div>
                <div className="mt-6 grid grid-cols-3 items-end gap-6 h-40 sm:h-44">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[90px] rounded-2xl bg-gradient-to-t from-rose-400/80 via-orange-300/80 to-amber-200/80 dark:from-rose-500/70 dark:via-orange-400/70 dark:to-amber-300/70 border border-white/60 dark:border-white/10 shadow-lg shadow-rose-500/20"
                      style={{ height: "65%" }}
                    ></div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">12</p>
                    <p className="text-xs text-slate-900 dark:text-gray-300">Accidents</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[90px] rounded-2xl bg-gradient-to-t from-cyan-400/80 via-blue-400/80 to-indigo-300/80 dark:from-cyan-500/70 dark:via-blue-500/70 dark:to-indigo-400/70 border border-white/60 dark:border-white/10 shadow-lg shadow-cyan-500/20"
                      style={{ height: "85%" }}
                    ></div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">68%</p>
                    <p className="text-xs text-slate-900 dark:text-gray-300">Congestion</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[90px] rounded-2xl border-2 border-dashed border-slate-300/70 dark:border-cyan-500/40 bg-white/40 dark:bg-black/20"
                      style={{ height: "35%" }}
                    ></div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Soon</p>
                    <p className="text-xs text-slate-900 dark:text-gray-300">More signals</p>
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