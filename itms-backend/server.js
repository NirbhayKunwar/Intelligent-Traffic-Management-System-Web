import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataEnvPath = path.join(__dirname, "data", ".env");
dotenv.config();
if (existsSync(dataEnvPath)) {
  dotenv.config({ path: dataEnvPath, override: true });
}

// Simple Express server for user authentication with JWT and cookie support
const app = express();
// Configuration constants
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `${SERVER_URL}/auth/google/callback`;
const ALLOWED_ROLES = new Set(["user", "operator"]);
// Set up LowDB for simple JSON file storage
const dbFile = path.join(__dirname, "data", "db.json");
const db = new Low(new JSONFile(dbFile), { users: [] });
await db.read();
db.data ||= { users: [] };
await db.write();
// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
// Helper functions for authentication and user management
const TOKEN_COOKIE = "itms_token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Remove sensitive fields from user object before sending to client
function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
// Create a JWT token for a given user
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}
// Set the authentication token as an HTTP-only cookie
function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: TOKEN_MAX_AGE_MS,
    path: "/",
  });
}
function ensureAuthMetadata(user) {
  let changed = false;
  if (!user.authProvider) {
    user.authProvider = user.oauthProvider === "google" ? "google" : "password";
    changed = true;
  }
  if (!Array.isArray(user.linkedProviders)) {
    user.linkedProviders = [];
    changed = true;
  }
  if (user.authProvider && !user.linkedProviders.includes(user.authProvider)) {
    user.linkedProviders.push(user.authProvider);
    changed = true;
  }
  if (typeof user.passwordSet !== "boolean") {
    if (user.authProvider === "google") {
      user.passwordSet = false;
    } else {
      user.passwordSet = Boolean(user.passwordHash);
    }
    changed = true;
  }
  return changed;
}
function canUsePasswordLogin(user) {
  if (user.passwordSet === true) return true;
  return user.authProvider === "password";
}
function decodeOauthState(state) {
  if (!state) return null;
  try {
    const payload = jwt.verify(String(state), JWT_SECRET);
    if (!payload || typeof payload !== "object") return null;
    return {
      mode: payload.mode === "signup" ? "signup" : "login",
      role: typeof payload.role === "string" ? payload.role : undefined,
      organization: typeof payload.organization === "string" ? payload.organization : undefined,
    };
  } catch {
    return null;
  }
}
function getGoogleProfile(profile) {
  const email = profile?.emails?.[0]?.value
    ? String(profile.emails[0].value).trim().toLowerCase()
    : "";
  const fullName =
    profile?.displayName ||
    [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(" ") ||
    "";
  const profilePic = profile?.photos?.[0]?.value ? String(profile.photos[0].value) : "";
  const oauthId = profile?.id ? String(profile.id) : "";
  return { email, fullName, profilePic, oauthId };
}
async function upsertGoogleUser({ email, fullName, profilePic, role, organization, oauthId }) {
  let user = db.data.users.find((entry) => entry.email === email);
  if (user) {
    let changed = false;
    if (ensureAuthMetadata(user)) {
      changed = true;
    }
    if (profilePic && !user.profilePic) {
      user.profilePic = profilePic;
      changed = true;
    }
    if (fullName && (!user.fullName || user.fullName === "Unknown")) {
      user.fullName = fullName;
      changed = true;
    }
    if (oauthId && !user.oauthId) {
      user.oauthId = oauthId;
      changed = true;
    }
    if (!user.oauthProvider) {
      user.oauthProvider = "google";
      changed = true;
    }
    if (user.authProvider === "password") {
      if (!user.linkedProviders.includes("google")) {
        user.linkedProviders.push("google");
        changed = true;
      }
    } else if (user.authProvider === "google") {
      if (!user.linkedProviders.includes("google")) {
        user.linkedProviders.push("google");
        changed = true;
      }
    }
    if (changed) {
      await db.write();
    }
    return user;
  }

  const normalizedRole = ALLOWED_ROLES.has(String(role || "").trim().toLowerCase())
    ? String(role || "").trim().toLowerCase()
    : "user";
  const safeOrganization =
    normalizedRole === "operator"
      ? organization && String(organization).trim()
        ? String(organization).trim()
        : "Organization"
      : "Individual";
  const safeName = fullName || email.split("@")[0] || "User";
  const passwordHash = await bcrypt.hash(nanoid(), 10);

  user = {
    id: nanoid(),
    fullName: safeName,
    organization: safeOrganization,
    email,
    role: normalizedRole,
    passwordHash,
    profilePic: profilePic || "",
    createdAt: new Date().toISOString(),
    oauthProvider: "google",
    oauthId: oauthId || "",
    authProvider: "google",
    linkedProviders: ["google"],
    passwordSet: false,
  };
  db.data.users.push(user);
  await db.write();
  return user;
}
// Extract the token from cookies or Authorization header
function getToken(req) {
  const cookieToken = req.cookies?.[TOKEN_COOKIE];
  if (cookieToken) return cookieToken;
  // Fallback to Authorization header (e.g., for API clients)
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, value] = header.split(" ");
  if (type !== "Bearer") return null;
  return value || null;
}
// Middleware to protect routes that require authentication
function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Verify the token and extract user information
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
// API routes for health check and authentication (endpoints for signup, login, logout, and fetching current user)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
// User registration endpoint with validation and password hashing using bcrypt before storing in the database
app.post("/api/auth/signup", async (req, res) => {
  const { fullName, organization, email, password, role } = req.body || {};
  const normalizedRole = String(role || "user").trim().toLowerCase();
  if (!ALLOWED_ROLES.has(normalizedRole)) {
    return res.status(400).json({ message: "Invalid role selected." });
  }
// Basic validation for required fields and password length before creating a new user account and hashing the password using bcrypt before storing in the database
  if (!fullName || !email || !password || (normalizedRole === "operator" && !organization)) {
    return res.status(400).json({ message: "All fields are required." });
  }
// Ensure password meets minimum length requirement for security reasons before hashing and storing in the database
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }
// Normalize email to ensure uniqueness and prevent duplicate accounts, then check if an account with the same email already exists in the database before creating a new user account
  const normalizedEmail = String(email).trim().toLowerCase();
 // Check if a user with the same email already exists in the database to prevent duplicate accounts and ensure email uniqueness before creating a new user account
  const existing = db.data.users.find((user) => user.email === normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: "Account already exists for this email." });
  }
  // Hash the password using bcrypt before storing in the database for security reasons to protect user credentials in case of a data breach
  const passwordHash = await bcrypt.hash(password, 10);
  // Create a new user object with a unique ID generated by nanoid, and store the hashed password along with other user details in the database
  const newUser = {
    id: nanoid(),
    fullName: String(fullName).trim(),
    organization: organization ? String(organization).trim() : "Individual",
    email: normalizedEmail,
    role: normalizedRole,
    passwordHash,
    profilePic:"",
    createdAt: new Date().toISOString(),
    authProvider: "password",
    linkedProviders: ["password"],
    passwordSet: true,
  };
 // Add the new user to the database and write the changes to the JSON file, then generate a JWT token for the new user and set it as an HTTP-only cookie for authentication
  db.data.users.push(newUser);
  await db.write();
  // Generate a JWT token for the new user and set it as an HTTP-only cookie for authentication so that the user can be automatically logged in after signing up without needing to log in separately
  const token = signToken(newUser);
  setAuthCookie(res, token);
  // Return the sanitized user object (without password hash) in the response to confirm successful registration and provide user details to the client
  return res.status(201).json({ user: sanitizeUser(newUser) });
});
// User login endpoint that validates credentials, compares the provided password with the stored hashed password using bcrypt, and issues a JWT token if authentication is successful, which is then set as an HTTP-only cookie for session management
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  // Normalize email to ensure it matches the format stored in the database for accurate user lookup, then find the user by email and compare the provided password with the stored hashed password using bcrypt to authenticate the user before issuing a JWT token and setting it as an HTTP-only cookie for session management
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.data.users.find((entry) => entry.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (ensureAuthMetadata(user)) {
    await db.write();
  }
 // Compare the provided password with the stored hashed password using bcrypt to authenticate the user before issuing a JWT token and setting it as an HTTP-only cookie for session management
  if (!user.passwordHash || !canUsePasswordLogin(user)) {
    return res.status(401).json({ message: "Use Google login for this account." });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  // Generate a JWT token for the authenticated user and set it as an HTTP-only cookie for session management so that the user can remain logged in across requests without needing to re-authenticate
  const token = signToken(user);
  setAuthCookie(res, token);
  // Return the sanitized user object (without password hash) in the response to confirm successful login and provide user details to the client
  return res.json({ user: sanitizeUser(user) });
});
// User logout endpoint that clears the authentication cookie to effectively log the user out of the session
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  res.json({ message: "Logged out" });
});
// Protected endpoint to fetch the current authenticated user's information by verifying the JWT token from the cookie and retrieving the user details from the database, returning a sanitized user object without sensitive information
app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = db.data.users.find((entry) => entry.id === req.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  if (ensureAuthMetadata(user)) {
    await db.write();
  }
  return res.json({ user: sanitizeUser(user) });
});
if (isProduction) {
  app.set("trust proxy", 1);
}


app.post("/api/user/update-profile-pic", requireAuth, async (req, res) => {
  const { imageUrl } = req.body;

  // Find user
  const user = db.data.users.find((u) => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Save profile pic
  user.profilePic = imageUrl;

  await db.write();

  res.json({ message: "Profile picture updated", user: sanitizeUser(user) });
});

// Delete the currently authenticated user's account
app.delete("/api/user", requireAuth, async (req, res) => {
  const userIndex = db.data.users.findIndex((u) => u.id === req.userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.data.users.splice(userIndex, 1);
  await db.write();

  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  return res.json({ message: "Account deleted" });
});

// Update profile details (name, email, password)
app.put("/api/user", requireAuth, async (req, res) => {
  const { fullName, email, oldPassword, newPassword } = req.body || {};
  const user = db.data.users.find((entry) => entry.id === req.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  ensureAuthMetadata(user);

  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = db.data.users.find(
      (entry) => entry.email === normalizedEmail && entry.id !== user.id
    );
    if (existing) {
      return res.status(409).json({ message: "Email is already in use." });
    }
    user.email = normalizedEmail;
  }
// Allow updating full name if provided, trimming whitespace for consistency before saving to the database
  if (fullName) {
    user.fullName = String(fullName).trim();
  }
// Handle password change if newPassword is provided, ensuring it meets minimum length requirements and verifying the old password if necessary before hashing the new password and updating the database
  if (newPassword) {
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    const needsOldPassword = !(user.authProvider === "google" && user.passwordSet === false);
    if (needsOldPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password is required." });
      }
      const valid = await bcrypt.compare(String(oldPassword), user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Old password is incorrect." });
      }
    }
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.passwordSet = true;
    if (!user.linkedProviders?.includes("password")) {
      user.linkedProviders = Array.isArray(user.linkedProviders) ? user.linkedProviders : [];
      user.linkedProviders.push("password");
    }
  }
// Write the updated user information to the database and return the sanitized user object in the response to confirm successful update of profile details
  await db.write();
  return res.json({ user: sanitizeUser(user) });
});


// Set up session middleware for Passport to manage user sessions, and configure Passport to use the Google OAuth 2.0 strategy for authentication, including serialization and deserialization of user information for session management, and defining routes for initiating Google authentication and handling the callback after authentication is complete, as well as a logout route to clear the session and log the user out
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

// Google auth route
app.get("/auth/google",
  (req, res, next) => {
    const { mode, role, organization } = req.query;
    const oauthMeta = {
      mode: mode === "signup" ? "signup" : "login",
      role: typeof role === "string" ? role : undefined,
      organization: typeof organization === "string" ? organization : undefined,
    };
    if (req.session) {
      req.session.oauth = oauthMeta;
    }
    const stateToken = jwt.sign(oauthMeta, JWT_SECRET, { expiresIn: "15m" });
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: stateToken,
    })(req, res, next);
  }
);

// Google callback
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${CLIENT_ORIGIN}/login?oauth=failed` }),
  async (req, res) => {
    try {
      const { email, fullName, profilePic, oauthId } = getGoogleProfile(req.user);
      if (!email) {
        return res.redirect(`${CLIENT_ORIGIN}/login?oauth=missing_email`);
      }

      const stateMeta = decodeOauthState(req.query?.state);
      const oauthMeta = stateMeta || req.session?.oauth || {};
      const mode = oauthMeta.mode || "login";
      const existing = db.data.users.find((entry) => entry.email === email);
      if (!existing && mode !== "signup") {
        return res.redirect(`${CLIENT_ORIGIN}/signup?oauth=signup_required`);
      }

      const user = await upsertGoogleUser({
        email,
        fullName,
        profilePic,
        role: oauthMeta.role,
        organization: oauthMeta.organization,
        oauthId,
      });

      if (req.session?.oauth) {
        delete req.session.oauth;
      }

      const token = signToken(user);
      setAuthCookie(res, token);
      return res.redirect(CLIENT_ORIGIN);
    } catch (err) {
      console.error("Google OAuth error:", err);
      return res.redirect(`${CLIENT_ORIGIN}/login?oauth=error`);
    }
  }
);

// Logout route to clear the session and log the user out of the application
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Start the server and listen on the specified port, logging a message to indicate that the server is running and providing the URL for access to the authentication API endpoints
app.listen(PORT, () => {
  console.log(`ITMS auth server running on http://localhost:${PORT}`);
});
