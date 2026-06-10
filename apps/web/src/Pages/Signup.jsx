import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Building, Eye, EyeOff, ShieldCheck, Activity, Cpu } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, buildGoogleAuthUrl } from "../lib/api";

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const oauthStatus = searchParams.get("oauth");
  const oauthMessage = useMemo(() => {
    if (!oauthStatus) return "";
    if (oauthStatus === "signup_required") {
      return "Choose your account type to finish Google sign up.";
    }
    if (oauthStatus === "missing_email") {
      return "We couldn't access your Google email. Please try again or use email sign up.";
    }
    if (oauthStatus === "failed") {
      return "Google sign up failed. Please try again.";
    }
    return "Google sign up needs a check. Please try again.";
  }, [oauthStatus]);

  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.role === "operator" && !formData.organization.trim()) {
      setError("Organization is required for operators.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/auth/signup", {
        method: "POST",
        body: {
          fullName: formData.fullName,
          organization: formData.organization,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-theme-bg font-inter text-theme-text-primary transition-colors duration-300">
      {/* Left panel: Promotional Smart City & AI visualization */}
      <section className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 overflow-hidden bg-theme-card/35 border-r border-theme-border/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--theme-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-theme-accent/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-theme-accent-alt/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        {/* Branding header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-tr from-theme-accent/15 to-theme-accent-alt/15 rounded-xl border border-theme-accent/20 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="signup-promo-logo-gradient" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--theme-accent)" />
                    <stop offset="100%" stopColor="var(--theme-accent-alt)" />
                  </linearGradient>
                </defs>
                <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#signup-promo-logo-gradient)" />
                <circle cx="32" cy="32" r="14" stroke="white" stroke-width="4" fill="none" />
              </svg>
            </div>
            <div>
              <span className="block text-xl font-poppins font-extrabold tracking-tight bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                ITMS
              </span>
              <p className="text-xs font-semibold text-theme-text-secondary uppercase tracking-widest">Command Center</p>
            </div>
          </Link>
        </div>

        {/* Live Mock Stats Panel */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-theme-accent/10 border border-theme-accent/20 rounded-full text-xs font-semibold text-theme-accent shadow-sm">
              <span className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-ping"></span>
              City-Wide Traffic Network
            </span>
            <h2 className="text-4xl font-poppins font-bold leading-tight text-theme-text-primary tracking-tight">
              Create Your <br />
              <span className="bg-gradient-to-r from-theme-accent via-theme-accent-alt/80 to-theme-accent-alt bg-clip-text text-transparent">
                Operator Account
              </span>
            </h2>
            <p className="text-theme-text-secondary text-base leading-relaxed max-w-sm">
              Join operators and citizens who use our analytics dashboard to optimize traffic signal timings and report incidents.
            </p>
          </div>

          <div className="space-y-3.5 max-w-sm">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-theme-card/40 border border-theme-border/30 backdrop-blur-md shadow-sm">
              <div className="p-2 bg-theme-success/10 rounded-lg text-theme-success border border-theme-success/15">
                <Activity size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">Connected Nodes</p>
                <p className="text-sm font-mono font-bold text-theme-text-primary">124 Intersections Active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-semibold text-theme-text-secondary/70 tracking-wider uppercase">
          Smart City Traffic Intelligence Platform
        </div>
      </section>

      {/* Right panel: Signup form */}
      <section className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--theme-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none"></div>

        <motion.div 
          className="relative w-full max-w-md space-y-8 z-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Small/Mid screen logo */}
          <div className="flex justify-center lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2.5 bg-gradient-to-tr from-theme-accent/15 to-theme-accent-alt/15 rounded-xl border border-theme-accent/20 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="signup-mobile-logo-gradient" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--theme-accent)" />
                      <stop offset="100%" stopColor="var(--theme-accent-alt)" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#signup-mobile-logo-gradient)" />
                  <circle cx="32" cy="32" r="14" stroke="white" stroke-width="4" fill="none" />
                </svg>
              </div>
              <div>
                <span className="block text-xl font-poppins font-extrabold tracking-tight bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                  ITMS
                </span>
                <p className="text-[10px] font-semibold text-theme-text-secondary uppercase tracking-widest">Command Center</p>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-poppins font-extrabold tracking-tight text-theme-text-primary">
              Create Account
            </h1>
            <p className="text-sm text-theme-text-secondary">
              Join the intelligent traffic management team
            </p>
          </div>

          {/* Form Card */}
          <div className="p-8 bg-theme-card/60 border border-theme-border/40 rounded-2xl shadow-xl shadow-theme-border/10 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-theme-accent/5 via-transparent to-theme-accent-alt/5 pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <AnimatePresence mode="wait">
                {oauthMessage && (
                  <motion.div 
                    className="p-3 rounded-xl border border-theme-border bg-theme-bg/50 text-xs font-medium text-theme-text-primary"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    {oauthMessage}
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    className="p-3.5 rounded-xl border border-theme-error/20 bg-theme-error/10 text-sm font-medium text-theme-error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Role Select Buttons */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Select User Role
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "user", organization: "" }))}
                    className={`h-11 rounded-xl border font-semibold text-sm transition-all ${
                      formData.role === "user"
                        ? "border-theme-accent bg-theme-accent/10 text-theme-accent shadow-sm"
                        : "border-theme-border bg-theme-bg/40 text-theme-text-secondary hover:bg-theme-card/85"
                    }`}
                  >
                    Normal User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "operator" }))}
                    className={`h-11 rounded-xl border font-semibold text-sm transition-all ${
                      formData.role === "operator"
                        ? "border-theme-accent bg-theme-accent/10 text-theme-accent shadow-sm"
                        : "border-theme-border bg-theme-bg/40 text-theme-text-secondary hover:bg-theme-card/85"
                    }`}
                  >
                    Ops Operator
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary/60" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-theme-border/60 bg-theme-bg/40 text-theme-text-primary placeholder:text-theme-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-theme-accent-focus focus:border-theme-accent transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {/* Organization */}
              {formData.role === "operator" && (
                <motion.div 
                  className="space-y-1.5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="organization" className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
                    Organization
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary/60" />
                    <input
                      id="organization"
                      type="text"
                      placeholder="e.g. Traffic Control Department"
                      value={formData.organization}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-theme-border/60 bg-theme-bg/40 text-theme-text-primary placeholder:text-theme-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-theme-accent-focus focus:border-theme-accent transition-all font-medium text-sm"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary/60" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-theme-border/60 bg-theme-bg/40 text-theme-text-primary placeholder:text-theme-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-theme-accent-focus focus:border-theme-accent transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary/60" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-theme-border/60 bg-theme-bg/40 text-theme-text-primary placeholder:text-theme-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-theme-accent-focus focus:border-theme-accent transition-all font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary/60" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-theme-border/60 bg-theme-bg/40 text-theme-text-primary placeholder:text-theme-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-theme-accent-focus focus:border-theme-accent transition-all font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme-border/40"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-theme-card text-theme-text-secondary/60 uppercase tracking-widest font-semibold">Or continue with</span>
              </div>
            </div>

            {/* Google Signup */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (formData.role === "operator" && !formData.organization.trim()) {
                    setError("Organization is required for operators.");
                    return;
                  }
                  const url = buildGoogleAuthUrl({
                    mode: "signup",
                    role: formData.role,
                    organization: formData.role === "operator" ? formData.organization.trim() : "",
                  });
                  window.open(url, "_self");
                }}
                className="w-full h-11 rounded-xl border border-theme-border/50 bg-theme-bg/25 text-theme-text-secondary hover:bg-theme-card/85 transition-all text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FaGoogle className="w-4 h-4 text-rose-500" />
                Sign up with Google
              </button>
            </div>
          </div>

          {/* Account swap link */}
          <p className="text-center text-sm text-theme-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="text-theme-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </section>
    </div>
  );
}
