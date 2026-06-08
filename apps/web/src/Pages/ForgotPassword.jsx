import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { apiRequest } from "../lib/api";
import cityNightImage from "../assets/Citynight.jpg";

export default function ForgotPassword() {
  // State variables for form input, error messages, success messages, and loading state
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMessage(data.message || "If an account exists for this email, a password reset link has been sent.");
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err) {
      setError(err.message || "Could not send password reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-16 bg-slate-950 text-slate-100">
      {/* Background Image and Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityNightImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-cyan-950/75"></div>
      </div>
{/* Content Container */}
      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                ITMS
              </span>
            </h1>
          </Link>
          <p className="text-lg text-slate-100">Reset your password</p>
          <p className="text-sm text-slate-300">Enter your account email to receive a secure reset link.</p>
        </div>
{/* Form Container */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
                {message}
              </div>
            )}

            {resetLink && (
              <div className="rounded-md border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-sm text-cyan-100 break-words">
                <span className="block font-medium">Development reset link</span>
                <Link to={new URL(resetLink).pathname} className="mt-1 block text-cyan-300 hover:text-cyan-200">
                  {resetLink}
                </Link>
              </div>
            )}
{/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-cyan-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-cyan-500/30 bg-black/40 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
            </div>
{/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Reset Link"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
{/* Back to Sign In Link */}
        <Link
          to="/login"
          className="mx-auto flex w-fit items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
