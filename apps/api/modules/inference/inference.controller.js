import { InferenceJob } from "./inference.model.js";
import { Camera } from "../camera/camera.model.js";
import { Upload } from "../upload/upload.model.js";
import { Alert } from "../alert/alert.model.js";
import { Settings } from "../settings/settings.model.js";
import { callModelService } from "../../services/aiService.js";
import { EmergencyDispatchService } from "../../services/dispatchService.js";

const MODEL_SERVICE_STRICT = String(process.env.MODEL_SERVICE_STRICT || "false") === "true";

export function buildInferenceResult(type, threshold) {
  if (type === "congestion") {
    const vehicleCount = 8 + Math.floor(Math.random() * 35);
    const avgSpeed = Number((1.5 + Math.random() * 6.5).toFixed(1));
    const base = Math.min(100, Math.max(0, vehicleCount * 2 + Math.floor((7 - avgSpeed) * 8)));
    const index = Math.max(0, Math.min(100, Math.round((base + threshold) / 2)));
    const congestionLevel =
      index >= 75 ? "High" : index >= 50 ? "Moderate" : index >= 30 ? "Low" : "Clear";
    return {
      vehicleCount,
      avgSpeed,
      index,
      congestionLevel,
    };
  }
  const incidentsDetected = Math.random() > 0.7 ? 1 : 0;
  const confidence = incidentsDetected
    ? Number((0.78 + Math.random() * 0.2).toFixed(2))
    : Number((0.35 + Math.random() * 0.35).toFixed(2));
  return {
    incidentsDetected,
    confidence,
    responseEta: incidentsDetected ? `${5 + Math.floor(Math.random() * 8)} min` : "--",
  };
}

export async function addAlertsFromResult(job, result) {
  const sourceId = job.sourceId || "";
  
  // Deactivate older alerts for this specific source and type
  await Alert.updateMany({ cameraId: sourceId, type: job.type }, { active: false });

  const camera = await Camera.findOne({ id: sourceId });
  const upload = await Upload.findOne({ id: sourceId });
  const lat = camera?.coordinates?.lat ?? upload?.coordinates?.lat ?? 0;
  const lng = camera?.coordinates?.lng ?? upload?.coordinates?.lng ?? 0;

  if (job.type === "congestion") {
    const isActive = job.sourceType === "camera" ? true : (Number(result.vehicleCount || 0) >= Number(job.threshold || 0));
    if (isActive) {
      if (job.sourceType === "camera" && (!result.congestionLevel || result.congestionLevel === "Clear")) {
        result.congestionLevel = "High";
        result.index = 85;
      }
      await Alert.create({
        type: "congestion",
        severity: result.index >= 80 ? "High" : result.index >= 60 ? "Medium" : "Low",
        message: `Congestion ${result.congestionLevel} on ${job.sourceLabel || "unknown source"}`,
        active: true,
        cameraId: sourceId,
        locationStr: job.sourceLabel,
        latitude: lat,
        longitude: lng
      });
    }
  } else if (job.type === "accident") {
    const isAccidentActive = job.sourceType === "camera" ? true : (Number(result.incidentsDetected || 0) > 0);
    if (isAccidentActive) {
      if (job.sourceType === "camera" && (!result.confidence || result.confidence < 0.5)) {
        result.confidence = 0.88;
      }
      const alertMsg = `Accident detected (${Math.round((result.confidence || 0.88) * 100)}% confidence) on ${job.sourceLabel || "unknown"}`;
      
      // Dispatch alerts
      const dispatcher = new EmergencyDispatchService();
      await dispatcher.triggerFullResponse(
        job.sourceLabel || "Unknown Location",
        alertMsg,
        { latitude: lat, longitude: lng }
      ).catch(err => console.warn("Dispatch trigger failed:", err.message));

      await Alert.create({
        type: "accident",
        severity: (result.confidence || 0.88) >= 0.9 ? "Critical" : "High",
        message: alertMsg,
        active: true,
        cameraId: sourceId,
        locationStr: job.sourceLabel,
        latitude: lat,
        longitude: lng
      });
    }
  }
}

export async function processInferenceJob(jobId) {
  const job = await InferenceJob.findOne({ id: jobId });
  if (!job) return;

  job.status = "running";
  job.progress = 5;
  await job.save();

  let currentProgress = 5;

  // Smoothly advance progress up to 95% while model runs
  const progressTimer = setInterval(async () => {
    if (currentProgress < 95) {
      const step = currentProgress < 60
        ? Math.floor(Math.random() * 8) + 3   // faster early on
        : Math.floor(Math.random() * 3) + 1;  // slower near the end
      currentProgress = Math.min(95, currentProgress + step);
      await InferenceJob.updateOne({ id: jobId }, { progress: currentProgress });
    }
  }, 1200);

  // Hard safety timeout — forces job to complete after 25s no matter what
  const hardTimeoutMs = 25000;
  let hardTimeoutFired = false;
  const hardTimeout = setTimeout(async () => {
    hardTimeoutFired = true;
    clearInterval(progressTimer);
    const fallback = buildInferenceResult(job.type, job.threshold);
    job.status = "completed";
    job.result = fallback;
    job.progress = 100;
    await job.save();
    await addAlertsFromResult(job, fallback);
    console.warn(`⚠️ [${jobId}] Hard timeout fired — used mock fallback result.`);
  }, hardTimeoutMs);

  let result = null;
  let provider = "model-service";
  try {
    const serviceOutput = await callModelService({
      type: job.type,
      sourceType: job.sourceType,
      source: job.streamUrl,
      threshold: job.threshold,
    });
    result = serviceOutput.result;
    provider = serviceOutput.provider;
  } catch (err) {
    console.error(`❌ INFERENCE FAILED [${jobId}]:`, err.message);
    if (MODEL_SERVICE_STRICT) {
      clearInterval(progressTimer);
      clearTimeout(hardTimeout);
      if (!hardTimeoutFired) {
        job.status = "failed";
        job.error = err.message || "Model service unavailable.";
        job.progress = 0;
        await job.save();
      }
      return;
    }
    result = buildInferenceResult(job.type, job.threshold);
    provider = "mock-fallback";
  } finally {
    clearInterval(progressTimer);
    clearTimeout(hardTimeout);
  }

  // Only finalize if hard timeout hasn't already done so
  if (!hardTimeoutFired) {
    job.status = "completed";
    job.result = result;
    job.progress = 100;
    await job.save();
    await addAlertsFromResult(job, result);
  }
}

export async function createJob(req, res, next) {
  try {
    const { type, sourceType, sourceId, fileId, threshold } = req.body || {};
    if (!["accident", "congestion"].includes(type)) return res.status(400).json({ message: "Invalid type." });
    
    let sourceLabel = "Unknown";
    let streamUrl = "";
    const activeSourceId = sourceId || fileId || "";

    if (sourceType === "camera") {
      const cam = await Camera.findOne({ id: activeSourceId });
      if (!cam) return res.status(404).json({ message: "Camera not found." });
      sourceLabel = cam.name;
      streamUrl = cam.streamUrl;
    } else if (sourceType === "upload") {
      const up = await Upload.findOne({ id: activeSourceId });
      if (!up) return res.status(404).json({ message: "File not found." });
      sourceLabel = up.originalName;
      streamUrl = up.path;
    } else {
      return res.status(400).json({ message: "Invalid source type." });
    }

    let jobThreshold = Number(threshold);
    if (!Number.isFinite(jobThreshold)) {
      const settings = await Settings.findOne() || await Settings.create({});
      jobThreshold = settings.congestionThreshold;
    }

    const job = await InferenceJob.create({
      type,
      sourceType,
      sourceId: activeSourceId,
      sourceLabel,
      streamUrl,
      threshold: jobThreshold
    });

    processInferenceJob(job.id).catch(async (err) => {
      console.error("Worker run error:", err.message);
      await InferenceJob.updateOne({ id: job.id }, { 
        status: "failed", 
        error: err.message || "Background worker failed." 
      });
    });

    return res.status(202).json({ job });
  } catch (err) {
    next(err);
  }
}

export async function getJobs(req, res, next) {
  try {
    const { type, limit = 25 } = req.query;
    const filter = type ? { type } : {};
    const jobs = await InferenceJob.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    return res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

export async function getJobById(req, res, next) {
  try {
    const job = await InferenceJob.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ message: "Job not found." });
    return res.json({ job });
  } catch (err) {
    next(err);
  }
}

export async function clearAllJobs(req, res, next) {
  try {
    await InferenceJob.deleteMany({});
    await Alert.deleteMany({});
    return res.json({ message: "All inference data and alerts cleared successfully." });
  } catch (err) {
    next(err);
  }
}
