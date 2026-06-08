import express from "express";
import { getSummary, getCongestionTrend } from "./metrics.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/summary", requireAuth, getSummary);
router.get("/congestion-trend", requireAuth, getCongestionTrend);

export default router;
