import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, buildGoogleAuthUrl } from "../lib/api";
import { User, Shield, Bell, Palette, Sliders, Laptop, Lock, Mail, Camera, Trash2, LogOut, CheckCircle2, Sparkles, Type, Save, Download, Upload } from "lucide-react";
import { themes } from "../design-system/tokens";
import { colorThemesList, applyTheme, generateHarmonyColors } from "../design-system/themesList";


export default function Profile() {
  const navigate = useNavigate();
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

  // Active color theme preference
  const [selectedColorTheme, setSelectedColorTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("color-theme") || "sapphire-ocean";
    }
    return "sapphire-ocean";
  });

  // Sync color theme state if changed elsewhere (e.g. Navbar or floating widget)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleColorThemeChanged = (e) => {
      setSelectedColorTheme(e.detail);
    };
    window.addEventListener("color-theme-changed", handleColorThemeChanged);
    return () => window.removeEventListener("color-theme-changed", handleColorThemeChanged);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const t = themes.getThemeClasses(isDarkMode);

  // Custom theme builder states
  const [customBg, setCustomBg] = useState("#f0f4f8");
  const [customText, setCustomText] = useState("#0f172a");
  const [customPanel, setCustomPanel] = useState("#ffffff");
  const [customSidebar, setCustomSidebar] = useState("#ffffff");
  const [customBorder, setCustomBorder] = useState("#dbeafe");
  const [customAccent, setCustomAccent] = useState("#2563eb");
  
  const [customTextSecondary, setCustomTextSecondary] = useState("#475569");
  const [customInputBg, setCustomInputBg] = useState("rgba(0, 0, 0, 0.02)");
  const [customBtnBg, setCustomBtnBg] = useState("rgba(0, 0, 0, 0.05)");
  const [customBtnHover, setCustomBtnHover] = useState("rgba(0, 0, 0, 0.08)");
  const [customSuccess, setCustomSuccess] = useState("#10b981");
  const [customWarning, setCustomWarning] = useState("#f59e0b");
  const [customError, setCustomError] = useState("#ef4444");

  const [moreColorsOpen, setMoreColorsOpen] = useState(false);

  const [harmonyAccent, setHarmonyAccent] = useState("#e06c75");
  const [harmonyType, setHarmonyType] = useState("Complementary");
  const [harmonyMode, setHarmonyMode] = useState("Dark");

  const [customFont, setCustomFont] = useState("Inter");
  const [customDensity, setCustomDensity] = useState("Comfortable");
  const [customFrosted, setCustomFrosted] = useState(false);
  const [customBgEffect, setCustomBgEffect] = useState("None");
  const [customBgEffectColor, setCustomBgEffectColor] = useState("#cbd5e1");

  const [customThemeName, setCustomThemeName] = useState("");
  const [myCustomThemes, setMyCustomThemes] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("custom-themes") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const allThemesList = useMemo(() => {
    const customList = myCustomThemes.map(t => ({
      id: t.id,
      name: t.name,
      desc: "Custom User Theme",
      previewColors: {
        light: [t.colors.bg, t.colors.panel, t.colors.accent],
        dark: [t.colors.bg, t.colors.panel, t.colors.accent]
      }
    }));
    return [...colorThemesList, ...customList];
  }, [myCustomThemes]);

  // Sync customizer inputs when custom theme is selected
  useEffect(() => {
    if (selectedColorTheme && selectedColorTheme.startsWith("custom-")) {
      try {
        const customThemes = JSON.parse(localStorage.getItem("custom-themes") || "[]");
        const theme = customThemes.find(t => t.id === selectedColorTheme);
        if (theme) {
          setCustomThemeName(theme.name || "");
          setCustomFont(theme.font || "Inter");
          setCustomDensity(theme.density || "Comfortable");
          setCustomFrosted(theme.frosted || false);
          setCustomBgEffect(theme.bgEffect || "None");
          setCustomBgEffectColor(theme.bgEffectColor || "#cbd5e1");
          
          const c = theme.colors || {};
          if (c.bg) setCustomBg(c.bg);
          if (c.text) setCustomText(c.text);
          if (c.textSecondary) setCustomTextSecondary(c.textSecondary);
          if (c.panel) setCustomPanel(c.panel);
          if (c.sidebar) setCustomSidebar(c.sidebar);
          if (c.border) setCustomBorder(c.border);
          if (c.accent) setCustomAccent(c.accent);
          if (c.inputBg) setCustomInputBg(c.inputBg);
          if (c.btnSecondaryBg) setCustomBtnBg(c.btnSecondaryBg);
          if (c.btnSecondaryHover) setCustomBtnHover(c.btnSecondaryHover);
          if (c.success) setCustomSuccess(c.success);
          if (c.warning) setCustomWarning(c.warning);
          if (c.error) setCustomError(c.error);
        }
      } catch (err) {
        console.warn("Failed to sync custom states:", err);
      }
    }
  }, [selectedColorTheme]);

  // Apply custom changes in real-time
  useEffect(() => {
    if (selectedColorTheme && (selectedColorTheme === "custom" || selectedColorTheme.startsWith("custom-"))) {
      const tempTheme = {
        id: selectedColorTheme,
        name: customThemeName || "Custom Theme",
        font: customFont,
        density: customDensity,
        frosted: customFrosted,
        bgEffect: customBgEffect,
        bgEffectColor: customBgEffectColor,
        colors: {
          bg: customBg,
          text: customText,
          textSecondary: customTextSecondary,
          panel: customPanel,
          sidebar: customSidebar,
          border: customBorder,
          accent: customAccent,
          inputBg: customInputBg,
          btnSecondaryBg: customBtnBg,
          btnSecondaryHover: customBtnHover,
          success: customSuccess,
          warning: customWarning,
          error: customError
        }
      };

      if (typeof window !== "undefined") {
        const list = JSON.parse(localStorage.getItem("custom-themes") || "[]");
        const idx = list.findIndex(t => t.id === selectedColorTheme);
        if (idx > -1) {
          list[idx] = tempTheme;
        } else {
          list.push(tempTheme);
        }
        localStorage.setItem("custom-themes", JSON.stringify(list));
        applyTheme(selectedColorTheme);
      }
    }
  }, [
    selectedColorTheme, customBg, customText, customPanel, customSidebar, customBorder, customAccent,
    customTextSecondary, customInputBg, customBtnBg, customBtnHover, customSuccess, customWarning, customError,
    customFont, customDensity, customFrosted, customBgEffect, customBgEffectColor, customThemeName
  ]);

  const handleGenerateHarmony = () => {
    const palette = generateHarmonyColors(harmonyAccent, harmonyType, harmonyMode);
    setCustomBg(palette.bg);
    setCustomPanel(palette.panel);
    setCustomSidebar(palette.sidebar);
    setCustomBorder(palette.border);
    setCustomText(palette.text);
    setCustomAccent(palette.accent);
    
    setCustomTextSecondary(palette.textSecondary);
    setCustomInputBg(palette.inputBg);
    setCustomBtnBg(palette.btnSecondaryBg);
    setCustomBtnHover(palette.btnSecondaryHover);
    setCustomSuccess(palette.success);
    setCustomWarning(palette.warning);
    setCustomError(palette.error);

    if (!selectedColorTheme.startsWith("custom-")) {
      handleSelectColorTheme("custom-temp");
    }
  };

  const handleSaveTheme = () => {
    if (!customThemeName.trim()) {
      alert("Please enter a name for your custom theme.");
      return;
    }
    const themeId = `custom-${customThemeName.trim().toLowerCase().replace(/\s+/g, "-")}`;
    const newTheme = {
      id: themeId,
      name: customThemeName.trim(),
      font: customFont,
      density: customDensity,
      frosted: customFrosted,
      bgEffect: customBgEffect,
      bgEffectColor: customBgEffectColor,
      colors: {
        bg: customBg,
        text: customText,
        textSecondary: customTextSecondary,
        panel: customPanel,
        sidebar: customSidebar,
        border: customBorder,
        accent: customAccent,
        inputBg: customInputBg,
        btnSecondaryBg: customBtnBg,
        btnSecondaryHover: customBtnHover,
        success: customSuccess,
        warning: customWarning,
        error: customError
      }
    };

    let updated = [...myCustomThemes];
    const idx = updated.findIndex(t => t.id === themeId);
    if (idx > -1) {
      updated[idx] = newTheme;
    } else {
      updated.push(newTheme);
    }
    setMyCustomThemes(updated);
    localStorage.setItem("custom-themes", JSON.stringify(updated));
    handleSelectColorTheme(themeId);
    setFormSuccess(`Theme "${customThemeName.trim()}" saved successfully!`);
  };

  const handleExportTheme = () => {
    const activeThemeConfig = {
      name: customThemeName || "Custom Theme",
      font: customFont,
      density: customDensity,
      frosted: customFrosted,
      bgEffect: customBgEffect,
      bgEffectColor: customBgEffectColor,
      colors: {
        bg: customBg,
        text: customText,
        textSecondary: customTextSecondary,
        panel: customPanel,
        sidebar: customSidebar,
        border: customBorder,
        accent: customAccent,
        inputBg: customInputBg,
        btnSecondaryBg: customBtnBg,
        btnSecondaryHover: customBtnHover,
        success: customSuccess,
        warning: customWarning,
        error: customError
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeThemeConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeThemeConfig.name.toLowerCase().replace(/\s+/g, "-")}-theme.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportTheme = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target.result);
        if (theme && theme.colors) {
          setCustomThemeName(theme.name || "Imported Theme");
          setCustomFont(theme.font || "Inter");
          setCustomDensity(theme.density || "Comfortable");
          setCustomFrosted(theme.frosted || false);
          setCustomBgEffect(theme.bgEffect || "None");
          setCustomBgEffectColor(theme.bgEffectColor || "#cbd5e1");
          
          const c = theme.colors;
          if (c.bg) setCustomBg(c.bg);
          if (c.text) setCustomText(c.text);
          if (c.textSecondary) setCustomTextSecondary(c.textSecondary);
          if (c.panel) setCustomPanel(c.panel);
          if (c.sidebar) setCustomSidebar(c.sidebar);
          if (c.border) setCustomBorder(c.border);
          if (c.accent) setCustomAccent(c.accent);
          if (c.inputBg) setCustomInputBg(c.inputBg);
          if (c.btnSecondaryBg) setCustomBtnBg(c.btnSecondaryBg);
          if (c.btnSecondaryHover) setCustomBtnHover(c.btnSecondaryHover);
          if (c.success) setCustomSuccess(c.success);
          if (c.warning) setCustomWarning(c.warning);
          if (c.error) setCustomError(c.error);

          handleSelectColorTheme("custom-temp");
          setFormSuccess("Theme config imported. Please enter a name and click Save to store it.");
        } else {
          setFormError("Invalid theme file structure.");
        }
      } catch (err) {
        setFormError("Error reading JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (confirm("Reset custom configurations to system default? This will clear all saved custom themes.")) {
      setCustomBg("#f0f4f8");
      setCustomText("#0f172a");
      setCustomPanel("#ffffff");
      setCustomSidebar("#ffffff");
      setCustomBorder("#dbeafe");
      setCustomAccent("#2563eb");
      setCustomTextSecondary("#475569");
      setCustomInputBg("rgba(0, 0, 0, 0.02)");
      setCustomBtnBg("rgba(0, 0, 0, 0.05)");
      setCustomBtnHover("rgba(0, 0, 0, 0.08)");
      setCustomSuccess("#10b981");
      setCustomWarning("#f59e0b");
      setCustomError("#ef4444");
      setCustomFont("Inter");
      setCustomDensity("Comfortable");
      setCustomFrosted(false);
      setCustomBgEffect("None");
      setCustomBgEffectColor("#cbd5e1");
      setCustomThemeName("");
      setMyCustomThemes([]);
      localStorage.removeItem("custom-themes");
      handleSelectColorTheme("original");
    }
  };

  // Preview Box Computed Values
  const activePreviewBg = useMemo(() => {
    if (selectedColorTheme && (selectedColorTheme === "custom" || selectedColorTheme.startsWith("custom-"))) {
      return customBg;
    }
    const theme = allThemesList.find(t => t.id === selectedColorTheme);
    return theme ? theme.previewColors[isDarkMode ? 'dark' : 'light'][0] : '#f0f4f8';
  }, [selectedColorTheme, customBg, allThemesList, isDarkMode]);

  const activePreviewPanel = useMemo(() => {
    if (selectedColorTheme && (selectedColorTheme === "custom" || selectedColorTheme.startsWith("custom-"))) {
      return customPanel;
    }
    const theme = allThemesList.find(t => t.id === selectedColorTheme);
    return theme ? theme.previewColors[isDarkMode ? 'dark' : 'light'][1] : '#ffffff';
  }, [selectedColorTheme, customPanel, allThemesList, isDarkMode]);

  const activePreviewAccent = useMemo(() => {
    if (selectedColorTheme && (selectedColorTheme === "custom" || selectedColorTheme.startsWith("custom-"))) {
      return customAccent;
    }
    const theme = allThemesList.find(t => t.id === selectedColorTheme);
    return theme ? theme.previewColors[isDarkMode ? 'dark' : 'light'][2] : '#2563eb';
  }, [selectedColorTheme, customAccent, allThemesList, isDarkMode]);

  const activePreviewText = useMemo(() => {
    if (selectedColorTheme && (selectedColorTheme === "custom" || selectedColorTheme.startsWith("custom-"))) {
      return customText;
    }
    return isDarkMode ? '#f1f5f9' : '#0f172a';
  }, [selectedColorTheme, customText, isDarkMode]);

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
      navigate("/login", { replace: true });
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

  const handleConnectGoogle = () => {
    setFormError("");
    try {
      window.location.assign(buildGoogleAuthUrl({ mode: "link" }));
    } catch (err) {
      setFormError(err.message || "Google account linking is not configured.");
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
      navigate("/signup", { replace: true });
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

  const handleSelectColorTheme = (themeId) => {
    setSelectedColorTheme(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem("color-theme", themeId);
      applyTheme(themeId);
      window.dispatchEvent(new CustomEvent("color-theme-changed", { detail: themeId }));
    }
    setFormSuccess(`Theme changed to ${themeId.replace("custom-", "").replace("-", " ").toUpperCase()}`);
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
                      <button type="button" onClick={handleConnectGoogle} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700">
                        Connect Google Account
                      </button>
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2 mb-3">Display Mode</h3>
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
                            ? "border-theme-accent bg-theme-accent/5 text-theme-text-primary"
                            : "border-theme-border bg-theme-bg/30 text-theme-text-primary/70 hover:bg-theme-bg/55"
                        }`}
                      >
                        <span className="text-xs font-bold block">{mode.label}</span>
                        <span className="text-[9px] text-theme-text-secondary/80 mt-1 block leading-tight">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold border-b border-slate-200/50 dark:border-white/5 pb-2">Premium Palette Themes</h3>
                    <p className="text-[10px] text-theme-text-secondary">Choose an enterprise-grade color identity. Updates apply instantly to the entire application upon selection.</p>
                  </div>

                  <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {allThemesList.map((themeItem) => {
                      const colorsToShow = isDarkMode ? themeItem.previewColors.dark : themeItem.previewColors.light;
                      return (
                        <button
                          key={themeItem.id}
                          type="button"
                          onClick={() => handleSelectColorTheme(themeItem.id)}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-between text-center min-h-[90px] ${
                            selectedColorTheme === themeItem.id
                              ? "border-theme-accent bg-theme-accent/5 ring-1 ring-theme-accent/30"
                              : "border-theme-border bg-theme-bg/25 hover:bg-theme-bg/50"
                          }`}
                        >
                          <div className="flex gap-1 items-center justify-center p-1 bg-black/5 dark:bg-white/5 rounded-full px-2">
                            {colorsToShow.map((c, i) => (
                              <span
                                key={i}
                                className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shadow-sm animate-in"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-theme-text-primary capitalize truncate w-full mt-2">{themeItem.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Theme Builder Panel */}
                <div className="p-6 rounded-2xl border border-theme-border bg-theme-bg/10 space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-white/5 pb-2">
                    <Sliders className="text-theme-accent" size={16} />
                    <h3 className="text-sm font-bold text-theme-text-primary">Custom Theme Builder</h3>
                  </div>

                  {/* Colors Section */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-text-secondary">Colors</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Background", value: customBg, onChange: setCustomBg },
                        { label: "Text", value: customText, onChange: setCustomText },
                        { label: "Panel", value: customPanel, onChange: setCustomPanel },
                        { label: "Sidebar", value: customSidebar, onChange: setCustomSidebar },
                        { label: "Border", value: customBorder, onChange: setCustomBorder },
                        { label: "Accent", value: customAccent, onChange: setCustomAccent },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-theme-border bg-theme-card/30">
                          <span className="text-xs font-semibold text-theme-text-primary">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-theme-text-secondary">{item.value}</span>
                            <label className="relative w-6 h-6 rounded-full border border-black/10 dark:border-white/10 shadow-sm cursor-pointer overflow-hidden block" style={{ backgroundColor: item.value }}>
                              <input type="color" value={item.value} onChange={(e) => item.onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* More Colors collapsible */}
                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setMoreColorsOpen(!moreColorsOpen)}
                        className="text-[11px] font-bold text-theme-accent hover:underline flex items-center gap-1.5"
                      >
                        <span>{moreColorsOpen ? "▼" : "▶"}</span> More Colors
                      </button>

                      {moreColorsOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-theme-border bg-theme-bg/5 animate-in slide-in-from-top duration-200">
                          {[
                            { label: "Text Secondary", value: customTextSecondary, onChange: setCustomTextSecondary },
                            { label: "Input Background", value: customInputBg, onChange: setCustomInputBg },
                            { label: "Button Secondary BG", value: customBtnBg, onChange: setCustomBtnBg },
                            { label: "Success Status", value: customSuccess, onChange: setCustomSuccess },
                            { label: "Warning Status", value: customWarning, onChange: setCustomWarning },
                            { label: "Error Status", value: customError, onChange: setCustomError },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg border border-theme-border bg-theme-card/20">
                              <span className="text-[11px] font-semibold text-theme-text-primary">{item.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-theme-text-secondary">{item.value}</span>
                                <label className="relative w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm cursor-pointer overflow-hidden block" style={{ backgroundColor: item.value }}>
                                  <input type="color" value={item.value} onChange={(e) => item.onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Color Harmony Section */}
                  <div className="space-y-4 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-theme-accent" size={14} />
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-text-secondary">Color Harmony</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Accent Color</span>
                        <div className="flex items-center gap-1.5 p-2 rounded-lg border border-theme-border bg-theme-card/30">
                          <label className="relative w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm cursor-pointer overflow-hidden block" style={{ backgroundColor: harmonyAccent }}>
                            <input type="color" value={harmonyAccent} onChange={(e) => setHarmonyAccent(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          </label>
                          <input type="text" value={harmonyAccent} onChange={(e) => setHarmonyAccent(e.target.value)} className="bg-transparent border-0 p-0 text-xs text-theme-text-primary font-mono w-20 focus:ring-0" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Harmony Rule</span>
                        <select value={harmonyType} onChange={(e) => setHarmonyType(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-card/30 text-theme-text-primary focus:ring-1 focus:ring-theme-accent">
                          <option value="Monochromatic">Monochromatic</option>
                          <option value="Complementary">Complementary</option>
                          <option value="Analogous">Analogous</option>
                          <option value="Triadic">Triadic</option>
                          <option value="Split Complementary">Split Complementary</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Contrast Mode</span>
                        <select value={harmonyMode} onChange={(e) => setHarmonyMode(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-card/30 text-theme-text-primary focus:ring-1 focus:ring-theme-accent">
                          <option value="Dark">Dark Mode</option>
                          <option value="Light">Light Mode</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={handleGenerateHarmony} className="w-full py-2 bg-theme-accent hover:bg-theme-accent-hover active:bg-theme-accent-active text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                      Generate Palette
                    </button>
                  </div>

                  {/* Font & Layout Section */}
                  <div className="space-y-4 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Type className="text-theme-accent" size={14} />
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-text-secondary">Font & Layout</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Typography Family</span>
                        <select value={customFont} onChange={(e) => setCustomFont(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-card/30 text-theme-text-primary focus:ring-1 focus:ring-theme-accent">
                          <option value="Inter">Inter (Sans-serif)</option>
                          <option value="Poppins">Poppins (Display)</option>
                          <option value="Monospace">Geist Mono (Monospace)</option>
                          <option value="Roboto">Roboto (Technical)</option>
                          <option value="Outfit">Outfit (Premium)</option>
                          <option value="System-ui">System-ui</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Density Spacing</span>
                        <select value={customDensity} onChange={(e) => setCustomDensity(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-card/30 text-theme-text-primary focus:ring-1 focus:ring-theme-accent">
                          <option value="Comfortable">Comfortable</option>
                          <option value="Compact">Compact</option>
                          <option value="Spacious">Spacious</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl border border-theme-border bg-theme-card/30">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-theme-text-primary block">Frosted Glass Panels</span>
                        <span className="text-[9px] text-theme-text-secondary">Enables opacity overlay and dynamic backdrop filter blur.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={customFrosted} onChange={(e) => setCustomFrosted(e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-theme-accent"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Background Effect</span>
                        <select value={customBgEffect} onChange={(e) => setCustomBgEffect(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-theme-border bg-theme-card/30 text-theme-text-primary focus:ring-1 focus:ring-theme-accent">
                          <option value="None">None</option>
                          <option value="Dots">Radial Dots</option>
                          <option value="Grid">Linear Grid</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Effect Color</span>
                        <div className="flex items-center gap-1.5 p-2 rounded-lg border border-theme-border bg-theme-card/30 min-h-[42px]">
                          <label className="relative w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm cursor-pointer overflow-hidden block" style={{ backgroundColor: customBgEffectColor }}>
                            <input type="color" value={customBgEffectColor} onChange={(e) => setCustomBgEffectColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          </label>
                          <input type="text" value={customBgEffectColor} onChange={(e) => setCustomBgEffectColor(e.target.value)} className="bg-transparent border-0 p-0 text-xs text-theme-text-primary font-mono w-20 focus:ring-0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save & Share Section */}
                  <div className="space-y-4 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Save className="text-theme-accent" size={14} />
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-text-secondary">Save & Share</h4>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Theme name..."
                        value={customThemeName}
                        onChange={(e) => setCustomThemeName(e.target.value)}
                        className="flex-1 text-xs p-2.5 rounded-xl border border-theme-border bg-theme-card/30 text-theme-text-primary focus:ring-1 focus:ring-theme-accent focus:outline-none"
                      />
                      <button type="button" onClick={handleSaveTheme} className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm animate-in">
                        Save
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center justify-center gap-1.5 py-2 px-3 border border-theme-border bg-theme-card/20 hover:bg-theme-bg/15 rounded-xl text-xs font-bold text-theme-text-primary cursor-pointer transition-all">
                        <Upload size={14} className="text-theme-accent" />
                        <span>Import</span>
                        <input type="file" accept=".json" onChange={handleImportTheme} className="hidden" />
                      </label>
                      <button type="button" onClick={handleExportTheme} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-theme-border bg-theme-card/20 hover:bg-theme-bg/15 rounded-xl text-xs font-bold text-theme-text-primary transition-all">
                        <Download size={14} className="text-theme-accent" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  <button type="button" onClick={handleResetToDefault} className="w-full py-2 border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-all">
                    Reset to Default
                  </button>
                </div>

                {/* Live Preview Card */}
                <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-widest text-theme-text-secondary font-bold">Theme Preview Box</p>
                  </div>
                  
                  <div 
                    className="p-5 rounded-xl border transition-all duration-300 shadow-sm"
                    style={{
                      backgroundColor: activePreviewBg,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                      color: activePreviewText
                    }}
                  >
                    <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-500/10">
                      <span className="text-xs font-bold font-poppins">ITMS Control Board</span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isDarkMode ? '#34d399' : '#059669',
                          border: isDarkMode ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        ACTIVE FLOW
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div 
                        className="p-3.5 rounded-lg border shadow-sm space-y-1.5"
                        style={{
                          backgroundColor: activePreviewPanel,
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
                        }}
                      >
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Congestion Rate</p>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-bold font-mono">42% Index</span>
                          <div className="w-16 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: '42%',
                                backgroundColor: activePreviewAccent
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold text-white transition-all shadow-sm"
                          style={{
                            backgroundColor: activePreviewAccent
                          }}
                        >
                          Primary Action
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all"
                          style={{
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                            backgroundColor: 'transparent',
                            color: activePreviewText
                          }}
                        >
                          Bypass Route
                        </button>
                      </div>
                    </div>
                  </div>

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
