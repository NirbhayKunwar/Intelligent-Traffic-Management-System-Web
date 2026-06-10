import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load default process environment
dotenv.config();

// Explicitly load root-level .env
const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
}

// Explicitly load app-level .env (takes precedence)
const dataEnvPath = path.join(__dirname, "data", ".env");
if (existsSync(dataEnvPath)) {
  dotenv.config({ path: dataEnvPath, override: true });
}
