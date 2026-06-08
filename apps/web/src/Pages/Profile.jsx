import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

// This component renders the user profile page, allowing users to view and update their profile information, including their full name, email, password, and profile picture. The component handles loading the user's profile data, updating the profile information, uploading a new profile picture to Cloudinary, and deleting the account. It also includes error handling and displays appropriate messages for different states (loading, error, unauthenticated). The UI is styled with a gradient background, borders, shadows, and responsive design to provide a visually appealing and functional interface for managing user profiles.
export default function Profile() {
  // State variables for user profile data, loading status, form data, and file upload handling
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
// Ref for the hidden file input element used for uploading profile pictures
  const fileInputRef = useRef(null);

// State variables for handling profile picture upload, including the selected file, preview URL, and uploaded image URL
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // Compute the profile image URL, prioritizing the uploaded image, then the user's existing profile picture, and finally the preview URL for the selected file
  const profileImage = imageUrl || user?.profilePic || preview || "";
  const isGoogleAuth = user?.authProvider === "google";
  const needsOldPassword = !(isGoogleAuth && user?.passwordSet === false);
// Function to handle profile picture upload via the secure backend (prevents exposing Cloudinary keys)
  const handleUpload = async (selectedFileParam) => {
    const uploadFile = selectedFileParam || file;
    if (!uploadFile) {
      alert("No file selected");
      return;
    }

    const bodyData = new FormData();
    bodyData.append("image", uploadFile);

    try {
      setSaveStatus("saving");
      // Upload directly to our backend, which then securely handles the Cloudinary upload
      const data = await apiRequest("/api/user/update-profile-pic", {
        method: "POST",
        body: bodyData,
      });

      const newImageUrl = data.user?.profilePic;
      setImageUrl(newImageUrl);
      setUser((prev) => ({
        ...prev,
        ...data.user,
      }));

      if (typeof window !== "undefined" && newImageUrl) {
        window.dispatchEvent(
          new CustomEvent("profile-pic-updated", { detail: newImageUrl })
        );
      }
      setFormSuccess("Profile picture updated!");
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setSaveStatus("idle");
    }
  };

  // Function to handle removing the profile photo
  const handleRemovePhoto = async () => {
    try {
      setSaveStatus("saving");
      // Use the profile edit endpoint to clear the picture
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
    } catch (err) {
      console.error("Remove failed:", err);
      setFormError("Failed to remove photo.");
    } finally {
      setSaveStatus("idle");
    }
  };
// Function to handle changes in the file input, validating the selected file and initiating the upload process
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
// Validate that a file has been selected for upload
    if (!selectedFile) return;
// Validate that the selected file is an image
    if (!selectedFile.type.startsWith("image/")) {
      alert("Only images allowed");
      return;
    }
// Update the file and preview state with the selected file and its preview URL, and initiate the upload process
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
// Initiate the upload process for the selected file
    handleUpload(selectedFile);
  };
// Clean up the preview URL when the component unmounts or when a new file is selected to prevent memory leaks
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
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("oauth") === "linked") {
           setFormSuccess("Google account connected successfully!");
           window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (urlParams.get("oauth_error")) {
           setFormError(decodeURIComponent(urlParams.get("oauth_error")));
           window.history.replaceState({}, document.title, window.location.pathname);
        }

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
// Update form data when user profile changes
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

  const handleDisconnectGoogle = async () => {
    if (disconnectStatus === "disconnecting") return;
    const hasAlternative = (user?.linkedProviders || []).length > 1 || user?.passwordSet;
    if (!hasAlternative) {
      alert("You cannot disconnect Google without setting a password first.");
      return;
    }

    setDisconnectStatus("disconnecting");
    setFormError("");
    setFormSuccess("");
    try {
      const data = await apiRequest("/api/auth/google/disconnect", { method: "POST" });
      setUser(data.user);
      setFormSuccess("Google account disconnected successfully.");
    } catch (err) {
      setFormError(err.message || "Failed to disconnect Google account.");
    } finally {
      setDisconnectStatus("idle");
    }
  };
// Handle saving changes to the user's profile, including validation of form data and making an API request to update the profile information in the backend
  const handleSaveChanges = async () => {
    setFormError("");
    setFormSuccess("");
// Validate that the full name and email fields are not empty
    if (!formData.fullName?.trim() || !formData.email?.trim()) {
      setFormError("Full name and email are required.");
      return;
    }
// Validate that the old password is provided if a new password is being set and the user is not authenticated via Google without a password
    if (formData.newPassword && needsOldPassword && !formData.oldPassword) {
      setFormError("Please enter your old password to set a new one.");
      return;
    }
// Validate that the new password is at least 6 characters long if it is being set
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
// Make an API request to update the user's profile information in the backend
      const data = await apiRequest("/api/user", {
        method: "PUT",
        body: payload,
      });
// Update the user state with the new profile information, reset the form data for passwords, and display a success message
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
// Handle account deletion, including confirmation from the user and making an API request to delete the account in the backend
  const handleDeleteAccount = async () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );
      if (!confirmed) return;
    }
// Make an API request to delete the user's account in the backend, and handle the response by clearing the user state and reloading the page
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
// Render the profile page with different states for loading, unauthenticated, error, and ready. The page includes a header with the user's profile picture or initials, name, email, and account status badges. The main content area allows the user to update their profile information, upload a new profile picture, and delete their account, with appropriate styling and responsive design for a visually appealing interface.
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
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
              user?.role === "operator" 
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-slate-200 bg-white/80 text-slate-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100"
            }`}>
              <span className={`h-2 w-2 rounded-full ${user?.role === "operator" ? "bg-emerald-500" : "bg-cyan-500"}`}></span>
              {user?.role === "operator" ? "Active Operator" : "Normal User"}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
              user?.linkedProviders?.includes("google")
                ? "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            }`}>
              <span className={`h-2 w-2 rounded-full ${user?.linkedProviders?.includes("google") ? "bg-cyan-500" : "bg-amber-500"}`}></span>
              {user?.linkedProviders?.includes("google") ? "Verified Account" : "Unverified Account"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              {user?.role === "operator" ? "Command Center Access" : "Public Awareness Access"}
            </span>
          </div>
        </div>
{/* Main content area with gradient background, borders, shadows, and sections for managing user profile information. The content area includes a header for account settings, a status indicator for unsaved changes, and conditional rendering for different states (loading, unauthenticated, error, ready). When the profile is ready, it displays a form for updating the user's full name, email, password, and profile picture, along with buttons to save changes and delete the account. The section is styled for readability and dark mode support. */}
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
{/* Conditional rendering for different states of the profile page, including loading, unauthenticated, error, and ready states. Each state displays appropriate messages and actions for the user, such as a loading indicator, a prompt to log in, an error message with a retry button, or the profile management form when the profile is ready. The section is styled for readability and dark mode support. */}
            {status === "loading" && (
              <p className="text-slate-900 dark:text-gray-300">Loading profile...</p>
            )}
{/* Conditional rendering for unauthenticated state, displaying a message prompting the user to log in and a button to navigate to the login page. The section is styled for readability and dark mode support. */}
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
{/* Conditional rendering for error state, displaying the error message and a button to retry loading the profile. The section is styled for readability and dark mode support, with the error message highlighted in red. */}
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
{/* Conditional rendering for ready state, displaying the profile management form with fields for full name, email, old password, new password, and profile picture upload. The section includes buttons to save changes and delete the account, with appropriate validation and error handling for form submission. The UI is styled for readability and dark mode support, with a visually appealing layout and responsive design. */}
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-white/80 text-slate-900 hover:bg-white border border-white/60 shadow-md dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20 dark:border-white/10"
                      >
                        Upload Photo
                      </button>

                      {profileImage && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border border-rose-500/20 dark:text-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                        >
                          Remove Photo
                        </button>
                      )}

                      {user?.linkedProviders?.includes("google") ? (
                        <button
                          type="button"
                          onClick={handleDisconnectGoogle}
                          disabled={disconnectStatus === "disconnecting"}
                          className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border border-rose-500/20 dark:text-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 shadow-sm transition-all"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                          </svg>
                          <span className="text-sm font-medium">
                            {disconnectStatus === "disconnecting" ? "Disconnecting..." : "Disconnect Google"}
                          </span>
                        </button>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/google?mode=link`}
                          className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-md transition-all dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-700"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          <span className="text-sm font-medium">Connect Google</span>
                        </a>
                      )}
                    </div>
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
{/* Display form error or success messages, styled appropriately for visibility and dark mode support. The error message is highlighted in red, while the success message is highlighted in green. Both messages are displayed below the form fields and above the action buttons for better user feedback on form submission. */}
                {formError && (
                  <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>
                )}
                {formSuccess && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {formSuccess}
                  </p>
                )}
{/* Action buttons for saving changes, deleting the account, and signing out. The save button is disabled while the save operation is in progress, and the delete button prompts the user for confirmation before proceeding. The buttons are styled with gradients, borders, and hover effects for better visibility and user experience, with support for dark mode. */}
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
{/* Additional section with security tips and navigation links, styled with a gradient background, borders, shadows, and responsive design for better visibility and user experience. The section includes a header for security tips, a brief message about using strong passwords and enabling multi-factor authentication, and a link to navigate back to the dashboard. The styling supports both light and dark modes for better accessibility. */}
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
{/* Footer section with navigation links, styled with a gradient background, borders, shadows, and responsive design for better visibility and user experience. The section includes links to navigate back to the home page and the dashboard, with appropriate styling for light and dark modes. The links are displayed in a flex container that wraps on smaller screens for better responsiveness. */}
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
