import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

console.log("Loaded email config:");
console.log("EMAIL_USER:", user);
console.log("EMAIL_PASS:", pass ? "****** (set)" : "NOT SET");

if (!user || !pass) {
  console.error("Missing EMAIL_USER or EMAIL_PASS in environment.");
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass }
});

async function runTest() {
  try {
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("✅ Nodemailer SMTP connection verified successfully!");

    console.log("Sending a test email to the configured email user...");
    const info = await transporter.sendMail({
      from: `"ITMS Test" <${user}>`,
      to: user,
      subject: "ITMS SMTP Test Email",
      text: "If you received this, Nodemailer is working perfectly with Gmail!"
    });
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Test failed:");
    console.error(err);
  }
}

runTest();
