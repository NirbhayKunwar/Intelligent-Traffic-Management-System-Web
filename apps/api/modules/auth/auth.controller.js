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
import { sendPasswordResetEmail, sendPasswordResetOtpEmail, sendBrandedResetOtpEmail } from "../../services/emailService.js";
import { PasswordResetOTP } from "./otp.model.js";
import { writeAuditLog } from "./audit.model.js";
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
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    const genericMessage = "If an account exists for this email, a password reset OTP has been sent.";

    if (!user) {
      await writeAuditLog("unknown", req.ip, "forgot_password_ignored", `Attempted password reset for non-existent email: ${normalizedEmail}`);
      return res.json({ success: true, message: genericMessage });
    }

    // Rate Limiting: Max 3 OTP requests per 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentOtpCount = await PasswordResetOTP.countDocuments({
      userId: user.id,
      createdAt: { $gt: fifteenMinsAgo }
    });

    if (recentOtpCount >= 3) {
      await writeAuditLog(user.id, req.ip, "otp_rate_limited", "OTP generation blocked due to rate limits");
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait 15 minutes before trying again."
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await PasswordResetOTP.create({
      userId: user.id,
      otpHash,
      expiresAt
    });

    await writeAuditLog(user.id, req.ip, "otp_generated", "Password reset OTP generated and stored");

    if (isProduction) {
      try {
        await sendBrandedResetOtpEmail(user.email, otp);
      } catch (err) {
        console.error("Password reset OTP dispatch failure:", err.message);
        return res.status(500).json({
          success: false,
          message: "Could not send password reset OTP. Please try again later."
        });
      }
    } else {
      sendBrandedResetOtpEmail(user.email, otp).catch((err) => {
        console.error("Password reset OTP dispatch failure (background):", err.message);
      });
    }

    const response = { success: true, message: "OTP sent successfully" };
    if (!isProduction) {
      response.otp = otp;
    }
    return res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    if (!otp) return res.status(400).json({ success: false, message: "OTP code is required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code." });
    }

    // Find the most recent active, unused OTP record
    const otpRecord = await PasswordResetOTP.findOne({
      userId: user.id,
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code." });
    }

    // Enforce attempts count limit (max 5 verification attempts)
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum verification attempts exceeded. Please request a new OTP."
      });
    }

    const hash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpRecord.otpHash !== hash) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      await writeAuditLog(user.id, req.ip, "otp_verify_failed", `Failed OTP verification attempt. Total: ${otpRecord.attempts}`);
      
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP code. You have ${remaining} attempts remaining.`
      });
    }

    // OTP verified successfully
    otpRecord.used = true;
    await otpRecord.save();

    // Generate short-lived JWT reset token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { sub: user.id, type: "password-reset" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    await writeAuditLog(user.id, req.ip, "otp_verify_success", "OTP verification successful, reset token issued");

    return res.json({
      success: true,
      resetToken
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) return res.status(400).json({ success: false, message: "Reset token is required." });
    if (!newPassword) return res.status(400).json({ success: false, message: "New password is required." });

    // Validate JWT reset token
    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Password reset token is invalid or has expired." });
    }

    if (payload.type !== "password-reset") {
      return res.status(400).json({ success: false, message: "Invalid reset token type." });
    }

    // Password Validation Rules
    // Minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      await writeAuditLog(payload.sub, req.ip, "password_reset_failed", "Failed password reset due to weak password format");
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long, and contain one uppercase letter, one lowercase letter, one number, and one special character."
      });
    }

    const user = await User.findOne({ id: payload.sub });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordSet = true;
    if (!user.linkedProviders.includes("password")) {
      user.linkedProviders.push("password");
    }

    // Invalidate active sessions by incrementing token version
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await writeAuditLog(user.id, req.ip, "password_reset_success", "Password reset successfully, active sessions invalidated");

    return res.json({
      success: true,
      message: "Password reset successfully"
    });
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
