import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, Lock, Key } from "lucide-react";
import { apiRequest } from "../lib/api";
import cityNightImage from "../assets/Citynight.jpg";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevOtp("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMessage(data.message || "If an account exists for this email, an OTP has been sent.");
      if (data.otp) {
        setDevOtp(data.otp);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || "Could not send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/reset-password-otp", {
        method: "POST",
        body: { email, otp, password },
      });
      setMessage(data.message || "Password has been reset successfully. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
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
          <p className="text-sm text-slate-300">
            {step === 1
              ? "Enter your account email to receive a secure OTP code."
              : "Enter the OTP code sent to your email and your new password."}
          </p>
        </div>
        {/* Form Container */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none"></div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="relative z-10 space-y-6">
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
                {loading ? "Sending..." : "Send OTP Code"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="relative z-10 space-y-5">
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

              {devOtp && (
                <div className="rounded-md border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-sm text-cyan-100 break-words">
                  <span className="block font-medium">Development OTP Code</span>
                  <span className="mt-1 block font-mono text-lg font-bold tracking-wider text-cyan-300">
                    {devOtp}
                  </span>
                </div>
              )}

              {/* OTP Field */}
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-sm font-medium text-cyan-300">
                  Verification OTP Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    required
                    maxLength={6}
                    className="h-10 w-full rounded-md border border-cyan-500/30 bg-black/40 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 tracking-wider font-bold"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm font-medium text-cyan-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                  <input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-10 w-full rounded-md border border-cyan-500/30 bg-black/40 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-sm font-medium text-cyan-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="h-10 w-full rounded-md border border-cyan-500/30 bg-black/40 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-10 rounded-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-full border-0 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 text-xs font-semibold"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </form>
          )}
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
