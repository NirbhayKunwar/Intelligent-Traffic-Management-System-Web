import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import UserDashboard from "./UserDashboard";
import OperatorDashboard from "./Dashboard/index";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  const [status, setStatus] = useState("loading"); // loading | user | operator | unauth | error
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const data = await apiRequest("/api/auth/me");
        if (!mounted) return;
        setUser(data.user);
        if (data.user?.role === "user") {
          setStatus("user");
        } else if (data.user?.role === "operator" || data.user?.role === "admin") {
          setStatus("operator");
        } else {
          setStatus("unauth");
        }
      } catch (err) {
        if (!mounted) return;
        if (err.message?.toLowerCase().includes("unauthorized")) {
          setStatus("unauth");
        } else {
          setError(err.message || "Failed to authenticate session.");
          setStatus("error");
        }
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (status === "unauth") {
    return <Navigate to="/login" replace />;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="p-8 max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-500">Authentication Error</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (status === "user") {
    return <UserDashboard user={user} />;
  }

  if (status === "operator") {
    return <OperatorDashboard user={user} />;
  }

  return null;
}
