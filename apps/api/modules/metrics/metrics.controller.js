import { Alert } from "../alert/alert.model.js";
import { InferenceJob } from "../inference/inference.model.js";

export async function getSummary(req, res, next) {
  try {
    const activeAlerts = await Alert.find({ active: true });
    const accidents = activeAlerts.filter(a => String(a.type).toLowerCase() === "accident").length;
    const congestion = activeAlerts.filter(a => String(a.type).toLowerCase() === "congestion").length;
    
    return res.json({
      metrics: {
        accidents,
        congestion,
        alerts: activeAlerts.length
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCongestionTrend(req, res, next) {
  try {
    const hours = Number(req.query.hours || 12);
    const safeHours = Math.min(48, Math.max(1, hours));
    const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
    
    const jobs = await InferenceJob.find({
      type: "congestion",
      status: "completed",
      timestamp: { $gte: since }
    }).sort({ timestamp: -1 }).limit(50);

    const points = jobs
      .reverse()
      .map(j => Number(j.result?.vehicleCount ?? j.result?.index))
      .filter(val => Number.isFinite(val));

    return res.json({ points, hasRealData: points.length > 0 });
  } catch (err) {
    next(err);
  }
}
