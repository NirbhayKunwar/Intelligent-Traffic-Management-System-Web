import express from "express";
import { 
  getCameras, 
  getCameraById, 
  createCamera, 
  updateCamera, 
  deleteCamera, 
  importUpload, 
  streamCameraMedia 
} from "./camera.controller.js";
import { requireAuth, requireOperator } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getCameras);
router.get("/:id", requireAuth, getCameraById);

router.post("/", requireAuth, requireOperator, createCamera);
router.put("/:id", requireAuth, requireOperator, updateCamera);
router.delete("/:id", requireAuth, requireOperator, deleteCamera);

router.post("/import-upload", requireAuth, requireOperator, importUpload);

router.get("/media/:id", streamCameraMedia);

export default router;
