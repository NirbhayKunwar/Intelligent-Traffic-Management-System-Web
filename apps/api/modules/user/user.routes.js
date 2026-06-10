import express from "express";
import { 
  updateProfilePic, 
  updateProfile, 
  deleteAccount,
  requestPasswordOtp
} from "./user.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { uploadProfilePic } from "../../config/cloudinary.js";

const router = express.Router();

// Route for updating/removing profile picture
router.post("/update-profile-pic", requireAuth, uploadProfilePic.single("image"), updateProfilePic);

// Route for requesting password change verification OTP
router.post("/password-otp", requireAuth, requestPasswordOtp);

// Route for updating user profile details (fullName, email, password)
router.put("/", requireAuth, updateProfile);

// Route for deleting user account
router.delete("/", requireAuth, deleteAccount);

export default router;
