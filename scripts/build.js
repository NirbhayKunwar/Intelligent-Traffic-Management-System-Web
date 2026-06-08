import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🛠️ Starting Monorepo Production Build...");

try {
  // 1. Install root dependencies
  console.log("\n📦 Bootstrapping dependencies...");
  execSync("npm install", { cwd: rootDir, stdio: "inherit" });

  // 2. Build Vite frontend
  console.log("\n⚡ Building React Frontend (apps/web)...");
  execSync("npm run build --workspace=capstone", { cwd: rootDir, stdio: "inherit" });

  console.log("\n✨ Monorepo build finished successfully!");
} catch (err) {
  console.error("\n❌ Build failed:", err.message);
  process.exit(1);
}
