import { useEffect, useState } from "react";
import { CircleUser, Menu, X, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/api";

export default function Navbar({ scrolled }) {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "system";
    try {
      return localStorage.getItem("theme") || "system";
    } catch {
      return "system";
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const applyTheme = () => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", systemDark);
      }
    };
    applyTheme();

    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      setSystemPrefersDark(media.matches);
      if (theme === "system") {
        applyTheme();
      }
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const data = await apiRequest("/api/auth/me");
        if (!active) return;
        setAuthUser(data.user);
      } catch {
        if (!active) return;
        setAuthUser(null);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleProfileUpdate = (event) => {
      const nextUrl = event?.detail;
      if (!nextUrl) return;
      setAuthUser((prev) => (prev ? { ...prev, profilePic: nextUrl } : prev));
    };
    window.addEventListener("profile-pic-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-pic-updated", handleProfileUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setAuthUser(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const isDarkMode = theme === "dark" || (theme === "system" && systemPrefersDark);

  const isActiveLink = (hash) => location.pathname === "/" && location.hash === hash;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b font-inter ${
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-slate-200/50 dark:border-white/5 shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-tr from-cyan-500/15 to-indigo-500/15 rounded-xl border border-cyan-500/20 dark:border-cyan-500/10 group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/logo.svg"
                  alt="itms logo"
                  className="w-6 h-6"
                  onError={(event) => {
                    event.currentTarget.src = "/favicon.svg";
                  }}
                />
              </div>
              <span className="text-xl font-poppins font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
                ITMS
              </span>
            </Link>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-8">
            <Link
              to="/#features"
              className={`text-sm font-semibold transition-colors ${
                isActiveLink("#features")
                  ? "text-cyan-600 dark:text-cyan-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              Features
            </Link>
            <Link
              to="/#about"
              className={`text-sm font-semibold transition-colors ${
                isActiveLink("#about")
                  ? "text-cyan-600 dark:text-cyan-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              About
            </Link>
            <Link
              to="/#benefits"
              className={`text-sm font-semibold transition-colors ${
                isActiveLink("#benefits")
                  ? "text-cyan-600 dark:text-cyan-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              Benefits
            </Link>
            {authUser && (
              <Link
                to="/dashboard"
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === "/dashboard"
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Actions for Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition duration-200"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {authUser ? (
                <>
                  <Link
                    to="/profile"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 backdrop-blur-sm transition duration-200 overflow-hidden"
                    aria-label="Profile"
                  >
                    {authUser?.profilePic ? (
                      <img
                        src={authUser.profilePic}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <CircleUser className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="h-9 inline-flex items-center justify-center px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-sm transition duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={() => setMobileMenuIsOpen((prev) => !prev)}
              aria-label={mobileMenuIsOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuIsOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Nav Links for Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuIsOpen && (
          <motion.div
            className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-white/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-4 py-6 space-y-4">
              <Link
                to="/#features"
                onClick={() => setMobileMenuIsOpen(false)}
                className="block text-base font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Features
              </Link>
              <Link
                to="/#about"
                onClick={() => setMobileMenuIsOpen(false)}
                className="block text-base font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                About
              </Link>
              <Link
                to="/#benefits"
                onClick={() => setMobileMenuIsOpen(false)}
                className="block text-base font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Benefits
              </Link>

              {/* Theme Toggle Mobile */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-white/5">
                <span className="text-sm font-semibold text-slate-500">Theme</span>
                <button
                  onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={15} /> Light
                    </>
                  ) : (
                    <>
                      <Moon size={15} /> Dark
                    </>
                  )}
                </button>
              </div>

              {authUser ? (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                  <Link
                    to="/dashboard"
                    className="block text-base font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    onClick={() => setMobileMenuIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block text-base font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    onClick={() => setMobileMenuIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuIsOpen(false);
                    }}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                  <Link
                    to="/login"
                    className="h-10 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold"
                    onClick={() => setMobileMenuIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="h-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-sm font-semibold shadow-sm"
                    onClick={() => setMobileMenuIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
