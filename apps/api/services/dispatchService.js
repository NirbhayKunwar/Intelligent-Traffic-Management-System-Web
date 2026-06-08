import { User } from "../modules/auth/auth.model.js";
import { sendAccidentEmail } from "./emailService.js";

export class EmergencyDispatchService {
  async triggerFullResponse(locationStr, message, incidentGeo = {}) {
    const etas = {
      police: Math.floor(Math.random() * (5 - 2 + 1)) + 2,    // 2-5 mins
      ambulance: Math.floor(Math.random() * (7 - 4 + 1)) + 4, // 4-7 mins
      fire: Math.floor(Math.random() * (10 - 6 + 1)) + 6      // 6-10 mins
    };

    console.log("\n" + "=".repeat(50));
    console.log("🚑 MULTI-AGENCY EMERGENCY DISPATCH");
    console.log(`📍 LOCATION: ${locationStr}`);
    console.log(`📢 ALERT: ${message}`);
    console.log("--------------------------------------------------");

    try {
      const allUsers = await User.find();
      const googleLinkedUsers = allUsers.filter((u) => {
        const providers = Array.isArray(u.linkedProviders) ? u.linkedProviders : [];
        return providers.includes("google") || Boolean(u.googleId);
      });

      const recipients = [];
      for (const user of googleLinkedUsers) {
        const providers = Array.isArray(user.linkedProviders) ? user.linkedProviders : [];
        let recipient = String(user.googleEmail || "").trim().toLowerCase();

        if (!recipient) {
          const fallbackEmail = String(user.email || "").trim().toLowerCase();
          if (fallbackEmail) {
            recipient = fallbackEmail;
            user.googleEmail = fallbackEmail;
            if (!providers.includes("google")) user.linkedProviders = [...providers, "google"];
            await user.save().catch((err) => console.warn(`Google email backfill failed: ${err.message}`));
          }
        }

        if (recipient) recipients.push(recipient);
      }

      if (recipients.length > 0) {
        console.log(`📡 BROADCAST: Found ${recipients.length} verified citizens. Dispatching alerts...`);
        const details = {
          location: locationStr,
          message,
          latitude: incidentGeo.latitude,
          longitude: incidentGeo.longitude,
          etas
        };

        // Fire emails in background
        Promise.all(recipients.map((email) => sendAccidentEmail(email, details)))
          .then(() => console.log("📡 BROADCAST: All alerts dispatched successfully."))
          .catch((err) => console.error("❌ BROADCAST ERROR:", err));
      } else {
        console.log("📡 BROADCAST: Skip. Reason: No verified citizens found.");
      }
    } catch (err) {
      console.error("❌ Dispatch broadcast logic failure:", err.message);
    }

    console.log(`🚓 Police: Dispatched (ETA: ${etas.police}m)`);
    console.log(`🚑 Ambulance: Dispatched (ETA: ${etas.ambulance}m)`);
    console.log(`🚒 Fire Dept: Dispatched (ETA: ${etas.fire}m)`);
    console.log("=".repeat(50) + "\n");

    return etas;
  }
}
