import jwt from "jsonwebtoken";
import { User } from "../modules/auth/auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const TOKEN_COOKIE = "itms_token";

export function getToken(req) {
  const cookieToken = req.cookies?.[TOKEN_COOKIE];
  if (cookieToken) return cookieToken;
  
  const header = req.headers.authorization;
  if (!header) return null;
  
  const [type, value] = header.split(" ");
  if (type !== "Bearer") return null;
  return value || null;
}

export async function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized. Token missing." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findOne({ id: payload.sub });
    if (!user || (user.tokenVersion || 0) !== (payload.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    req.userId = payload.sub;
    req.userRole = payload.role;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export async function requireOperator(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role !== "operator") {
      return res.status(403).json({ message: "Operator access required.", role: user.role });
    }

    req.currentUser = user;
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Internal auth checking failure." });
  }
}
