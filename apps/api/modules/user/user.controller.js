import bcrypt from "bcryptjs";
import { Readable } from "stream";
import { User } from "../auth/auth.model.js";
import { 
  sanitizeUser, 
  signToken, 
  setAuthCookie 
} from "../auth/auth.service.js";
import { cloudinary } from "../../config/cloudinary.js";
import { sendPasswordChangeOtpEmail } from "../../services/emailService.js";

/**
 * Handles profile picture uploads to Cloudinary or image deletion.
 */
export async function updateProfilePic(req, res, next) {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found." });

    // If file is uploaded
    if (req.file) {
      // Delete old profile picture on Cloudinary if it exists
      if (user.cloudinaryId) {
        await cloudinary.uploader.destroy(user.cloudinaryId, { resource_type: "image" })
          .catch(err => console.warn("Cloud image delete fail:", err.message));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "itms_avatars",
        },
        async (error, result) => {
          if (error) {
            return res.status(500).json({ message: "Cloudinary upload failed: " + error.message });
          }

          try {
            user.profilePicture = result.secure_url;
            user.cloudinaryId = result.public_id;
            await user.save();

            return res.status(200).json({ user: sanitizeUser(user) });
          } catch (dbErr) {
            return next(dbErr);
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(req.file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    } else if (req.body && req.body.imageUrl === "") {
      // Remove profile photo
      if (user.cloudinaryId) {
        await cloudinary.uploader.destroy(user.cloudinaryId, { resource_type: "image" })
          .catch(err => console.warn("Cloud image delete fail:", err.message));
      }
      user.profilePicture = "";
      user.cloudinaryId = "";
      await user.save();
      return res.status(200).json({ user: sanitizeUser(user) });
    } else {
      return res.status(400).json({ message: "No file uploaded or action provided." });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Handles updating user profile details (fullName, email, and password).
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found." });

    const { fullName, email, oldPassword, newPassword } = req.body || {};

    if (fullName) {
      user.name = String(fullName).trim();
    }

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(400).json({ message: "Email is already taken by another user." });
        }
        user.email = normalizedEmail;
      }
    }

    if (newPassword) {
      const { otp } = req.body || {};
      if (!otp) {
        return res.status(400).json({ message: "Verification OTP code is required to update password." });
      }

      if (user.passwordResetToken !== otp || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP code." });
      }

      if (user.password && user.passwordSet !== false) {
        if (!oldPassword) {
          return res.status(400).json({ message: "Current password is required to change password." });
        }
        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) {
          return res.status(400).json({ message: "Incorrect current password." });
        }
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordSet = true;
      if (!user.linkedProviders.includes("password")) {
        user.linkedProviders.push("password");
      }

      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
    }

    await user.save();

    // Re-sign token and reset cookie with updated info
    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * Handles user account deletion.
 */
export async function deleteAccount(req, res, next) {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found." });

    // Clean up profile picture from Cloudinary
    if (user.cloudinaryId) {
      await cloudinary.uploader.destroy(user.cloudinaryId, { resource_type: "image" })
        .catch(err => console.warn("Cloud image delete fail:", err.message));
    }

    await User.deleteOne({ id: req.userId });

    // Clear auth cookie
    res.clearCookie("itms_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    next(err);
  }
}

/**
 * Generates and sends an OTP to user email for password change verification.
 */
export async function requestPasswordOtp(req, res, next) {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = otp;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins limit
    await user.save();

    const isProduction = process.env.NODE_ENV === "production";
    try {
      await sendPasswordChangeOtpEmail(user.email, otp);
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error("Password change OTP dispatch failure:", err.message);
      return res.status(500).json({ message: "Could not send verification OTP. Please try again later." });
    }

    const response = { message: "OTP has been sent to your email." };
    if (!isProduction && !process.env.EMAIL_USER) {
      response.otp = otp;
    }
    return res.json(response);
  } catch (err) {
    next(err);
  }
}
