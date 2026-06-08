import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { apiRequest } from "../lib/api";
import cityNightImage from "../assets/Citynight.jpg";

export default function ResetPassword() {
  // Get the token from the URL parameters
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

//   const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Password reset link is missing a token.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
      });
      setMessage("Password reset successfully. Redirecting to sign in...");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Could not reset password.");
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-indigo-950/75"></div>
      </div>
{/* Content Container */}
      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                ITMS
              </span>
            </h1>
          </Link>
          <p className="text-lg text-slate-100">Create a new password</p>
          <p className="text-sm text-slate-300">Use a strong password to protect your account.</p>
        </div>
{/* Form Container */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/10 pointer-events-none"></div>

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
{/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-cyan-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                <input
                  id="newPassword"
                  type="password"
                  placeholder="********"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-cyan-500/30 bg-black/40 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
            </div>
{/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-cyan-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-cyan-500/30 bg-black/40 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
            </div>
{/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
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
