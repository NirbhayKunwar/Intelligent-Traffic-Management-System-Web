import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Features from "./Components/Features";
import About from "./Components/About";
import Benefits from "./Components/Benefits";
import GTS from "./Components/GTS";
import Footer from "./Components/Footer";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./Pages/Login";
import SignUp from "./Pages/Signup";
import Terms from "./Pages/Terms";
import Privacy from "./Pages/Privacy";
import Security from "./Pages/Security";
import Compliance from "./Pages/Compliance";
import Profile from "./Pages/Profile";
import Dashboard from "./Pages/Dashboard";
import CaseStudy from "./Pages/CaseStudy";

// The ScrollToHash component is responsible for scrolling to the appropriate section of the page when a URL with a hash is accessed. 
// It uses the useLocation hook from react-router-dom to access the current location and checks if there is a hash in the URL. 
// If there is a hash, it extracts the ID from the hash and attempts to find the corresponding element on the page. 
// If the element exists, it scrolls to that element smoothly using the scrollIntoView method. 
// This component ensures that users are taken to the correct section of the page when they navigate to a URL with a hash, enhancing the user experience by providing smooth scrolling behavior.
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
// The AppShell component is responsible for rendering the main layout of the application, including the Navbar and the different pages based on the current route. 
// It uses the useLocation hook from react-router-dom to determine the current path and conditionally hide the Navbar on the login and signup pages. 
// The Routes component defines the different routes for the application, rendering the appropriate components based on the URL path. 
// This structure allows for a clean separation of concerns, with AppShell handling the layout and routing, while App manages the scroll state and overall application structure. 
// By placing the Router in the App component, we ensure that the routing and scroll behavior work seamlessly across all pages of the application. 
// The scroll listener is added in the App component to ensure that it is active on all pages, including the login and signup pages. 
// This allows the Navbar to change its appearance based on the scroll position, even on pages where the Navbar is hidden. 
// The scroll listener updates the scrolled state whenever the user scrolls more than 50 pixels down the page, which can be used to apply different styles to the Navbar when scrolled.
function AppShell({ scrolled }) {
  // The useLocation hook is used to access the current location object, which contains information about the current URL.
  const location = useLocation();
  // The hideNavbar and hideFooter variables are set to true if the current pathname is either "/login" or "/signup". This is used to conditionally render the Navbar and Footer components, hiding them on the login and signup pages for a cleaner user interface.
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";
  const hideFooter = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 transition duration-300">
      {!hideNavbar && <Navbar scrolled={scrolled} />}

      <Routes>
        <Route path="/" element={<>
          <Hero />
          <Features />
          <About />
          <Benefits />
          <GTS />          
        </>} /> 
        
{/* The login and signup routes are defined here to ensure that the Navbar is hidden on these pages, while still allowing the scroll listener to function properly. This way, the Navbar can change its appearance based on the scroll position even when it is not visible, providing a consistent user experience across all pages of the application. */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/case-study" element={<CaseStudy />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/security" element={<Security />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideFooter && <Footer />}
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
// The Router is placed in the App component to ensure that the ScrollToHash component can access the location and scroll to the correct section on page load or when navigating to a different route with a hash. The AppShell component is responsible for rendering the main layout of the application, including the Navbar and the different pages based on the current route. By placing the Router in the App component, we ensure that the routing and scroll behavior work seamlessly across all pages of the application.
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToHash />
      <AppShell scrolled={scrolled} />
    </Router>
  );
}

export default App;
