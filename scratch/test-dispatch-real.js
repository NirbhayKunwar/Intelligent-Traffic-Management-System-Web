import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { User } from "../apps/api/modules/auth/auth.model.js";
import { EmergencyDispatchService } from "../apps/api/services/dispatchService.js";

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to DB");

  const dispatcher = new EmergencyDispatchService();

  console.log("\n--- SIMULATING ACCIDENT ALERT DISPATCH ---");
  await dispatcher.triggerFullResponse(
    "Test Intersection A",
    "Accident detected (95% confidence) on Test Intersection A",
    { latitude: 28.07105, longitude: 81.631283 }
  );

  console.log("\n--- SIMULATING CONGESTION ALERT DISPATCH ---");
  await dispatcher.triggerCongestionAlert(
    "Test Corridor B",
    "Congestion High on Test Corridor B",
    { latitude: 28.076663, longitude: 81.637117 }
  );

  console.log("Disconnecting from MongoDB...");
  await mongoose.connection.close();
  console.log("✅ Done.");
}

run().catch((err) => {
  console.error("❌ Test error:", err);
  mongoose.connection.close();
});
