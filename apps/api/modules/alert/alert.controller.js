import { Alert } from "./alert.model.js";

export async function getAlerts(req, res, next) {
  try {
    const { active, type } = req.query;
    const filter = {};
    
    if (active === "true") filter.active = true;
    if (type) filter.type = type;

    const alerts = await Alert.find(filter).sort({ timestamp: -1 }).limit(100);
    return res.json({ alerts });
  } catch (err) {
    next(err);
  }
}
