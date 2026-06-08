import express from "express";
import { 
  getUploads, 
  uploadVideoFile, 
  updateUploadCoordinates, 
  streamUploadMedia, 
  deleteUpload 
} from "./upload.controller.js";
import { requireAuth, requireOperator } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getUploads);
router.post("/video", requireAuth, requireOperator, uploadVideoFile);
router.put("/:id/coordinates", requireAuth, requireOperator, updateUploadCoordinates);
router.get("/media/:id", requireAuth, streamUploadMedia);
router.delete("/:id", requireAuth, requireOperator, deleteUpload);

export default router;
