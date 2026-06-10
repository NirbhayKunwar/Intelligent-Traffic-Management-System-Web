import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { apiRequest } from "../lib/api";
import cityNightImage from "../assets/Citynight.jpg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve resetToken from router state (passed securely from verify-otp) or fallback query parameter
  const resetToken = location.state?.resetToken || searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Validation Checks
  const checks = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[@$!%*?&]/.test(newPassword),
    };
  }, [newPassword]);

  const passwordStrength = useMemo(() => {
    const score = Object.values(checks).filter(Boolean).length;
    let label = "Very Weak";
    let color = "bg-rose-500";
    let textColor = "text-rose-400";
    
    if (score === 5) {
      label = "Strong & Secure";
      color = "bg-emerald-500";
      textColor = "text-emerald-400";
    } else if (score >= 4) {
      label = "Good";
      color = "bg-teal-500";
      textColor = "text-teal-400";
    } else if (score >= 3) {
      label = "Fair";
      color = "bg-amber-500";
      textColor = "text-amber-400";
    } else if (score >= 2) {
      label = "Weak";
      color = "bg-orange-500";
      textColor = "text-orange-400";
    }
    return { score, label, color, textColor };
  }, [checks]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!resetToken) {
      setError("Verification reset token is missing. Please start over from Forgot Password.");
      return;
    }

    // Enforce strength requirements
    const isStrong = Object.values(checks).every(Boolean);
    if (!isStrong) {
      setError("Please satisfy all password complexity requirements.");
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
        body: { resetToken, newPassword },
      });
      
      setMessage("Password reset successfully! Redirecting to login...");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  const renderRequirement = (label, met) => (
    <div className="flex items-center gap-2 text-xs font-semibold">
      {met ? (
        <Check size={14} className="text-emerald-400 shrink-0" />
      ) : (
        <X size={14} className="text-slate-600 shrink-0" />
      )}
      <span className={met ? "text-slate-300" : "text-slate-500"}>{label}</span>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-16 bg-slate-950 text-slate-100 font-inter">
      {/* Background Image and Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityNightImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/85 to-indigo-950/70"></div>
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                ITMS
              </span>
            </h1>
          </Link>
          <p className="text-lg text-slate-100 font-semibold tracking-wide">Choose New Password</p>
          <p className="text-sm text-slate-400">Set a strong and secure password for your account.</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-slate-950/90 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

          {!resetToken ? (
            <div className="relative z-10 space-y-4 text-center">
              <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-xs text-red-200 font-medium">
                Invalid session. Please recover your account via email verification.
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex h-10 items-center justify-center px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg transition duration-200"
              >
                Go to Forgot Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
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

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400/40" />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-indigo-500/25 bg-black/40 pl-11 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Real-time Validation Checks List */}
              {newPassword && (
                <div className="p-3.5 rounded-xl border border-indigo-500/10 bg-black/20 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400 uppercase tracking-wide">Strength</span>
                    <span className={passwordStrength.textColor}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-slate-800">
                    {renderRequirement("Minimum 8 characters", checks.minLength)}
                    {renderRequirement("One uppercase letter", checks.hasUpper)}
                    {renderRequirement("One lowercase letter", checks.hasLower)}
                    {renderRequirement("One numeric digit", checks.hasNumber)}
                    {renderRequirement("One special symbol", checks.hasSpecial)}
                  </div>
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400/40" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-indigo-500/25 bg-black/40 pl-11 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || Object.values(checks).some(met => !met)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-indigo-500 to-cyan-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 transition duration-200"
              >
                {loading ? "Resetting..." : "Reset Password"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>

        {/* Back Link */}
        <Link
          to="/login"
          className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
