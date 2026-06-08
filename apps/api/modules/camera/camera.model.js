import mongoose from "mongoose";
import { nanoid } from "nanoid";

const cameraSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  name: { type: String, required: true },
  location: { type: String },
  status: { type: String, enum: ["Online", "Offline"], default: "Online" },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  streamUrl: { type: String },
  stream: { type: String, default: "Auto" },
  type: { type: String, default: "Bullet" },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true, id: false });

export const Camera = mongoose.model("Camera", cameraSchema);
