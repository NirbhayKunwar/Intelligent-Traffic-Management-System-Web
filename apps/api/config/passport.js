import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Support dynamic fallback for GOOGLE_CALLBACK_URL if not provided
let GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

// In production, force localhost callback URLs to be relative paths (Passport dynamically resolves to request host/origin)
const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
if (isProd && typeof GOOGLE_CALLBACK_URL === "string" && GOOGLE_CALLBACK_URL.includes("localhost")) {
  try {
    const parsed = new URL(GOOGLE_CALLBACK_URL);
    GOOGLE_CALLBACK_URL = parsed.pathname;
    console.warn(`⚠️ Production environment detected. Localhost callback URL overridden to relative path: ${GOOGLE_CALLBACK_URL}`);
  } catch (err) {
    GOOGLE_CALLBACK_URL = "/api/auth/google/callback";
  }
}

export function configurePassport() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️ Google OAuth credentials missing. Google login will be unavailable.");
    return;
  }

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  ));
}
