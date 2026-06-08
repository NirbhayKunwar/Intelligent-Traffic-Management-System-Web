import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Activity, Cpu } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/api";

function buildGoogleAuthUrl(params) {
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const url = new URL(`${base}/auth/google`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
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
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-inter text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Left panel: Promotional Smart City & AI visualization */}
      <section className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 overflow-hidden bg-slate-900 border-r border-white/5">
        {/* Futuristic glowing grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        {/* Branding header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-xl border border-white/10 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo.svg"
                alt="ITMS logo"
                className="h-7 w-7"
                onError={(event) => {
                  event.currentTarget.src = "/favicon.svg";
                }}
              />
            </div>
            <div>
              <span className="block text-xl font-poppins font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                ITMS
              </span>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Command Center</p>
            </div>
          </Link>
        </div>

        {/* Live Mock Stats Panel */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/25 rounded-full text-xs font-semibold text-cyan-400 shadow-sm">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
              Live Smart Grid Online
            </span>
            <h2 className="text-4xl font-poppins font-bold leading-tight text-white tracking-tight">
              AI-Powered <br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">
                Traffic Operations
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Stream live video feeds, verify physical accident risk factors, and monitor city congestion metrics.
            </p>
          </div>

          {/* Floating Glassmorphic Stat Tickers */}
          <div className="space-y-3.5 max-w-sm">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-sm">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/15">
                <Activity size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flow Efficiency</p>
                <p className="text-sm font-mono font-bold text-white">94.8% Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-sm">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/15">
                <Cpu size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Inference Load</p>
                <p className="text-sm font-mono font-bold text-white">45 FPS / Core Node</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Department of Transportation Platform
        </div>
      </section>

      {/* Right panel: Login form */}
      <section className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        {/* Subtle grid layout fallback for light mode background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none"></div>

        <motion.div 
          className="relative w-full max-w-md space-y-8 z-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-poppins font-extrabold tracking-tight">
              Access Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to your Traffic Command Operations Console
            </p>
          </div>

          {/* Form Card */}
          <div className="p-8 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-black/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
            
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/80" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/80" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-cyan-500/10 flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 uppercase tracking-widest font-semibold">Or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <div>
              <button
                type="button"
                onClick={() => {
                  const url = buildGoogleAuthUrl({ mode: "login" });
                  window.open(url, "_self");
                }}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/20 dark:bg-black/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FaGoogle className="w-4 h-4 text-rose-500" />
                Sign in with Google
              </button>
            </div>
          </div>

          {/* Account swap link */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </section>
    </div>
  );
}