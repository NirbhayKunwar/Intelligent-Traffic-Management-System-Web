import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "./auth.model.js";
import { 
  signToken, 
  setAuthCookie, 
  sanitizeUser, 
  getClientOrigin, 
  getGoogleProfile, 
  decodeOauthState, 
  linkGoogleProvider, 
  upsertGoogleUser,
  ensureAuthMetadata,
  appendVercelBypassToken
} from "./auth.service.js";
import { sendPasswordResetEmail, sendPasswordResetOtpEmail } from "../../services/emailService.js";
import { getToken } from "../../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const TOKEN_COOKIE = "itms_token";
const isProduction = process.env.NODE_ENV === "production";

export async function signup(req, res, next) {
  try {
    const { email, password, fullName, role } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: fullName,
      role: role || "user",
      authProvider: "password",
      linkedProviders: ["password"],
      passwordSet: true
    });

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Support legacy users or missing metadata
    const metadataChanged = ensureAuthMetadata(user);
    if (metadataChanged) await user.save();

    if (user.linkedProviders.includes("password") && !user.password) {
      return res.status(400).json({ message: "Password login not set up for this account. Use Google login." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    const genericMessage = "If an account exists for this email, a password reset OTP has been sent.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = otp;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    try {
      await sendPasswordResetOtpEmail(user.email, otp);
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error("Password reset OTP dispatch failure:", err.message);
      return res.status(500).json({ message: "Could not send password reset OTP. Please try again later." });
    }

    const response = { message: genericMessage };
    if (!isProduction && !process.env.EMAIL_USER) {
      response.otp = otp;
    }
    return res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordOtp(req, res, next) {
  try {
    const { email, otp, password } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required." });
    if (!otp) return res.status(400).json({ message: "OTP code is required." });
    if (!password) return res.status(400).json({ message: "New password is required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetToken: otp,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordSet = true;
    if (!user.linkedProviders.includes("password")) {
      user.linkedProviders.push("password");
    }
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: "New password is required." });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordSet = true;
    if (!user.linkedProviders.includes("password")) {
      user.linkedProviders.push("password");
    }
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
}

export async function checkSession(req, res, next) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(401).json({ message: "User not found." });

    const metadataChanged = ensureAuthMetadata(user);
    if (metadataChanged) await user.save();

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
  });
  return res.json({ message: "Logged out successfully." });
}

export async function handleGoogleCallback(req, res) {
  try {
    const stateMeta = decodeOauthState(req.query?.state);
    const clientOrigin = stateMeta?.clientOrigin || getClientOrigin(req);
    const { email, fullName, profilePic, oauthId } = getGoogleProfile(req.user);
    if (!email) {
      return res.redirect(appendVercelBypassToken(`${clientOrigin}/login?oauth=missing_email`));
    }

    let oauthMeta = stateMeta || req.session?.oauth || {};
    
    const token = getToken(req);
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (oauthMeta.mode !== "login") oauthMeta.mode = "link";
        oauthMeta.linkUserId = payload.sub;
      } catch {}
    }

    const mode = oauthMeta.mode || "login";
    
    let user;
    if (mode === "link" && oauthMeta.linkUserId) {
      user = await linkGoogleProvider(oauthMeta.linkUserId, { email, fullName, profilePic, oauthId });
    } else {
      const existing = await User.findOne({ email });
      if (!existing && mode !== "signup") {
        return res.redirect(appendVercelBypassToken(`${clientOrigin}/signup?oauth=signup_required`));
      }

      user = await upsertGoogleUser({
        email,
        fullName,
        profilePic,
        role: oauthMeta.role,
        organization: oauthMeta.organization,
        oauthId,
      });
    }

    if (req.session?.oauth) delete req.session.oauth;

    const newToken = signToken(user);
    setAuthCookie(res, newToken);

    if (mode === "link" || token) {
      return res.redirect(appendVercelBypassToken(`${clientOrigin}/profile?oauth=linked&token=${newToken}`));
    }

    const separator = clientOrigin.includes("?") ? "&" : "?";
    return res.redirect(appendVercelBypassToken(`${clientOrigin}${separator}token=${newToken}`));
  } catch (err) {
    console.error("❌ GOOGLE AUTH CALLBACK ERROR:", err);
    const clientOrigin = getClientOrigin(req);
    const token = getToken(req);
    if (token || (req.query?.state && decodeOauthState(req.query.state)?.mode === "link")) {
      const msg = encodeURIComponent(err.message || "Account connection failed.");
      return res.redirect(appendVercelBypassToken(`${clientOrigin}/profile?oauth_error=${msg}`));
    }
    return res.redirect(appendVercelBypassToken(`${clientOrigin}/login?oauth=error`));
  }
}

export async function disconnectGoogle(req, res, next) {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found." });

    const hasAlternative = user.linkedProviders.length > 1 || (user.password && user.password.length > 20);
    if (!hasAlternative) {
      return res.status(400).json({ message: "Cannot disconnect your only login method." });
    }

    user.linkedProviders = user.linkedProviders.filter(p => p !== "google");
    user.googleId = null;
    user.googleEmail = "";
    await user.save();
    return res.json({ message: "Google account disconnected successfully.", user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}
