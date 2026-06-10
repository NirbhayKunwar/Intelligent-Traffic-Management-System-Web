import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";
import cityNightImage from "../assets/Citynight.jpg";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(() => location.state?.devOtp || "");
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Countdown timer: 10 minutes (600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerActive, setTimerActive] = useState(true);

  // Focus refs for inputs
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      setError("No email address provided. Please return to the Forgot Password page.");
      setTimerActive(false);
    }
  }, [email]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) {
      if (timeLeft === 0) setTimerActive(false);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, timerActive]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleInputChange = (index, value) => {
    // Only allow numeric input
    const cleanValue = value.replace(/\D/g, "").slice(-1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleanValue;
    setOtpValues(newOtpValues);
    setError("");

    // Auto-focus next field
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Navigate backwards on Backspace if empty
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 0) return;

    const newOtpValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtpValues[i] = pastedData[i] || "";
    }
    setOtpValues(newOtpValues);
    setError("");

    // Focus on last filled cell or last cell
    const targetFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[targetFocusIndex]?.focus();
  };

  const handleResendOtp = async () => {
    if (timeLeft > 0 && timerActive) return; // Prevent premature resends
    
    setError("");
    setMessage("");
    setDevOtp("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMessage(data.message || "OTP resent successfully. Check your inbox.");
      if (data.otp) {
        setDevOtp(data.otp);
      }
      setTimeLeft(600);
      setTimerActive(true);
      setAttemptsLeft(5);
      setOtpValues(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Could not resend OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const fullOtp = otpValues.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new verification code.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email, otp: fullOtp },
      });
      
      // Successfully verified. Redirect to reset password page carrying token in state
      navigate("/reset-password", {
        state: { resetToken: data.resetToken }
      });
    } catch (err) {
      const errMsg = err.message || "Invalid verification code.";
      setError(errMsg);
      
      // Parse remaining attempts from error message if possible
      const match = errMsg.match(/(\d+) attempts? remaining/i);
      if (match) {
        const remaining = parseInt(match[1], 10);
        setAttemptsLeft(remaining);
      } else if (errMsg.includes("Maximum verification attempts exceeded")) {
        setAttemptsLeft(0);
      }
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/85 to-emerald-950/70"></div>
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-sky-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                ITMS
              </span>
            </h1>
          </Link>
          <p className="text-lg text-slate-100 font-semibold tracking-wide">Enter Security Code</p>
          <p className="text-sm text-slate-400">
            We sent a 6-digit verification code to <span className="text-emerald-400 font-medium">{email}</span>.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950/90 p-8 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
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

            {devOtp && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-3 text-xs text-cyan-200 break-words font-medium">
                <span className="block text-[10px] text-cyan-400 uppercase font-bold tracking-wider">Dev Simulation OTP</span>
                <span className="mt-1 block font-mono text-xl font-extrabold tracking-widest text-cyan-300">
                  {devOtp}
                </span>
              </div>
            )}

            {/* 6-digit OTP Inputs */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Code</span>
                <span className={`text-xs font-semibold ${timeLeft <= 60 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                  Expires in {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
                {otpValues.map((value, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={value}
                    disabled={attemptsLeft <= 0 || timeLeft <= 0 || loading}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 rounded-xl border border-emerald-500/25 bg-black/40 text-center text-xl font-bold text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-40 disabled:cursor-not-allowed transition duration-200"
                    placeholder="•"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {attemptsLeft > 0 && attemptsLeft < 5 && (
              <p className="text-[11px] font-bold text-amber-400 text-center">
                ⚠️ Warning: {attemptsLeft} attempts remaining. Incorrect codes will lock the request.
              </p>
            )}

            {attemptsLeft === 0 && (
              <p className="text-[11px] font-bold text-rose-500 text-center">
                ❌ Too many failed attempts. Please resend or request a new code.
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || attemptsLeft <= 0 || timeLeft <= 0}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 transition duration-200"
            >
              {loading ? "Verifying..." : "Verify Code"}
              <ArrowRight size={16} />
            </button>

            {/* Resend OTP area */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Didn't receive code? </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || (timeLeft > 0 && timerActive)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-emerald-400 transition-colors focus:outline-none"
              >
                {timeLeft > 0 && timerActive ? `Resend in ${formatTime(timeLeft)}` : "Resend OTP"}
              </button>
            </div>
          </form>
        </div>

        {/* Back Link */}
        <Link
          to="/forgot-password"
          className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Change Email Address
        </Link>
      </div>
    </div>
  );
}
