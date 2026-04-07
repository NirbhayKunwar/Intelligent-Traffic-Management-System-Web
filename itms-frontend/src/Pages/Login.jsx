import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import { apiRequest } from "../lib/api";
import cityImage from "../assets/City.jpg";
import cityNightImage from "../assets/Citynight.jpg";

const GOOGLE_AUTH_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");

function buildGoogleAuthUrl(params) {
  const url = new URL(`${GOOGLE_AUTH_BASE}/auth/google`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export default function Login() {
  // State for form inputs, error messages, and loading state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Simulate API call for login
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 text-slate-900 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <section className="relative hidden lg:flex flex-col justify-between px-12 py-16 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/85 to-slate-900/80"></div>
        <div className="relative z-10 space-y-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="ITMS logo"
              className="h-12 w-12"
              onError={(event) => {
                event.currentTarget.src = "/favicon.svg";
              }}
            />
            <div>
              <span className="block text-2xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                ITMS
              </span>
              <h1 className="text-3xl font-semibold text-white">Traffic Command</h1>
            </div>
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/70">Celebrating Smart Mobility</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">
              Intelligent Traffic <span className="text-cyan-300">Solutions</span>
            </h2>
            <p className="mt-3 text-cyan-100/80 text-lg">
              Imagination, optimization, and safer journeys for every city.
            </p>
          </div>
        </div>
        <div className="relative z-10 text-sm text-cyan-100/70">
          Real-time insights, predictive alerts, and adaptive signal control.
        </div>
      </section>

      <section className="relative flex items-center justify-center px-6 py-16">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${cityNightImage})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400/30 via-white/30 to-indigo-50/30 dark:from-slate-950/85 dark:via-slate-950/80 dark:to-slate-900/85"></div>
        </div>

        <div className="relative w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Link to="/">
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  ITMS
                </span>
              </h1>
            </Link>
            <p className="text-slate-800 dark:text-gray-300 text-lg">Let&apos;s get started</p>
            <p className="text-slate-800 dark:text-gray-400 text-sm">Sign in to your command center</p>
          </div>

          <div className="bg-gradient-to-br from-white/75 via-slate-50/50 to-indigo-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-8 border border-white/60 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 relative overflow-hidden text-slate-900 dark:text-slate-100 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="rounded-md border border-red-200/70 bg-red-50/70 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-10 rounded-md pl-10 pr-3 bg-white/90 dark:bg-black/50 border border-slate-300 dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                  <input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-10 rounded-md pl-10 pr-3 bg-white/90 dark:bg-black/50 border border-slate-300 dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-500/30 border-0 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing In..." : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/60 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-900 text-slate-800 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

          <div>
            <button
              type="button"
              onClick={() => {
                const url = buildGoogleAuthUrl({ mode: "login" });
                window.open(url, "_self");
              }}
              className="w-full h-10 rounded-full border border-slate-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 bg-white/70 dark:bg-black/30 flex items-center justify-center gap-2"
            >
              <FaGoogle className="w-4 h-4" />
              Google
            </button>
          </div>
          </div>

          <p className="text-center text-taupe-950 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-taupe hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}


