
import { useEffect, useState } from "react";
import { CircleUser, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../lib/api";


export default function Navbar({scrolled}) {
  // State for mobile menu, authenticated user, theme, and system dark mode preference
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const location = useLocation();

  // Theme state management with system preference fallback
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    // Try to read theme from localStorage, fallback to system if not available or on error
    try {
      return localStorage.getItem("theme") || "system";
    } catch {
      return "system";
    }
  });

  // State to track if the system prefers dark mode
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    // Check if the system prefers dark mode  
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Effect to apply theme and listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    // Apply the selected theme to the document root
    const root = document.documentElement;
    // Function to apply the current theme based on user selection and system preference
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
    // Initial application of the theme on component mount and whenever theme or system preference changes
    applyTheme();

    // Listen for changes in system color scheme preference and update state accordingly
    if (!window.matchMedia) {
      return;
    }
    // Set up a media query listener for changes in the system's color scheme preference
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    // Listener function to update system preference state and re-apply theme if user preference is "system"
    const listener = () => {
      setSystemPrefersDark(media.matches);
      if (theme === "system") {
        applyTheme();
      }
    };
    // Add the listener to the media query
    media.addEventListener("change", listener);
    // Clean up the listener on component unmount
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [theme]);
  // Effect to load authenticated user profile on component mount and when the route changes
  useEffect(() => {
    let active = true;
    // Function to load the authenticated user's profile from the API
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
    // Load the user profile when the component mounts and whenever the route changes
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
  // Function to handle user logout by calling the API and clearing local authentication state
  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors and still clear local auth state.
    }
    // Clear the authenticated user state and reload the page to reset the app state
    setAuthUser(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Effect to save the user's theme preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    // Try to save the theme preference to localStorage, but ignore errors (e.g., in private mode or if storage is blocked)
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  }, [theme]);
  // Determine if dark mode should be active based on user preference and system settings
  const isDarkMode = theme === "dark" || (theme === "system" && systemPrefersDark);
    return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-gradient-to-r from-blue-800/25 via-violet-800/25 to-indigo-900/30 dark:bg-slate-950 dark:bg-transparent backdrop-blur-md border-white/10 dark:border-white/5"
          : "bg-gradient-to-r from-blue-800/15 via-violet-800/15 to-indigo-900/20 dark:bg-slate-950/20 dark:bg-transparent backdrop-blur-sm border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center space-x-1 group">
              <div>
                <img
                  src="/logo.svg"
                  alt="itms logo"
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  onError={(event) => {
                    event.currentTarget.src = "/favicon.svg";
                  }}
                />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-semibold bg-gradient-to-r from-sky-600 to-purple-500 bg-clip-text text-transparent">
                ITMS
              </span>
            </Link>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
            <Link
              to="/#features"
              className="text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base lg:text-lg"
            >
              Features
            </Link>
            <Link
              to="/#about"
              className="text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base lg:text-lg"
            >
              About
            </Link>
            <Link
              to="/#benefits"
              className="text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base lg:text-lg"
            >
              Benefits
            </Link>
            {authUser && (
              <Link
                to="/dashboard"
                className="text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base lg:text-lg"
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Login and signup */}
            <div className="hidden md:flex items-center gap-4">
             
              <div
                onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300
                  ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
                aria-label={`Theme: ${isDarkMode ? "dark" : "light"}`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 flex items-center justify-center
                    ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}
                >
                </div>
              </div>
              {/* Show profile link and logout button if authenticated, otherwise show login and signup links */}
              {authUser ? (
                <>
                  <Link
                    to="/profile"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/20 bg-white/40 text-slate-950 hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 backdrop-blur-sm"
                    aria-label="Profile"
                  >
                    {authUser?.profilePic ? (
                      <img
                        src={authUser.profilePic}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <CircleUser className="h-5 w-5" />
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-blue-500/25 via-violet-500/25 to-indigo-600/30 text-white px-4 py-2 rounded-md backdrop-blur-sm border border-white/20 transition hover:from-blue-500/50 hover:via-violet-500/50 hover:to-indigo-600/55 hover:text-white dark:bg-gradient-to-r dark:from-blue-500/35 dark:via-violet-500/35 dark:to-indigo-600/40 dark:border-white/10 dark:hover:from-blue-500/60 dark:hover:via-violet-500/60 dark:hover:to-indigo-600/65"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-950/90 hover:text-slate-950 dark:text-blue-400 dark:hover:text-blue-300">
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-blue-500/25 via-violet-500/25 to-indigo-600/30 text-white px-4 py-2 rounded-md backdrop-blur-sm border border-white/20 transition hover:from-blue-500/50 hover:via-violet-500/50 hover:to-indigo-600/55 hover:text-white dark:bg-gradient-to-r dark:from-blue-500/35 dark:via-violet-500/35 dark:to-indigo-600/40 dark:border-white/10 dark:hover:from-blue-500/60 dark:hover:via-violet-500/60 dark:hover:to-indigo-600/65"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
              {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-white/90 hover:text-white dark:text-gray-300 dark:hover:text-white"
              onClick={() => setMobileMenuIsOpen((prev) => !prev)}
              aria-label={mobileMenuIsOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuIsOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/*Nav Links for mobile*/}
      {mobileMenuIsOpen && (
        <div className="md:hidden bg-gradient-to-r from-blue-800/60 via-violet-800/60 to-indigo-900/65 dark:bg-slate-900/95 backdrop-blur-lg border-t border-white/10 dark:border-white/5 animate-in slide-in-from-top duration-300">
          <div className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            <Link
              to="/#features"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base"
            >
              Features
            </Link>
            <Link
              to="/#about"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base"
            >
              About
            </Link>
            <Link
              to="/#benefits"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-slate-950/90 hover:text-slate-950 dark:text-gray-300 dark:hover:text-white text-base"
            >
              Benefits
            </Link>
            {/* Show dashboard link if authenticated */}
              <div
                onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300
                  ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
                aria-label={`Theme: ${isDarkMode ? "dark" : "light"}`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 flex items-center justify-center
                    ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}
                >
                </div>
              </div>
            {/* Show profile link and logout button if authenticated, otherwise show login and signup links */}
            {authUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-slate-950/90 hover:text-slate-950 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setMobileMenuIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block text-slate-950/90 hover:text-slate-950 dark:text-blue-400 dark:hover:text-blue-300"
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
                  className="block text-left bg-gradient-to-r from-blue-500/25 via-violet-500/25 to-indigo-600/30 text-white px-4 py-2 rounded-md backdrop-blur-sm border border-white/20 transition hover:from-blue-500/50 hover:via-violet-500/50 hover:to-indigo-600/55 hover:text-white dark:bg-gradient-to-r dark:from-blue-500/35 dark:via-violet-500/35 dark:to-indigo-600/40 dark:border-white/10 dark:hover:from-blue-500/60 dark:hover:via-violet-500/60 dark:hover:to-indigo-600/65"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-slate-950/90 hover:text-slate-950 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setMobileMenuIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block text-white/90 hover:text-white dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setMobileMenuIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    );
}
