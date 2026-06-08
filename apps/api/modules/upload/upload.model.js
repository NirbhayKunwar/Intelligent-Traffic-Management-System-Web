import mongoose from "mongoose";
import { nanoid } from "nanoid";

const uploadSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  originalName: { type: String },
  filename: { type: String },
  path: { type: String }, // Cloud URL
  cloudinaryId: { type: String },
  size: { type: Number },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, id: false });

export const Upload = mongoose.model("Upload", uploadSchema);
