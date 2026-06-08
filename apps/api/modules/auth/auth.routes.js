import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword, 
  checkSession, 
  logout, 
  handleGoogleCallback, 
  disconnectGoogle 
} from "./auth.controller.js";
import { validateSignupBody, validateLoginBody } from "./auth.validation.js";
import { requireAuth } from "../../middleware/auth.js";
import { getToken } from "../../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

router.post("/signup", validateSignupBody, signup);
router.post("/login", validateLoginBody, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", requireAuth, checkSession);
router.post("/logout", logout);

// Google OAuth initiate
router.get("/google", (req, res, next) => {
  const { mode, role, organization } = req.query;
  let linkUserId = undefined;

  if (mode === "link") {
    const token = getToken(req);
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        linkUserId = payload.sub;
      } catch {}
    }
  }

  const oauthMeta = {
    mode: mode === "link" ? "link" : (mode === "signup" ? "signup" : "login"),
    role: typeof role === "string" ? role : undefined,
    organization: typeof organization === "string" ? organization : undefined,
    linkUserId
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
});

// Google OAuth callback
router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "/login?oauth=failed", session: false }), 
  handleGoogleCallback
);

// Google OAuth disconnect
router.post("/google/disconnect", requireAuth, disconnectGoogle);

export default router;
