import mongoose from "mongoose";
import { nanoid } from "nanoid";

const alertSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  type: { type: String, required: true },
  severity: { type: String, default: "Medium" },
  locationStr: { type: String },
  cameraId: { type: String },
  message: { type: String },
  active: { type: Boolean, default: true },
  latitude: { type: Number },
  longitude: { type: Number },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["Active", "Acknowledged", "Resolved"], default: "Active" }
}, { timestamps: true, id: false });

export const Alert = mongoose.model("Alert", alertSchema);
