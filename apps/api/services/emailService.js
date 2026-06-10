import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);

function getEmailUser() { return process.env.EMAIL_USER; }
function getEmailPass() { return process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD; }

// Lazy transporter — created on first use so env vars are always fresh
let _transporter = null;
function getTransporter() {
  const user = getEmailUser();
  const pass = getEmailPass();
  if (!user || !pass) return null;

  if (!_transporter) {
    const options = {
      auth: { user, pass },
    };

    // Optimize configurations specifically for Gmail to prevent authentication/connection issues
    if (EMAIL_HOST === "smtp.gmail.com" || EMAIL_HOST.includes("gmail")) {
      options.service = "gmail";
    } else {
      options.host = EMAIL_HOST;
      options.port = EMAIL_PORT;
      options.secure = EMAIL_PORT === 465; // True for 465, false for other ports
    }

    _transporter = nodemailer.createTransport(options);
  }
  return _transporter;
}

export async function sendPasswordResetEmail(recipientEmail, resetLink) {
  const user = getEmailUser();
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Password reset email for ${recipientEmail}: ${resetLink}`);
    return;
  }

  await transporter.sendMail({
    from: `"ITMS Security" <${user}>`,
    to: recipientEmail,
    subject: "Reset your ITMS password",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #d7dee8; border-radius: 8px;">
        <h2 style="color: #0f172a;">Reset your password</h2>
        <p>We received a request to reset the password for your ITMS account.</p>
        <p>
          <a href="${resetLink}" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; padding: 10px 14px; border-radius: 6px; background: #0891b2; color: #ffffff; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetOtpEmail(recipientEmail, otp) {
  const user = getEmailUser();
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Password reset OTP email for ${recipientEmail}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"ITMS Security" <${user}>`,
    to: recipientEmail,
    subject: "Your ITMS Password Reset OTP",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #d7dee8; border-radius: 8px; max-width: 500px; margin: auto;">
        <h2 style="color: #0f172a; text-align: center;">Verify Password Reset</h2>
        <p>You requested to reset the password for your ITMS account.</p>
        <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0891b2; background: #f0f9ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #0891b2;">
            ${otp}
          </span>
        </div>
        <p style="color: #475569; font-size: 14px;">This OTP code is valid for 10 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordChangeOtpEmail(recipientEmail, otp) {
  const user = getEmailUser();
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Password change OTP email for ${recipientEmail}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"ITMS Security" <${user}>`,
    to: recipientEmail,
    subject: "Your ITMS Password Change OTP",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #d7dee8; border-radius: 8px; max-width: 500px; margin: auto;">
        <h2 style="color: #0f172a; text-align: center;">Verify Password Update</h2>
        <p>You requested to change the password for your ITMS account.</p>
        <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0891b2; background: #f0f9ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #0891b2;">
            ${otp}
          </span>
        </div>
        <p style="color: #475569; font-size: 14px;">This OTP code is valid for 10 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAccidentEmail(recipientEmail, accidentDetails) {
  const user = getEmailUser();
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Email skip — EMAIL_USER/EMAIL_PASS not set. Accident alert details for ${recipientEmail}:`, accidentDetails);
    return;
  }

  const lat = Number(accidentDetails?.latitude);
  const lng = Number(accidentDetails?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const mapsUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : "";
  const locationDetailsHtml = hasCoords
    ? `
        <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        <p><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
      `
    : "";

  await transporter.sendMail({
    from: `"ITMS Emergency Alerts" <${user}>`,
    to: recipientEmail,
    subject: "🚨 URGENT: Traffic Incident/Accident Detected in Your Area",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #f44336; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #f44336;">🚨 Emergency Traffic Alert</h2>
        <p>This is an automated safety alert from the <strong>Intelligent Traffic Management System (ITMS)</strong>.</p>
        <hr/>
        <p><strong>Incident:</strong> Accident/Congestion detected with high confidence.</p>
        <p><strong>Location:</strong> ${accidentDetails.location}</p>
        ${locationDetailsHtml}
        <p><strong>Details:</strong> ${accidentDetails.message}</p>
        <hr/>
        <h3 style="color: #333;">Emergency Response Status:</h3>
        <ul>
          <li><strong>Police:</strong> Dispatched (ETA: ${accidentDetails.etas.police} min)</li>
          <li><strong>Medical:</strong> Dispatched (ETA: ${accidentDetails.etas.ambulance} min)</li>
          <li><strong>Fire Dept:</strong> Dispatched (ETA: ${accidentDetails.etas.fire} min)</li>
        </ul>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          Please avoid this area to clear the way for emergency responders.<br/>
          Drive safe, <br/>ITMS Command Center
        </p>
      </div>
    `,
  });
}

export async function verifyEmailTransporter() {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[emailService] EMAIL_USER or EMAIL_PASS not set — email sending is disabled.");
    return false;
  }
  try {
    await transporter.verify();
    console.log("[emailService] ✅ SMTP transporter verified successfully.");
    return true;
  } catch (err) {
    console.error("[emailService] ❌ Transporter verify failed:", err.message);
    return false;
  }
}
