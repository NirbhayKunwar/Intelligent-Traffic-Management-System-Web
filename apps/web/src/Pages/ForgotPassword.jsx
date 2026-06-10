import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { apiRequest } from "../lib/api";
import cityNightImage from "../assets/Citynight.jpg";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      
      // Navigate to verify-otp page, passing devOtp if provided (in dev environment)
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
        state: { devOtp: data.otp }
      });
    } catch (err) {
      setError(err.message || "Could not send OTP code. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-16 bg-slate-950 text-slate-100 font-inter">
      {/* Background Image and Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityNightImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/85 to-cyan-950/75"></div>
      </div>
      
      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                ITMS
              </span>
            </h1>
          </Link>
          <p className="text-lg text-slate-100 font-semibold tracking-wide">Recover Password</p>
          <p className="text-sm text-slate-400">
            Enter your account email to receive a secure 6-digit verification code.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>

          <form onSubmit={handleRequestOtp} className="relative z-10 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-2.5 text-xs text-red-200 font-medium">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-200 font-medium">
                {message}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/40" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-cyan-500/25 bg-black/40 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 transition duration-200"
            >
              {loading ? "Sending..." : "Send Verification OTP"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Back to Sign In Link */}
        <Link
          to="/login"
          className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
