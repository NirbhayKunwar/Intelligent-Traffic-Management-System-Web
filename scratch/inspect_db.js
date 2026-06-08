import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { User } from "../apps/api/modules/auth/auth.model.js";
import { Upload } from "../apps/api/modules/upload/upload.model.js";

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const users = await User.find({}, { password: 0 });
  console.log("=== USERS ===");
  console.log(users);

  const uploads = await Upload.find({});
  console.log("=== UPLOADS ===");
  console.log(uploads);

  await mongoose.connection.close();
}

run().catch(console.error);
