import express from "express";
import { fetchSettings, updateCongestionThreshold } from "./settings.controller.js";
import { requireAuth, requireOperator } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, fetchSettings);
router.put("/congestion-threshold", requireAuth, requireOperator, updateCongestionThreshold);

export default router;
