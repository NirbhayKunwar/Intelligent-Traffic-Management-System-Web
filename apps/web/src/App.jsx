import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Features from "./Components/Features";
import About from "./Components/About";
import Benefits from "./Components/Benefits";
import GTS from "./Components/GTS";
import Footer from "./Components/Footer";
import QuickThemeWidget from "./Components/QuickThemeWidget";
import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { applyTheme } from "./design-system/themesList";

const Login = lazy(() => import("./Pages/Login"));
const SignUp = lazy(() => import("./Pages/Signup"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword"));
const VerifyOtp = lazy(() => import("./Pages/VerifyOtp"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));
const Terms = lazy(() => import("./Pages/Terms"));
const Privacy = lazy(() => import("./Pages/Privacy"));
const Security = lazy(() => import("./Pages/Security"));
const Compliance = lazy(() => import("./Pages/Compliance"));
const Profile = lazy(() => import("./Pages/Profile"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const CaseStudy = lazy(() => import("./Pages/CaseStudy"));

// The App component is the main entry point of the application, responsible for rendering the overall layout and managing the scroll state for the Navbar. It uses React Router for client-side routing, allowing users to navigate between different pages of the application without a full page reload. The AppShell component is used to render the main layout of the application, including the Navbar and the different pages based on the current route. The ScrollToHash component is responsible for scrolling to the appropriate section of the page when navigating to a route with a hash, ensuring a smooth user experience when accessing specific sections of the content. The scroll listener in the App component updates the scrolled state based on the user's scroll position, which can be used to apply different styles to the Navbar when scrolled.
function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const id = location.hash.slice(1);
    const element = document.getElementById(id);
    if (!element) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash, location.pathname]);

  return null;
}
// The AppShell component is responsible for rendering the main layout of the application, including the Navbar and the different pages based on the current route. It uses the useLocation hook to access the current location object, which contains information about the current URL. The hideNavbar and hideFooter variables are set to true if the current pathname is either "/login" or "/signup", which is used to conditionally render the Navbar and Footer components, hiding them on the login and signup pages for a cleaner user interface. The Routes component defines the different routes of the application, rendering the appropriate components based on the current path. The login and signup routes are defined to ensure that the Navbar is hidden on these pages, while still allowing the scroll listener to function properly, providing a consistent user experience across all pages of the application.
function AppShell({ scrolled }) {
  const location = useLocation();
  const authPagePaths = ["/login", "/signup", "/forgot-password", "/verify-otp", "/reset-password"];
  const hideNavbar = authPagePaths.includes(location.pathname);
  const hideFooter = authPagePaths.includes(location.pathname);
// The Routes component defines the different routes of the application, rendering the appropriate components based on the current path. The login and signup routes are defined to ensure that the Navbar is hidden on these pages, while still allowing the scroll listener to function properly, providing a consistent user experience across all pages of the application.
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text-primary transition duration-300">
      {!hideNavbar && <Navbar scrolled={scrolled} />}

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<>
            <Hero />
            <Features />
            <About />
            <Benefits />
            <GTS />          
          </>} /> 
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/case-study" element={<CaseStudy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {!hideFooter && <Footer />}
      <QuickThemeWidget />
    </div>
  );
}

function App() {
  const [scrolled, setScrolled] = useState(false);
// The scroll listener is added in the App component to ensure that it is active on all pages, including the login and signup pages. This allows the Navbar to change its appearance based on the scroll position, even on pages where the Navbar is hidden. The scroll listener updates the scrolled state whenever the user scrolls more than 50 pixels down the page, which can be used to apply different styles to the Navbar when scrolled.
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("color-theme") || "original";
      applyTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyGlobalTheme = () => {
      const theme = localStorage.getItem("theme") || "system";
      const root = document.documentElement;
      
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "light") {
        isDark = false;
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      window.dispatchEvent(new CustomEvent("sync-theme-state", { 
        detail: { theme, isDark } 
      }));
    };

    applyGlobalTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const theme = localStorage.getItem("theme") || "system";
      if (theme === "system") {
        applyGlobalTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    window.addEventListener("local-theme-changed", applyGlobalTheme);

    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        applyGlobalTheme();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener("local-theme-changed", applyGlobalTheme);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

// The Router is placed in the App component to ensure that the ScrollToHash component can access the location and scroll to the correct section on page load or when navigating to a different route with a hash. The AppShell component is responsible for rendering the main layout of the application, including the Navbar and the different pages based on the current route. By placing the Router in the App component, we ensure that the routing and scroll behavior work seamlessly across all pages of the application.
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToHash />
      <AppShell scrolled={scrolled} />
    </Router>
  );
}

export default App;
