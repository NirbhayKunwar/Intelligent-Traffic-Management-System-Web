import { getSettings } from "./settings.model.js";

export async function fetchSettings(req, res, next) {
  try {
    const settings = await getSettings();
    return res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateCongestionThreshold(req, res, next) {
  try {
    const value = Number(req.body?.value);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return res.status(400).json({ message: "Threshold must be a number between 0 and 100." });
    }
    const settings = await getSettings();
    settings.congestionThreshold = Math.round(value);
    await settings.save();
    return res.json({ settings });
  } catch (err) {
    next(err);
  }
}
