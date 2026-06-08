import { Camera } from "./camera.model.js";
import { mapCameraResponse } from "./camera.service.js";
import { streamLocalVideo } from "../../utils/videoStreamer.js";
import { Upload } from "../upload/upload.model.js";

export async function getCameras(req, res, next) {
  try {
    const cameras = await Camera.find().sort({ lastActive: -1 });
    return res.json({ cameras: cameras.map(mapCameraResponse) });
  } catch (err) {
    next(err);
  }
}

export async function getCameraById(req, res, next) {
  try {
    const camera = await Camera.findOne({ id: req.params.id });
    if (!camera) return res.status(404).json({ message: "Camera not found." });
    return res.json({ camera: mapCameraResponse(camera) });
  } catch (err) {
    next(err);
  }
}

export async function createCamera(req, res, next) {
  try {
    const { name, url, stream, status, latitude, longitude, modelHint } = req.body || {};
    if (!name || !url) return res.status(400).json({ message: "Name and stream URL are required." });

    const camera = await Camera.create({
      name: String(name).trim(),
      streamUrl: String(url).trim(),
      stream: String(stream || "Auto").trim(),
      status: String(status || "Online").trim(),
      coordinates: {
        lat: Number(latitude) || 0,
        lng: Number(longitude) || 0
      },
      type: String(modelHint || "Bullet").trim()
    });

    return res.status(201).json({ camera: mapCameraResponse(camera) });
  } catch (err) {
    next(err);
  }
}

export async function updateCamera(req, res, next) {
  try {
    const camera = await Camera.findOne({ id: req.params.id });
    if (!camera) return res.status(404).json({ message: "Camera not found." });

    const { name, url, stream, status, latitude, longitude, modelHint } = req.body || {};
    if (name) camera.name = String(name).trim();
    if (url) camera.streamUrl = String(url).trim();
    if (stream) camera.stream = String(stream).trim();
    if (status) camera.status = String(status).trim();
    if (latitude !== undefined) camera.coordinates.lat = Number(latitude) || 0;
    if (longitude !== undefined) camera.coordinates.lng = Number(longitude) || 0;
    if (modelHint) camera.type = String(modelHint).trim();

    await camera.save();
    return res.json({ camera: mapCameraResponse(camera) });
  } catch (err) {
    next(err);
  }
}

export async function deleteCamera(req, res, next) {
  try {
    const result = await Camera.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Camera not found." });
    return res.json({ message: "Camera deleted." });
  } catch (err) {
    next(err);
  }
}

export async function importUpload(req, res, next) {
  try {
    const uploadId = String(req.body?.uploadId || "");
    if (!uploadId) return res.status(400).json({ message: "uploadId is required." });

    const record = await Upload.findOne({ id: uploadId });
    if (!record) return res.status(404).json({ message: "Upload not found." });

    const camera = await Camera.create({
      name: `Deployed: ${record.originalName}`,
      streamUrl: record.path,
      stream: "FILE",
      status: "Online",
      coordinates: {
        lat: record.coordinates.lat || 30.3165,
        lng: record.coordinates.lng || 78.0322
      },
      type: "Bullet"
    });

    return res.status(201).json({ camera: mapCameraResponse(camera) });
  } catch (err) {
    next(err);
  }
}

export async function streamCameraMedia(req, res, next) {
  try {
    const camera = await Camera.findOne({ id: req.params.id });
    if (!camera) return res.status(404).json({ message: "Camera not found." });

    const rawUrl = String(camera.streamUrl || "");
    const isLocalFile = /^[a-zA-Z]:\\|^\//.test(rawUrl);
    if (!isLocalFile) return res.status(400).json({ message: "This camera source is not a local file." });
    
    return streamLocalVideo(req, res, rawUrl);
  } catch (err) {
    next(err);
  }
}
