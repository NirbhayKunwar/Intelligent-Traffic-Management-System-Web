import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { User, Shield, Bell, Palette, Sliders, Laptop, Lock, Mail, Camera, Trash2, LogOut, CheckCircle2 } from "lucide-react";
import { themes } from "../design-system/tokens";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error | unauth
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    oldPassword: "",
    newPassword: "",
  });
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving
  const [isSaved, setIsSaved] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [disconnectStatus, setDisconnectStatus] = useState("idle"); // idle | disconnecting
  const fileInputRef = useRef(null);

  // Profile Pic States
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // Tabs: account | security | notifications | themes | traffic | devices
  const [activeTab, setActiveTab] = useState("account");

  // Notifications State (Mock / Client storage)
  const [notifyPreferences, setNotifyPreferences] = useState({
    accidents: true,
    congestion: true,
    systemUpdates: false,
  });

  // Traffic Preferences State
  const [trafficPreferences, setTrafficPreferences] = useState({
    defaultMode: "car",
    defaultRoute: "fastest",
  });

  // Active theme preference
  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
    }
    return "system";
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const t = themes.getThemeClasses(isDarkMode);

  const profileImage = imageUrl || user?.profilePic || preview || "";
  const isGoogleAuth = user?.authProvider === "google";
  const needsOldPassword = !(isGoogleAuth && user?.passwordSet === false);

  // Password Strength Meter
  const passwordStrength = useMemo(() => {
    const pwd = formData.newPassword;
    if (!pwd) return { label: "", score: 0, color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { label: "Weak", score, color: "bg-rose-500" };
    if (score <= 3) return { label: "Moderate", score, color: "bg-amber-500" };
    return { label: "Strong", score, color: "bg-emerald-500" };
  }, [formData.newPassword]);

  const [deviceList, setDeviceList] = useState([]);

  useEffect(() => {
    const getDeviceDetails = () => {
      if (typeof window === "undefined" || !navigator) {
        return { type: "Web Session" };
      }
      const ua = navigator.userAgent;
      let browser = "Web Browser";
      let os = "Device";

      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Edge")) browser = "Edge";
      else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

      if (ua.includes("Windows NT 10.0")) os = "Windows 11";
      else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
      else if (ua.includes("Windows NT 6.2")) os = "Windows 8";
      else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
      else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone")) os = "iPhone";
      else if (ua.includes("iPad")) os = "iPad";

      return { type: `${browser} on ${os}` };
    };

    const { type } = getDeviceDetails();
    
    // Set initial loading state with local details
    setDeviceList([
      { id: 1, type, location: "Locating...", active: true, time: "Current Session" }
    ]);

    let active = true;
    async function locateSession() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (!active) return;
        const loc = data.city && data.country_code ? `${data.city}, ${data.country_code}` : "Remote Location";
        setDeviceList([
          { id: 1, type, location: loc, active: true, time: "Current Session" }
        ]);
      } catch {
        if (!active) return;
        setDeviceList([
          { id: 1, type, location: "Local Network", active: true, time: "Current Session" }
        ]);
      }
    }
    locateSession();
    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async (selectedFileParam) => {
    const uploadFile = selectedFileParam || file;
    if (!uploadFile) return;
    const bodyData = new FormData();
    bodyData.append("image", uploadFile);

    try {
      setSaveStatus("saving");
      const data = await apiRequest("/api/user/update-profile-pic", {
        method: "POST",
        body: bodyData,
      });
      const newImageUrl = data.user?.profilePic;
      setImageUrl(newImageUrl);
      setUser((prev) => ({ ...prev, ...data.user }));
      if (typeof window !== "undefined" && newImageUrl) {
        window.dispatchEvent(new CustomEvent("profile-pic-updated", { detail: newImageUrl }));
      }
      setFormSuccess("Profile picture updated!");
    } catch (err) {
      setFormError("Avatar upload failed. Try again.");
    } finally {
      setSaveStatus("idle");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setSaveStatus("saving");
      const data = await apiRequest("/api/user/update-profile-pic", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "" }),
      });
      setUser(data.user);
      setImageUrl("");
      setPreview(null);
      setFile(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-pic-updated", { detail: "" }));
      }
      setFormSuccess("Profile photo removed.");
    } catch {
      setFormError("Failed to remove photo.");
    } finally {
      setSaveStatus("idle");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      alert("Only images allowed");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    handleUpload(selectedFile);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const initials = useMemo(() => {
    if (!user?.fullName) return "US";
    return user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }, [user]);

  // Fetch Session data
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const data = await apiRequest("/api/auth/me");
        if (!mounted) return;
        setUser(data.user);
        setFormData((prev) => ({
          ...prev,
          fullName: data.user?.fullName || "",
          email: data.user?.email || "",
        }));
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        if (err.message?.toLowerCase().includes("unauthorized")) {
          setStatus("unauth");
        } else {
          setStatus("error");
          setError(err.message || "Unable to load profile data.");
        }
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setUser(null);
      setStatus("unauth");
      window.location.replace("/login");
    } catch (err) {
      setError(err.message || "Logout failed.");
    }
  };

  const handleDisconnectGoogle = async () => {
    if (disconnectStatus === "disconnecting") return;
    const hasAlt = (user?.linkedProviders || []).length > 1 || user?.passwordSet;
    if (!hasAlt) {
      alert("Set an email login password before disconnecting Google.");
      return;
    }
    setDisconnectStatus("disconnecting");
    try {
      const data = await apiRequest("/api/auth/google/disconnect", { method: "POST" });
      setUser(data.user);
      setFormSuccess("Google account unlinked successfully.");
    } catch (err) {
      setFormError(err.message || "Failed to disconnect Google.");
    } finally {
      setDisconnectStatus("idle");
    }
  };

  const handleSaveChanges = async () => {
    setFormError("");
    setFormSuccess("");
    if (!formData.fullName?.trim() || !formData.email?.trim()) {
      setFormError("Name and email are required fields.");
      return;
    }
    if (formData.newPassword && needsOldPassword && !formData.oldPassword) {
      setFormError("Enter old password to verify updates.");
      return;
    }

    setSaveStatus("saving");
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };
      if (formData.newPassword) {
        if (formData.oldPassword) payload.oldPassword = formData.oldPassword;
        payload.newPassword = formData.newPassword;
      }
      const data = await apiRequest("/api/user", { method: "PUT", body: payload });
      setUser(data.user);
      setFormData((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
      setFormSuccess("Profile settings saved.");
      setIsSaved(true);
    } catch (err) {
      setFormError(err.message || "Save changes failed.");
    } finally {
      setSaveStatus("idle");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Permanently delete your profile and auth access? This action is irreversible.");
    if (!confirmed) return;
    try {
      await apiRequest("/api/user", { method: "DELETE" });
      setUser(null);
      setStatus("unauth");
      window.location.replace("/signup");
    } catch (err) {
      setFormError(err.message || "Account deletion failed.");
    }
  };

  const selectTheme = (themeName) => {
    setThemePreference(themeName);
    if (themeName === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (themeName === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isSystemDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.removeItem("theme");
    }
    setFormSuccess(`Theme changed to ${themeName}`);
  };

  if (status === "loading") {
    return (
      <div className={`min-h-screen pt-24 pb-16 flex items-center justify-center ${t.bg}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className={`min-h-screen pt-24 pb-16 flex items-center justify-center ${t.bg}`}>
        <div className="p-8 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-center space-y-4 shadow-xl">
          <h2 className="text-xl font-bold">Unauthenticated Access</h2>
          <p className="text-sm text-slate-500">Sign in to update your profile preferences.</p>
          <Link to="/login" className="inline-flex w-full justify-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl font-semibold text-xs">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const tabsConfig = [
    { id: "account", label: "Account Details", icon: User },
    { id: "security", label: "Security & Providers", icon: Shield },
    { id: "notifications", label: "Notification settings", icon: Bell },
    { id: "themes", label: "Theme preferences", icon: Palette },
    { id: "traffic", label: "Traffic parameters", icon: Sliders },
    { id: "devices", label: "Connected Devices", icon: Laptop },
  ];

  return (
    <div className={`min-h-screen pt-24 pb-16 ${t.bg} font-inter transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Avatar Canvas */}
        <header className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-200/50 dark:border-white/5 pb-8">
          <div className="relative group">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg shadow-cyan-500/10 border-2 border-white dark:border-slate-800">
              {profileImage ? (
                <img src={profileImage} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-1.5 bg-slate-900 text-white border border-white/20 rounded-lg opacity-85 hover:opacity-100 transition-opacity"
              title="Change Photo"
            >
              <Camera size={13} />
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <h1 className="text-2xl font-poppins font-bold text-slate-900 dark:text-white">{user?.fullName}</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold">{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                user?.role === "operator" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
              }`}>
                {user?.role === "operator" ? "SYSTEM OPERATOR" : "CITIZEN"}
              </span>
            </div>
          </div>
        </header>

        {formSuccess && (
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 size={14} /> {formSuccess}
          </div>
        )}

        {formError && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {formError}
          </div>
        )}

        {/* Tabbed Layout Console */}
        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Sidebar Nav (4 cols) */}
          <nav className="md:col-span-4 flex flex-col gap-1">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setFormSuccess("");
                    setFormError("");
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white dark:bg-slate-800 shadow-sm"
                      : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
            
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 text-left mt-6"
            >
              <LogOut size={16} /> Sign Out Session
            </button>
          </nav>

          {/* Main Form Fields (8 cols) */}
          <section className={`p-6 ${t.card} md:col-span-8`}>
            
            {/* 1. Account Details */}
            {activeTab === "account" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="space-y-4">
                <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Personal Information</h3>
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                  <input
                    className={`${t.input}`}
                    value={formData.fullName}
                    onChange={(e) => {
                      setIsSaved(false);
                      setFormData({ ...formData, fullName: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                  <input
                    className={`${t.input}`}
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setIsSaved(false);
                      setFormData({ ...formData, email: e.target.value });
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200/50 dark:border-white/5">
                  <button type="button" onClick={handleSaveChanges} disabled={saveStatus === "saving"} className={`${t.buttonPrimary}`}>
                    Save Personal Details
                  </button>
                  {profileImage && (
                    <button type="button" onClick={handleRemovePhoto} className="px-4 py-2 rounded-xl text-xs font-semibold border border-rose-500/25 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10">
                      Remove Photo
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* 2. Security & Credentials */}
            {activeTab === "security" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="space-y-4">
                <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Credentials & Providers</h3>

                {needsOldPassword && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Old Password</span>
                    <input
                      className={`${t.input}`}
                      type="password"
                      placeholder="Enter old credentials"
                      value={formData.oldPassword}
                      onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">New Password</span>
                  <input
                    className={`${t.input}`}
                    type="password"
                    placeholder="Enter new credentials"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                  {formData.newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">Strength Indicator</span>
                        <span style={{ color: passwordStrength.color.replace("bg-", "") }}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200/50 dark:border-white/5 pt-4 flex flex-col gap-3">
                  <button type="button" onClick={handleSaveChanges} disabled={saveStatus === "saving"} className={`${t.buttonPrimary} self-start`}>
                    Update Password Credentials
                  </button>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Google Integration Link</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Link your profile for easy single sign-on logins.</p>
                    </div>
                    {user?.linkedProviders?.includes("google") ? (
                      <button type="button" onClick={handleDisconnectGoogle} className="px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-[10px] font-bold text-rose-600">
                        Disconnect Google
                      </button>
                    ) : (
                      <a href={`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/google?mode=link`} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700">
                        Connect Google Account
                      </a>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* 3. Notifications Parameters */}
            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Notification Preferences</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyPreferences.accidents}
                      onChange={(e) => setNotifyPreferences({ ...notifyPreferences, accidents: e.target.checked })}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">Accident Alerts Dispatch</span>
                      <span className="text-[10px] text-slate-500">Alerts me of dispatch operations within 20km radius.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer border-t border-slate-100 dark:border-white/5 pt-3">
                    <input
                      type="checkbox"
                      checked={notifyPreferences.congestion}
                      onChange={(e) => setNotifyPreferences({ ...notifyPreferences, congestion: e.target.checked })}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">Traffic Grid Lock Delays</span>
                      <span className="text-[10px] text-slate-500">Alerts me of peak corridor utilization thresholds.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer border-t border-slate-100 dark:border-white/5 pt-3">
                    <input
                      type="checkbox"
                      checked={notifyPreferences.systemUpdates}
                      onChange={(e) => setNotifyPreferences({ ...notifyPreferences, systemUpdates: e.target.checked })}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">System Gateway Updates</span>
                      <span className="text-[10px] text-slate-500">Informational reports on node calibrations and audits.</span>
                    </div>
                  </label>
                </div>

                <button type="button" onClick={() => setFormSuccess("Notification profiles updated.")} className={`${t.buttonPrimary} mt-4`}>
                  Save Alert Options
                </button>
              </div>
            )}

            {/* 4. Themes Preferences */}
            {activeTab === "themes" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Aesthetic Preferences</h3>
                
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "light", label: "Light Mode", desc: "White surfaces and soft shadows" },
                    { id: "dark", label: "Dark Mode", desc: "Slate-900 surfaces and glass panels" },
                    { id: "system", label: "System Sync", desc: "Matches operating system settings" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => selectTheme(mode.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        themePreference === mode.id
                          ? "border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold block">{mode.label}</span>
                      <span className="text-[9px] text-slate-400 mt-1 block leading-tight">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Traffic Preferences */}
            {activeTab === "traffic" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Traffic Navigation Defaults</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Travel Mode</span>
                    <div className="flex gap-2">
                      {[
                        { id: "car", label: "Private Vehicle" },
                        { id: "bike", label: "Bicycle / Cycle" },
                        { id: "walk", label: "Pedestrian Walk" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setTrafficPreferences({ ...trafficPreferences, defaultMode: mode.id })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            trafficPreferences.defaultMode === mode.id
                              ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                              : "border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Route Type</span>
                    <div className="flex gap-2">
                      {[
                        { id: "fastest", label: "Fastest Speed" },
                        { id: "safest", label: "Safest Path" },
                        { id: "least", label: "Least Congested" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setTrafficPreferences({ ...trafficPreferences, defaultRoute: type.id })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            trafficPreferences.defaultRoute === type.id
                              ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                              : "border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="button" onClick={() => setFormSuccess("Navigation routing preferences saved.")} className={`${t.buttonPrimary} mt-4`}>
                  Save Traffic Preferences
                </button>
              </div>
            )}

            {/* 6. Connected Devices */}
            {activeTab === "devices" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Active Session Devices</h3>

                <div className="space-y-3">
                  {deviceList.map((dev) => (
                    <div key={dev.id} className="p-3 border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/25 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {dev.type}
                          {dev.active && (
                            <span className="px-1.5 py-0.2 rounded-full text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                              ACTIVE
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400">{dev.location} | Latency monitored</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{dev.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone Removal card (Account tab only) */}
            {activeTab === "account" && (
              <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 mt-8 space-y-2">
                <p className="text-xs font-bold text-rose-600">Danger Zone: Deletion Controls</p>
                <p className="text-[10px] text-slate-500">Removing your profile deletes all node registries and active commute configs from ITMS.</p>
                <button type="button" onClick={handleDeleteAccount} className="px-3.5 py-1.5 rounded-lg border border-rose-500 bg-rose-500 text-white hover:opacity-90 text-[10px] font-bold transition-opacity">
                  Delete Account Profile
                </button>
              </div>
            )}

          </section>
        </div>

      </div>
    </div>
  );
}
