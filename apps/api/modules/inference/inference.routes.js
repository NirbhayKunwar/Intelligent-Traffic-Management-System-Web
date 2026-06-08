import express from "express";
import { createJob, getJobs, getJobById, clearAllJobs } from "./inference.controller.js";
import { requireAuth, requireOperator } from "../../middleware/auth.js";

const router = express.Router();

router.post("/jobs", requireAuth, requireOperator, createJob);
router.get("/jobs", requireAuth, getJobs);
router.get("/jobs/:id", requireAuth, getJobById);
router.delete("/jobs", requireAuth, requireOperator, clearAllJobs);

export default router;
