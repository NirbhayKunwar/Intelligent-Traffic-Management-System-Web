import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // True for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail(recipientEmail, resetLink) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log(`[SIMULATION] Password reset email for ${recipientEmail}: ${resetLink}`);
    return;
  }

  const mailOptions = {
    from: `"ITMS Security" <${EMAIL_USER}>`,
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
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAccidentEmail(recipientEmail, accidentDetails) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log(`[SIMULATION] Email skip. Accident alert details for ${recipientEmail}:`, accidentDetails);
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

  const mailOptions = {
    from: `"ITMS Emergency Alerts" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: "🚨 URGENT: Traffic Incident/Accident Detected in Your Area",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f44336; border-radius: 8px;">
        <h2 style="color: #f44336;">Emergency Traffic Alert</h2>
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
          Please avoid this area to clear the way for emergency responders. 
          Drive safe, <br/>ITMS Command Center
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function verifyEmailTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return false;
  }
  try {
    await transporter.verify();
    return true;
  } catch (err) {
    console.error("Transporter verify fail:", err.message);
    return false;
  }
}
