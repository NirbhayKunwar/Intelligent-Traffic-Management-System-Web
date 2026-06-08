import express from "express";
import { getAlerts } from "./alert.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getAlerts);

export default router;
