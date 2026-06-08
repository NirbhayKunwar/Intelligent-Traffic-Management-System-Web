import client from "prom-client";
import mongoose from "mongoose";
import { Alert } from "../apps/api/modules/alert/alert.model.js";

// Enable default metrics collection (CPU, memory, etc.)
client.collectDefaultMetrics();

// Custom metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});

export const mongoConnectionGauge = new client.Gauge({
  name: "db_connection_status",
  help: "MongoDB connection status (1 = connected, 0 = disconnected)",
  collect() {
    this.set(mongoose.connection.readyState === 1 ? 1 : 0);
  }
});

export const activeAlertsGauge = new client.Gauge({
  name: "active_traffic_alerts_total",
  help: "Total active congestion and accident alerts",
  async collect() {
    try {
      const activeCount = await Alert.countDocuments({ active: true });
      this.set(activeCount);
    } catch (err) {
      // Avoid failing metrics collection on error
      this.set(0);
    }
  }
});

export function setupMetricsMiddleware(app) {
  // Record response duration
  app.use((req, res, next) => {
    const start = process.hrtime();
    res.on("finish", () => {
      const diff = process.hrtime(start);
      const duration = diff[0] + diff[1] / 1e9;
      // Resolve path format for metrics grouping
      const route = req.route ? req.route.path : req.path;
      httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode).observe(duration);
    });
    next();
  });

  // Expose Prometheus endpoint
  app.get("/prometheus/metrics", async (req, res) => {
    res.setHeader("Content-Type", client.register.contentType);
    res.send(await client.register.metrics());
  });
}
