import mongoose from "mongoose";
import { nanoid } from "nanoid";

const userSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  email: { type: String, required: true, unique: true },
  googleEmail: { type: String, default: "" },
  password: { type: String },
  name: { type: String },
  role: { type: String, enum: ["user", "operator"], default: "user" },
  profilePicture: { type: String },
  cloudinaryId: { type: String },
  linkedProviders: { type: [String], default: [] },
  googleId: { type: String },
  authProvider: { type: String },
  passwordSet: { type: Boolean },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
}, { timestamps: true, id: false });

export const User = mongoose.model("User", userSchema);
