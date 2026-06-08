import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ FATAL: MONGODB_URI is missing in environment variables");
  process.exit(1);
}

const poolSize = Number(process.env.MONGODB_POOL_SIZE || 10);

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: poolSize,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    const { host, name } = mongoose.connection;
    console.log(`🚀 Connected to MongoDB Atlas: ${host}/${name} (Pool size: ${poolSize})`);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}

// Connection event listeners
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection disconnected. Retrying...");
});

// Graceful connection shutdown
export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed gracefully.");
  }
}
