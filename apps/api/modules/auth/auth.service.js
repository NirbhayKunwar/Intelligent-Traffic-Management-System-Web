import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { User } from "./auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const TOKEN_COOKIE = "itms_token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_MS,
  });
}

export function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.name,
    role: u.role,
    profilePic: u.profilePicture,
    linkedProviders: u.linkedProviders,
    createdAt: u.createdAt
  };
}

export function getClientOrigin(req) {
  if (process.env.CLIENT_ORIGIN) {
    return process.env.CLIENT_ORIGIN.replace(/\/$/, "");
  }
  const isSec = req.secure || req.headers["x-forwarded-proto"] === "https";
  const protocol = isSec ? "https" : "http";
  const host = req.get("host") || "localhost:4000";
  return `${protocol}://${host}`;
}

export function normalizeClientOrigin(value) {
  if (!value) return undefined;
  try {
    const url = new URL(String(value));
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    const origin = url.origin;
    const configuredOrigin = process.env.CLIENT_ORIGIN?.replace(/\/$/, "");
    if (configuredOrigin && origin === configuredOrigin) return origin;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
    if (/\.vercel\.app$/i.test(url.hostname)) return origin;
  } catch {
    return undefined;
  }
  return undefined;
}

export function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (role === "operator") return "operator";
  return "user";
}

export function inferLegacyRole(user, index = 0) {
  const existing = String(user?.role || "").trim().toLowerCase();
  if (existing === "operator" || existing === "user") return existing;
  const org = String(user?.organization || "").trim().toLowerCase();
  if (org && org !== "individual") return "operator";
  return index === 0 ? "operator" : "user";
}

export function ensureAuthMetadata(user) {
  let changed = false;
  const normalizedRole = normalizeRole(user.role || inferLegacyRole(user));
  if (user.role !== normalizedRole) {
    user.role = normalizedRole;
    changed = true;
  }
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
    user.passwordSet = user.authProvider === "google" ? false : Boolean(user.password);
    changed = true;
  }
  return changed;
}

export function decodeOauthState(state) {
  if (!state) return null;
  try {
    const payload = jwt.verify(String(state), JWT_SECRET);
    if (!payload || typeof payload !== "object") return null;
    return {
      mode: ["signup", "link"].includes(payload.mode) ? payload.mode : "login",
      role: typeof payload.role === "string" ? payload.role : undefined,
      organization: typeof payload.organization === "string" ? payload.organization : undefined,
      linkUserId: typeof payload.linkUserId === "string" ? payload.linkUserId : undefined,
      clientOrigin: normalizeClientOrigin(payload.clientOrigin),
    };
  } catch {
    return null;
  }
}

export async function linkGoogleProvider(userId, googleData) {
  const user = await User.findOne({ id: userId });
  if (!user) throw new Error("User not found during linking.");
  
  const otherUser = await User.findOne({ googleId: googleData.oauthId, id: { $ne: userId } });
  if (otherUser) {
    console.log(`♻️ MERGE: Moving Google ID ${googleData.oauthId} from ${otherUser.email} to ${user.email}`);
    otherUser.googleId = null;
    otherUser.googleEmail = "";
    otherUser.linkedProviders = (otherUser.linkedProviders || []).filter(p => p !== "google");
    await otherUser.save();
  }

  user.googleId = googleData.oauthId;
  user.googleEmail = googleData.email || user.googleEmail || "";
  if (!user.linkedProviders.includes("google")) {
    user.linkedProviders.push("google");
  }
  await user.save();
  return user;
}

export function getGoogleProfile(profile) {
  const email = profile?.emails?.[0]?.value ? String(profile.emails[0].value).trim().toLowerCase() : "";
  const fullName = profile?.displayName || [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(" ") || "";
  const profilePic = profile?.photos?.[0]?.value ? String(profile.photos[0].value) : "";
  const oauthId = profile?.id ? String(profile.id) : "";
  return { email, fullName, profilePic, oauthId };
}

export async function upsertGoogleUser({ email, fullName, profilePic, role, organization, oauthId }) {
  let user = await User.findOne({ email });
  if (user) {
    let changed = false;
    if (profilePic && !user.profilePicture) {
      user.profilePicture = profilePic;
      changed = true;
    }
    if (fullName && (!user.name || user.name === "Unknown")) {
      user.name = fullName;
      changed = true;
    }
    if (oauthId && !user.googleId) {
      user.googleId = oauthId;
      changed = true;
    }
    if (email && user.googleEmail !== email) {
      user.googleEmail = email;
      changed = true;
    }
    if (!user.linkedProviders.includes("google")) {
      user.linkedProviders.push("google");
      changed = true;
    }
    if (changed) await user.save();
    return user;
  }

  const normalizedRole = ["user", "operator"].includes(String(role || "").toLowerCase()) ? String(role || "").toLowerCase() : "user";
  const passwordHash = await bcrypt.hash(nanoid(), 10);

  user = await User.create({
    email,
    googleEmail: email,
    name: fullName || email.split("@")[0] || "User",
    password: passwordHash,
    role: normalizedRole,
    profilePicture: profilePic || "",
    googleId: oauthId || "",
    linkedProviders: ["google"]
  });
  return user;
}
