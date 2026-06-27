import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { CircleUser, Menu, X, Sun, Moon, Palette } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/api";
import { colorThemesList, applyTheme } from "../design-system/themesList";

export default function Navbar({ scrolled }) {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (mobileMenuIsOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [mobileMenuIsOpen]);

  useEffect(() => {
    if (mobileMenuIsOpen) {
      setTimeout(() => {
        const focusable = sidebarRef.current?.querySelectorAll(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 100);
    } else {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
  }, [mobileMenuIsOpen]);

  useEffect(() => {
    if (!mobileMenuIsOpen) return;
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileMenuIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [mobileMenuIsOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setMobileMenuIsOpen(false);
      return;
    }
    if (e.key === "Tab") {
      if (!sidebarRef.current) return;
      const focusable = sidebarRef.current.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  const [colorThemeMenuOpen, setColorThemeMenuOpen] = useState(false);
  const colorThemeMenuRef = useRef(null);
  const [colorTheme, setColorTheme] = useState(() => {
    if (typeof window === "undefined") return "sapphire-ocean";
    try {
      return localStorage.getItem("color-theme") || "sapphire-ocean";
    } catch {
      return "sapphire-ocean";
    }
  });

  const handleSelectColorTheme = (themeId) => {
    setColorTheme(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem("color-theme", themeId);
      applyTheme(themeId);
      window.dispatchEvent(new CustomEvent("color-theme-changed", { detail: themeId }));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleColorThemeChanged = (e) => {
      setColorTheme(e.detail);
    };
    window.addEventListener("color-theme-changed", handleColorThemeChanged);
    
    const handleClickOutside = (event) => {
      if (colorThemeMenuRef.current && !colorThemeMenuRef.current.contains(event.target)) {
        setColorThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("color-theme-changed", handleColorThemeChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    const handleSync = (e) => {
      if (e.detail) {
        setTheme(e.detail.theme);
        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setSystemPrefersDark(isSystemDark);
      }
    };

    window.addEventListener("sync-theme-state", handleSync);
    
    if (window.matchMedia) {
      setSystemPrefersDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    return () => {
      window.removeEventListener("sync-theme-state", handleSync);
    };
  }, []);

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
      navigate("/login", { replace: true });
    }
  };

  const isDarkMode = theme === "dark" || (theme === "system" && systemPrefersDark);

  const handleThemeToggle = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("theme", nextTheme);
        window.dispatchEvent(new CustomEvent("local-theme-changed"));
      } catch (e) {
        // Ignore
      }
    }
  };

  const isActiveLink = (hash) => location.pathname === "/" && location.hash === hash;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b font-inter ${
        scrolled
          ? "bg-theme-card/85 backdrop-blur-md border-theme-border shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-tr from-theme-accent/15 to-theme-accent-alt/15 rounded-xl border border-theme-accent/20 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="navbar-logo-gradient" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--theme-accent)" />
                      <stop offset="100%" stopColor="var(--theme-accent-alt)" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#navbar-logo-gradient)" />
                  <circle cx="32" cy="32" r="14" stroke="white" stroke-width="4" fill="none" />
                </svg>
              </div>
              <span className="text-xl font-poppins font-extrabold tracking-tight bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                ITMS
              </span>
            </Link>
          </div>

          {/* Center nav links */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <Link
              to="/#features"
              className={`text-sm font-semibold transition-colors ${
                isActiveLink("#features")
                  ? "text-theme-accent"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              Features
            </Link>
            <Link
              to="/#about"
              className={`text-sm font-semibold transition-colors ${
                isActiveLink("#about")
                  ? "text-theme-accent"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              About
            </Link>
            <Link
              to="/#benefits"
              className={`text-sm font-semibold transition-colors ${
                isActiveLink("#benefits")
                  ? "text-theme-accent"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              Benefits
            </Link>
            {authUser && (
              <Link
                to="/dashboard"
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === "/dashboard"
                    ? "text-theme-accent"
                    : "text-theme-text-secondary hover:text-theme-text-primary"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Actions for Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={handleThemeToggle}
                className="p-2 text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-card/50 transition duration-200"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Color Theme Selector Dropdown */}
              <div className="relative font-inter" ref={colorThemeMenuRef}>
                <button
                  onClick={() => setColorThemeMenuOpen(!colorThemeMenuOpen)}
                  className={`p-2 rounded-xl transition duration-200 ${
                    colorThemeMenuOpen
                      ? "text-theme-accent bg-theme-accent/10"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                  aria-label="Select color theme"
                >
                  <Palette size={18} />
                </button>
                
                <AnimatePresence>
                  {colorThemeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-72 max-h-[380px] overflow-y-auto p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl z-50 space-y-2 custom-scrollbar"
                    >
                      <div className="border-b border-slate-100 dark:border-white/5 pb-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Color Themes
                        </span>
                      </div>
                      <div className="space-y-1">
                        {colorThemesList.map((themeItem) => {
                          const isSelected = colorTheme === themeItem.id;
                          const colorsToShow = isDarkMode ? themeItem.previewColors.dark : themeItem.previewColors.light;
                          return (
                            <button
                              key={themeItem.id}
                              type="button"
                              onClick={() => {
                                handleSelectColorTheme(themeItem.id);
                                setColorThemeMenuOpen(false);
                              }}
                              className={`w-full p-2 rounded-xl text-left transition-all flex justify-between items-center ${
                                isSelected
                                  ? "bg-theme-accent/10 text-theme-accent font-bold"
                                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="text-xs font-semibold block truncate">
                                  {themeItem.name}
                                </span>
                              </div>
                              <div className="flex gap-0.5 items-center shrink-0">
                                {colorsToShow.map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shadow-sm"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {authUser ? (
                <>
                  <Link
                    to="/profile"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-theme-border bg-theme-bg/50 text-theme-text-primary hover:bg-theme-card backdrop-blur-sm transition duration-200 overflow-hidden"
                    aria-label="Profile"
                  >
                    {authUser?.profilePic ? (
                      <img
                        src={authUser.profilePic}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <CircleUser className="h-5 w-5 text-theme-text-secondary" />
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-9 px-4 rounded-xl border border-theme-border bg-theme-card text-theme-text-secondary text-sm font-semibold hover:bg-theme-card/85 transition duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-theme-text-secondary hover:text-theme-text-primary transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="h-9 inline-flex items-center justify-center px-4 rounded-xl bg-gradient-to-r from-theme-accent to-theme-accent-alt hover:brightness-110 text-white text-sm font-semibold shadow-sm transition duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              ref={triggerRef}
              type="button"
              className="lg:hidden p-2 text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-card/50 focus:outline-none focus:ring-0 focus-visible:outline-none"
              onClick={() => setMobileMenuIsOpen((prev) => !prev)}
              aria-label="Open menu"
              aria-expanded={mobileMenuIsOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Nav Links for Mobile Drawer rendered via React Portal */}
      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {mobileMenuIsOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setMobileMenuIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] lg:hidden pointer-events-auto"
                aria-hidden="true"
              />
              {/* Slide-in off-canvas drawer */}
              <motion.div
                ref={sidebarRef}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile Navigation"
                onKeyDown={handleKeyDown}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                className="fixed inset-y-0 right-0 w-[85vw] max-w-[320px] sm:max-w-[360px] bg-theme-bg border-l border-theme-border shadow-2xl z-[9999] lg:hidden flex flex-col h-full overflow-y-auto pointer-events-auto"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-theme-border">
                  <Link to="/" onClick={() => setMobileMenuIsOpen(false)} className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-tr from-theme-accent/15 to-theme-accent-alt/15 rounded-lg border border-theme-accent/20">
                      <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#navbar-logo-gradient)" />
                        <circle cx="32" cy="32" r="14" stroke="white" stroke-width="4" fill="none" />
                      </svg>
                    </div>
                    <span className="text-lg font-poppins font-extrabold tracking-tight bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                      ITMS
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-card/50 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-0 focus-visible:outline-none"
                    onClick={() => setMobileMenuIsOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Links */}
                <div className="px-6 py-6 space-y-6 flex-1">
                  <Link
                    to="/#features"
                    onClick={() => setMobileMenuIsOpen(false)}
                    className="block text-base font-semibold text-theme-text-secondary hover:text-theme-text-primary min-h-[44px] flex items-center"
                  >
                    Features
                  </Link>
                  <Link
                    to="/#about"
                    onClick={() => setMobileMenuIsOpen(false)}
                    className="block text-base font-semibold text-theme-text-secondary hover:text-theme-text-primary min-h-[44px] flex items-center"
                  >
                    About
                  </Link>
                  <Link
                    to="/#benefits"
                    onClick={() => setMobileMenuIsOpen(false)}
                    className="block text-base font-semibold text-theme-text-secondary hover:text-theme-text-primary min-h-[44px] flex items-center"
                  >
                    Benefits
                  </Link>

                  {/* Theme Toggle Mobile */}
                  <div className="flex items-center justify-between py-4 border-t border-theme-border">
                    <span className="text-sm font-semibold text-theme-text-secondary">Theme</span>
                    <button
                      onClick={handleThemeToggle}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-theme-border text-theme-text-secondary text-sm font-medium bg-theme-card/55 hover:bg-theme-card min-h-[44px]"
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

                  {/* Color Palette Mobile */}
                  <div className="py-4 border-t border-theme-border space-y-3">
                    <span className="text-sm font-semibold text-theme-text-secondary block">Color Theme</span>
                    <div className="flex flex-wrap gap-2">
                      {colorThemesList.map((themeItem) => {
                        const isSelected = colorTheme === themeItem.id;
                        const colorsToShow = isDarkMode ? themeItem.previewColors.dark : themeItem.previewColors.light;
                        return (
                          <button
                            key={themeItem.id}
                            type="button"
                            onClick={() => handleSelectColorTheme(themeItem.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all min-h-[44px] ${
                              isSelected
                                ? "border-theme-accent bg-theme-accent/10 text-theme-accent"
                                : "border-theme-border text-theme-text-secondary hover:bg-theme-card/50"
                            }`}
                          >
                            <span>{themeItem.name}</span>
                            <div className="flex gap-0.5 shrink-0">
                              {colorsToShow.map((c, i) => (
                                <span
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full border border-black/10 dark:border-white/10"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {authUser ? (
                    <div className="space-y-4 pt-4 border-t border-theme-border">
                      <Link
                        to="/dashboard"
                        className="block text-base font-semibold text-theme-text-secondary hover:text-theme-text-primary min-h-[44px] flex items-center"
                        onClick={() => setMobileMenuIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block text-base font-semibold text-theme-text-secondary hover:text-theme-text-primary min-h-[44px] flex items-center"
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
                        className="w-full h-11 rounded-xl border border-theme-border text-theme-text-secondary text-sm font-semibold hover:bg-theme-card/80 transition duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-theme-border">
                      <Link
                        to="/login"
                        className="h-11 inline-flex items-center justify-center rounded-xl border border-theme-border text-theme-text-secondary text-sm font-semibold bg-theme-card/50 hover:bg-theme-card"
                        onClick={() => setMobileMenuIsOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="h-11 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-theme-accent to-theme-accent-alt text-white text-sm font-semibold shadow-sm hover:brightness-110"
                        onClick={() => setMobileMenuIsOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </nav>
  );
}
