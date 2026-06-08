import mongoose from "mongoose";
import { nanoid } from "nanoid";

const jobSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  type: { type: String, enum: ["congestion", "accident"], required: true },
  status: { type: String, enum: ["queued", "running", "completed", "failed"], default: "queued" },
  sourceType: { type: String },
  sourceId: { type: String },
  sourceLabel: { type: String },
  streamUrl: { type: String },
  threshold: { type: Number },
  result: { type: Object },
  error: { type: String },
  progress: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, id: false });

export const InferenceJob = mongoose.model("InferenceJob", jobSchema);
