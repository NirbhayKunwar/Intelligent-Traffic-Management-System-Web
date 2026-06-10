import { User } from "../modules/auth/auth.model.js";
import { sendAccidentEmail, sendCongestionEmail } from "./emailService.js";

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
      // Send to ALL registered users (both normal users and operator users) with a valid email
      const allUsers = await User.find({});
      const recipients = new Set();

      for (const user of allUsers) {
        // Prefer googleEmail if available (verified by Google OAuth)
        const googleEmail = String(user.googleEmail || "").trim().toLowerCase();
        const primaryEmail = String(user.email || "").trim().toLowerCase();

        if (googleEmail) recipients.add(googleEmail);
        if (primaryEmail) recipients.add(primaryEmail);
      }

      const recipientList = [...recipients].filter(Boolean);

      if (recipientList.length > 0) {
        console.log(`📡 BROADCAST: Found ${recipientList.length} verified recipients (including normal users and operators). Dispatching alerts...`);
        const details = {
          location: locationStr,
          message,
          latitude: incidentGeo.latitude,
          longitude: incidentGeo.longitude,
          etas
        };

        // Send emails and log individual failures (don't let one failure block others)
        const results = await Promise.allSettled(
          recipientList.map((email) => sendAccidentEmail(email, details))
        );

        let sent = 0, failed = 0;
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            sent++;
          } else {
            failed++;
            console.error(`❌ Alert email failed for ${recipientList[i]}:`, r.reason?.message || r.reason);
          }
        });

        console.log(`📡 BROADCAST: ${sent} sent, ${failed} failed out of ${recipientList.length} recipients.`);
      } else {
        console.log("📡 BROADCAST: Skip. Reason: No registered users found.");
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

  async triggerCongestionAlert(locationStr, message, incidentGeo = {}) {
    console.log("\n" + "=".repeat(50));
    console.log("⚠️ TRAFFIC CONGESTION DISPATCH");
    console.log(`📍 LOCATION: ${locationStr}`);
    console.log(`📢 ALERT: ${message}`);
    console.log("--------------------------------------------------");

    try {
      // Send to ALL registered users (both normal users and operator users) with a valid email
      const allUsers = await User.find({});
      const recipients = new Set();

      for (const user of allUsers) {
        const googleEmail = String(user.googleEmail || "").trim().toLowerCase();
        const primaryEmail = String(user.email || "").trim().toLowerCase();

        if (googleEmail) recipients.add(googleEmail);
        if (primaryEmail) recipients.add(primaryEmail);
      }

      const recipientList = [...recipients].filter(Boolean);

      if (recipientList.length > 0) {
        console.log(`📡 BROADCAST: Found ${recipientList.length} verified recipients (including normal users and operators). Dispatching congestion alerts...`);
        const details = {
          location: locationStr,
          message,
          latitude: incidentGeo.latitude,
          longitude: incidentGeo.longitude
        };

        const results = await Promise.allSettled(
          recipientList.map((email) => sendCongestionEmail(email, details))
        );

        let sent = 0, failed = 0;
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            sent++;
          } else {
            failed++;
            console.error(`❌ Congestion alert email failed for ${recipientList[i]}:`, r.reason?.message || r.reason);
          }
        });

        console.log(`📡 BROADCAST: ${sent} sent, ${failed} failed out of ${recipientList.length} recipients.`);
      } else {
        console.log("📡 BROADCAST: Skip. Reason: No registered users found.");
      }
    } catch (err) {
      console.error("❌ Dispatch congestion broadcast logic failure:", err.message);
    }
    console.log("=".repeat(50) + "\n");
  }
}
