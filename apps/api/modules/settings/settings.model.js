import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  id: { type: String, default: () => "global" },
  congestionThreshold: { type: Number, default: 10 },
  overlayEnabled: { type: Boolean, default: true }
}, { timestamps: true, id: false });

export const Settings = mongoose.model("Settings", settingsSchema);

export async function getSettings() {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
}
