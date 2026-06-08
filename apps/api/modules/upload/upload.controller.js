import { existsSync, unlink } from "fs";
import { Upload } from "./upload.model.js";
import { cloudinary, uploadVideo } from "../../config/cloudinary.js";
import { streamLocalVideo } from "../../utils/videoStreamer.js";

export async function getUploads(req, res, next) {
  try {
    const uploads = await Upload.find().sort({ timestamp: -1 });
    return res.json({
      uploads: uploads.map(u => ({
        id: u.id,
        originalName: u.originalName,
        filename: u.filename,
        size: u.size,
        createdAt: u.timestamp,
        latitude: u.coordinates.lat,
        longitude: u.coordinates.lng,
        previewUrl: `/api/uploads/media/${u.id}`,
      }))
    });
  } catch (err) {
    next(err);
  }
}

export function uploadVideoFile(req, res, next) {
  uploadVideo.single("video")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed." });
    if (!req.file) return res.status(400).json({ message: "No video file uploaded." });

    try {
      const record = await Upload.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path, // Cloudinary URL
        cloudinaryId: req.file.filename,
        size: req.file.size
      });

      return res.status(201).json({
        upload: {
          id: record.id,
          originalName: record.originalName,
          filename: record.filename,
          size: record.size,
          createdAt: record.timestamp,
          latitude: record.coordinates.lat,
          longitude: record.coordinates.lng,
          previewUrl: record.path,
        },
      });
    } catch (err) {
      next(err);
    }
  });
}

export async function updateUploadCoordinates(req, res, next) {
  try {
    const upload = await Upload.findOne({ id: req.params.id });
    if (!upload) return res.status(404).json({ message: "Uploaded video not found." });

    const { latitude, longitude } = req.body || {};
    if (latitude !== undefined) upload.coordinates.lat = Number(latitude);
    if (longitude !== undefined) upload.coordinates.lng = Number(longitude);

    await upload.save();
    return res.json({
      upload: {
        id: upload.id,
        latitude: upload.coordinates.lat,
        longitude: upload.coordinates.lng,
        previewUrl: `/api/uploads/media/${upload.id}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function streamUploadMedia(req, res, next) {
  try {
    const upload = await Upload.findOne({ id: req.params.id });
    if (!upload) {
      return res.status(404).json({ message: "Uploaded video not found." });
    }
    
    // Redirect to Cloudinary URL if absolute path
    if (upload.path && /^https?:\/\//i.test(upload.path)) {
      return res.redirect(upload.path);
    }
    
    return streamLocalVideo(req, res, upload.path);
  } catch (err) {
    next(err);
  }
}

export async function deleteUpload(req, res, next) {
  try {
    const upload = await Upload.findOne({ id: req.params.id });
    if (!upload) return res.status(404).json({ message: "Uploaded video not found." });

    if (upload.cloudinaryId) {
      await cloudinary.uploader.destroy(upload.cloudinaryId, { resource_type: "video" })
        .catch(err => console.warn("Cloud video delete fail:", err.message));
    } else if (upload.path && existsSync(upload.path)) {
      unlink(upload.path, (err) => {
        if (err) console.warn("Could not delete legacy file:", err.message);
      });
    }

    await Upload.deleteOne({ id: req.params.id });
    return res.json({ message: "Upload deleted successfully." });
  } catch (err) {
    next(err);
  }
}
