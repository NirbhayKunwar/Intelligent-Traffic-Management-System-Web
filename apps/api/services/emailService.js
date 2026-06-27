import nodemailer from "nodemailer";
import "../loadEnv.js";

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
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max 5 parallel connections
      maxMessages: 100, // Max 100 messages per connection
      rateLimit: 10, // Max 10 messages per second
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000, // 5 seconds greeting timeout
      socketTimeout: 10000, // 10 seconds socket timeout
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

export async function sendBrandedResetOtpEmail(recipientEmail, otp) {
  const user = getEmailUser();
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Branded Reset OTP email for ${recipientEmail}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"ITMS Security" <${user}>`,
    to: recipientEmail,
    subject: "Password Reset Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; padding: 32px; color: #f8fafc; border-radius: 16px; max-width: 550px; margin: auto; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #10b981); padding: 12px 20px; border-radius: 12px; font-weight: bold; color: #ffffff; font-size: 20px; letter-spacing: 1.5px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
            ITMS COMMAND CENTER
          </div>
        </div>
        
        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
            Password Reset Verification Code
          </h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            You requested to reset the password for your ITMS (Intelligent Traffic Management System) account. Please use the verification code below to authorize this request:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #34d399; background-color: #0f172a; padding: 14px 28px; border-radius: 8px; border: 1px dashed #34d399; display: inline-block;">
              ${otp}
            </span>
          </div>
          
          <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin-top: 24px; margin-bottom: 16px;">
            <p style="color: #fca5a5; font-size: 12px; line-height: 1.5; margin: 0; font-weight: 500;">
              <strong>⚠️ Expiration warning:</strong> This code is valid for exactly <strong>10 minutes</strong>. Once expired or validated, it will become inactive to protect your account.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center;">
          <p style="color: #64748b; font-size: 11px; line-height: 1.6; margin: 0;">
            <strong>Security Notice:</strong> If you did not request a password reset, please ignore this message. Your credentials remain safe and no changes have been applied.
          </p>
          <p style="color: #475569; font-size: 10px; margin-top: 12px; margin-bottom: 0;">
            &copy; 2026 ITMS Inc. Systems Division. All rights reserved.
          </p>
        </div>
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

export async function sendCongestionEmail(recipientEmail, congestionDetails) {
  const user = getEmailUser();
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Email skip — EMAIL_USER/EMAIL_PASS not set. Congestion alert details for ${recipientEmail}:`, congestionDetails);
    return;
  }

  const lat = Number(congestionDetails?.latitude);
  const lng = Number(congestionDetails?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const mapsUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : "";
  const locationDetailsHtml = hasCoords
    ? `
        <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        <p><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
      `
    : "";

  await transporter.sendMail({
    from: `"ITMS Traffic Alerts" <${user}>`,
    to: recipientEmail,
    subject: "⚠️ TRAFFIC ALERT: High Congestion Detected",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ff9800; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #ff9800;">⚠️ Traffic Congestion Alert</h2>
        <p>This is an automated traffic alert from the <strong>Intelligent Traffic Management System (ITMS)</strong>.</p>
        <hr/>
        <p><strong>Incident:</strong> High traffic congestion detected.</p>
        <p><strong>Location:</strong> ${congestionDetails.location}</p>
        ${locationDetailsHtml}
        <p><strong>Details:</strong> ${congestionDetails.message}</p>
        <hr/>
        <p style="font-size: 13px; color: #333;">
          Please plan your route accordingly and expect delays or seek alternative paths if possible.
        </p>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          Drive safe, <br/>ITMS Command Center
        </p>
      </div>
    `,
  });
}
