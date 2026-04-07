import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function Profile() {
  // State for user data, loading status, and error messages
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

  const fileInputRef = useRef(null);


  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const cloudName = "dhnpok3mf";
  const uploadPreset = "profile_upload";

  const profileImage = imageUrl || user?.profilePic || preview || "";
  const isGoogleAuth = user?.authProvider === "google";
  const needsOldPassword = !(isGoogleAuth && user?.passwordSet === false);

  const handleUpload = async (selectedFileParam) => {
    const uploadFile = selectedFileParam || file;

    if (!uploadFile) {
      alert("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!data?.secure_url) {
        throw new Error("Upload failed.");
      }

      setImageUrl(data.secure_url);
      setUser((prev) => ({
        ...prev,
        profilePic: data.secure_url,
      }));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profile-pic-updated", { detail: data.secure_url })
        );
      }

      await apiRequest("/api/user/update-profile-pic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: data.secure_url }),
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
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

  // Compute user initials for avatar display
  const initials = useMemo(() => {
    if (!user?.fullName) return "IT";
    return user.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);
  // Load user profile on component mount
  useEffect(() => {
    let mounted = true;
    // Function to fetch user profile data
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
        setIsSaved(false);
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        if (err.message?.toLowerCase().includes("unauthorized")) {
          setStatus("unauth");
        } else {
          setStatus("error");
          setError(err.message || "Unable to load profile.");
        }
      }
    }
    // Initiate profile loading
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: user.fullName || "",
      email: user.email || "",
    }));
  }, [user]);
  // Handle user logout
  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setUser(null);
      setStatus("unauth");
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || "Logout failed.");
      setStatus("error");
    }
  };

  const handleSaveChanges = async () => {
    setFormError("");
    setFormSuccess("");

    if (!formData.fullName?.trim() || !formData.email?.trim()) {
      setFormError("Full name and email are required.");
      return;
    }

    if (formData.newPassword && needsOldPassword && !formData.oldPassword) {
      setFormError("Please enter your old password to set a new one.");
      return;
    }

    setSaveStatus("saving");
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };
      if (formData.newPassword) {
        if (formData.oldPassword) {
          payload.oldPassword = formData.oldPassword;
        }
        payload.newPassword = formData.newPassword;
      }

      const data = await apiRequest("/api/user", {
        method: "PUT",
        body: payload,
      });

      setUser(data.user);
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
      }));
      setFormSuccess("Profile updated successfully.");
      setIsSaved(true);
    } catch (err) {
      setFormError(err.message || "Update failed.");
    } finally {
      setSaveStatus("idle");
    }
  };

  const handleDeleteAccount = async () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );
      if (!confirmed) return;
    }

    try {
      await apiRequest("/api/user", { method: "DELETE" });
      setUser(null);
      setStatus("unauth");
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || "Account deletion failed.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-emerald-400/30">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold">{initials}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
              Profile
            </h1>
            <p className="mt-2 text-slate-900 dark:text-gray-300">
              Manage your account settings and personalize your traffic command center.
            </p>
          </div>
            <div className="flex flex-wrap justify-center gap-3">
            {user?.authProvider && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
                {user.authProvider === "google"
                  ? "Signed up with Google"
                  : "Signed up with Email"}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Active Operator
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
              Verified Account
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              Command Center Access
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-10 left-1/4 h-16 w-40 -rotate-12 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
          <div className="pointer-events-none absolute top-8 right-6 h-1 w-24 bg-white/60 blur-sm opacity-70 dark:bg-white/20"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-800 dark:text-gray-400">
                  Account Settings
                </p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Update your profile details
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border ${
                  isSaved
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
                }`}
              >
                {isSaved ? "Saved Changes" : "Unsaved Changes"}
              </span>
            </div>

            {status === "loading" && (
              <p className="text-slate-900 dark:text-gray-300">Loading profile...</p>
            )}

            {status === "unauth" && (
              <div className="space-y-4">
                <p className="text-slate-900 dark:text-gray-300">
                  You are not signed in. Please log in to view your profile.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-500/30"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <p className="text-red-700 dark:text-red-200">{error}</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}

            {status === "ready" && user && (
              <div className="grid gap-5">
                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white text-xl font-semibold">         
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}  
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                          {user.fullName}
                        </p>
                        <p className="text-sm text-slate-900 dark:text-gray-300">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200">
                            Live Monitoring
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-700 dark:text-indigo-200">
                            Incident Response
                          </span>
                        </div>
                      </div>
                    </div>
                    <input
                       type="file"
                       accept="image/*"
                       ref={fileInputRef}
                       onChange={handleFileChange}
                       style={{ display: "none" }}
                      />
                    <button
                      type="button"
                      accept="image/*"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-white/80 text-slate-900 hover:bg-white border border-white/60 shadow-md dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20 dark:border-white/10"
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                    Full Name
                  </span>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(event) => {
                      setIsSaved(false);
                      setFormData((prev) => ({
                        ...prev,
                        fullName: event.target.value,
                      }));
                    }}
                    className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-slate-900 shadow-sm focus:outline-none dark:border-cyan-500/20 dark:bg-black/30 dark:text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                    Email Address
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => {
                      setIsSaved(false);
                      setFormData((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }));
                    }}
                    className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-slate-900 shadow-sm focus:outline-none dark:border-cyan-500/20 dark:bg-black/30 dark:text-white"
                  />
                </label>
                {!needsOldPassword && (
                  <div className="rounded-xl border border-cyan-200/60 bg-cyan-50/50 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-200">
                    Set a password to enable email login. No old password is required this time.
                  </div>
                )}
                {needsOldPassword && (
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                      Old Password
                    </span>
                    <input
                      type="password"
                      placeholder="********"
                      value={formData.oldPassword}
                      onChange={(event) => {
                        setIsSaved(false);
                        setFormData((prev) => ({
                          ...prev,
                          oldPassword: event.target.value,
                        }));
                      }}
                      className="w-full rounded-xl border border-white/70 bg-slate-100/80 px-4 py-3 text-slate-900 shadow-sm focus:outline-none dark:border-cyan-500/20 dark:bg-black/30 dark:text-white"
                    />
                  </label>
                )}
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                    New Password (optional)
                  </span>
                  <input
                    type="password"
                    placeholder="********"
                    value={formData.newPassword}
                    onChange={(event) => {
                      setIsSaved(false);
                      setFormData((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }));
                    }}
                    className="w-full rounded-xl border border-white/70 bg-slate-100/80 px-4 py-3 text-slate-900 shadow-sm focus:outline-none dark:border-cyan-500/20 dark:bg-black/30 dark:text-white"
                  />
                  <p className="text-xs text-slate-800 dark:text-gray-400">
                    Leave blank to keep your current password.
                  </p>
                </label>

                {formError && (
                  <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>
                )}
                {formSuccess && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {formSuccess}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saveStatus === "saving"}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                  >
                    {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl">
          <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Security Tips</p>
              <p className="text-sm text-slate-900 dark:text-gray-300">
                Use strong passwords and enable multi-factor authentication for better protection.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-slate-900 hover:text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:text-white"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-slate-900 hover:text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:text-white"
          >
            Back to Home
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-slate-900 hover:text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:text-white"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
