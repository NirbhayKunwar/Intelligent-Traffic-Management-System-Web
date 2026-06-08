import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Building } from "lucide-react";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import { apiRequest } from "../lib/api";
import cityImage from "../assets/City.jpg";
import cityNightImage from "../assets/Citynight.jpg";

// Base URL for Google authentication, derived from environment variable or defaulting to localhost
const GOOGLE_AUTH_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");

// Helper function to build Google authentication URL with query parameters
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

// Main SignUp component
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
    return "Google sign up needs a quick check. Please try again.";
  }, [oauthStatus]);
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  // Error and loading state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Handle input changes
  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [id]: value,
    }));
  };
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Basic validation
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

    // Simulate API call
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

// Render the sign-up form with a split-screen design and conditional rendering based on form state
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
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/70">Join the Network</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">
              Build Smarter <span className="text-cyan-300">Cities</span>
            </h2>
            <p className="mt-3 text-cyan-100/80 text-lg">
              Centralize traffic intelligence and respond faster to incidents.
            </p>
          </div>
        </div>
        <div className="relative z-10 text-sm text-cyan-100/70">
          Secure access for city operators and transport teams.
        </div>
      </section>
{/* Sign-up form section with background image and gradient overlay, including form fields and Google OAuth option */}
      <section className="relative flex items-center justify-center px-6 py-16">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${cityNightImage})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400/30 via-white/30 to-indigo-50/30 dark:from-slate-950/85 dark:via-slate-950/80 dark:to-slate-900/85"></div>
        </div>
{/* Form container with conditional rendering for account type, error messages, and loading state */}
        <div className="relative w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Link to="/">
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  ITMS
                </span>
              </h1>
            </Link>
            <p className="text-slate-800 dark:text-gray-300 text-lg">Create your account</p>
            <p className="text-slate-800 dark:text-gray-400 text-sm">Start managing traffic smarter today</p>
          </div>
{/* Form container with conditional rendering for account type, error messages, and loading state */}
          <div className="bg-gradient-to-br from-white/75 via-slate-50/50 to-indigo-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-8 border border-white/60 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 relative overflow-hidden text-slate-900 dark:text-slate-100 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
{/* Sign-up form with fields for account type, full name, organization (for operators), email, password, and confirm password, along with error handling and loading state */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {oauthMessage && (
                <div className="rounded-md border border-cyan-200/70 bg-cyan-50/70 px-3 py-2 text-sm text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-200">
                  {oauthMessage}
                </div>
              )}
              {error && (
                <div className="rounded-md border border-red-200/70 bg-red-50/70 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <span className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                  Account Type
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "user", organization: "" }))
                    }
                    className={`h-10 rounded-full border text-sm font-semibold transition ${
                      formData.role === "user"
                        ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200"
                        : "border-slate-300 bg-white/80 text-slate-700 hover:bg-white dark:border-cyan-500/30 dark:bg-black/40 dark:text-gray-300 dark:hover:bg-black/60"
                    }`}
                  >
                    Normal User
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "operator" }))
                    }
                    className={`h-10 rounded-full border text-sm font-semibold transition ${
                      formData.role === "operator"
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-700 dark:text-purple-200"
                        : "border-slate-300 bg-white/80 text-slate-700 hover:bg-white dark:border-cyan-500/30 dark:bg-black/40 dark:text-gray-300 dark:hover:bg-black/60"
                    }`}
                  >
                    Operator
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-cyan-500/30 bg-white/90 dark:bg-black/50 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
                </div>
              </div>
{/* Conditionally render organization field if the selected role is operator */}
              {formData.role === "operator" && (
                <div className="space-y-2">
                  <label htmlFor="organization" className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                    Organization
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                    <input
                      id="organization"
                      type="text"
                      placeholder="City Transportation Department"
                      value={formData.organization}
                      onChange={handleChange}
                      required
                      className="w-full h-10 rounded-md border border-slate-300 dark:border-cyan-500/30 bg-white/90 dark:bg-black/50 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}
{/* Email, password, and confirm password fields with icons, placeholders, and validation */}
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
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-cyan-500/30 bg-white/90 dark:bg-black/50 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
                </div>
              </div>
{/* Password and confirm password fields with icons, placeholders, and validation */}
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
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-cyan-500/30 bg-white/90 dark:bg-black/50 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
                </div>
              </div>
{/* Confirm password field with validation to ensure it matches the password field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-cyan-500/30 bg-white/90 dark:bg-black/50 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
                </div>
              </div>
{/* Terms of Service and Privacy Policy agreement text with links to respective pages */}
              <p className="text-xs text-slate-800 dark:text-gray-400">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Privacy Policy
                </Link>
              </p>
{/* Submit button with loading state and disabled state when form is being submitted */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-500/30 border-0 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating..." : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
{/* Divider with "Or continue with" text for alternative sign-up options */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/60 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-900 text-slate-800 dark:text-gray-400">Or continue with</span>
              </div>
            </div>
{/* Google OAuth sign-up button with conditional logic to ensure organization is provided for operators, and opens the Google authentication URL in the same tab */}
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
                  organization:
                    formData.role === "operator" ? formData.organization.trim() : "",
                });
                window.open(url, "_self");
              }}
              className="w-full h-10 rounded-full border border-slate-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 bg-white/70 dark:bg-black/30 flex items-center justify-center gap-2"
            >
              <FaGoogle className="w-4 h-4" />
              Google
            </button>
          </div>
          </div>
{/* Link to sign in page for users who already have an account, with styling for hover and dark mode */}
          <p className="text-center text-taupe-950 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-taupe hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
