import { v2 as cloudinary } from "cloudinary";
// CloudinaryStorage import removed; using memory storage.
import multer from "multer";
import { nanoid } from "nanoid";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Scan folders diagnostic
cloudinary.api.root_folders()
  .then(res => {
    const folders = res.folders?.map(f => f.name) || [];
    console.log("📁 CLOUDINARY FOUND FOLDERS:", folders);
  })
  .catch(err => console.warn("📁 Cloudinary folder scan fail:", err.message));

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || 300);

export const profilePicStorage = multer.memoryStorage();

export const videoUploadStorage = multer.memoryStorage();

export const uploadProfilePic = multer({ storage: profilePicStorage });
export const uploadVideo = multer({
  storage: videoUploadStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

export { cloudinary };
