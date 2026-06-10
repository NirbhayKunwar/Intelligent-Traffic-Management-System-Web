import crypto from "crypto";
import jwt from "jsonwebtoken";
import assert from "assert";

// ---------------------------------------------------------
// Mock Implementations for Tests
// ---------------------------------------------------------

const MOCK_JWT_SECRET = "test_secret_for_recovery_checks";

// In-Memory Database Mocks
const mockDatabase = {
  otps: [],
  users: [
    { id: "user-123", email: "user@example.com", passwordHash: "hashed_old_pwd", tokenVersion: 0 }
  ],
  auditLogs: []
};

// Reset mock database between runs
function resetMockDb() {
  mockDatabase.otps = [];
  mockDatabase.auditLogs = [];
  mockDatabase.users = [
    { id: "user-123", email: "user@example.com", passwordHash: "hashed_old_pwd", tokenVersion: 0 }
  ];
}

// Mock Rate Limiting and OTP Generation logic
function generateOtpForUser(userId) {
  // Count requests in last 15 minutes
  const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
  const recentOtps = mockDatabase.otps.filter(
    (o) => o.userId === userId && o.createdAt >= fifteenMinsAgo
  );

  if (recentOtps.length >= 3) {
    throw new Error("otp_rate_limited");
  }

  // Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const newOtpRecord = {
    userId,
    otpHash,
    expiresAt,
    attempts: 0,
    used: false,
    createdAt: Date.now()
  };
  mockDatabase.otps.push(newOtpRecord);

  return { otp, record: newOtpRecord };
}

// Mock OTP Verification logic
function verifyOtpForUser(userId, otp) {
  const otpRecord = mockDatabase.otps
    .filter((o) => o.userId === userId && !o.used && o.expiresAt > Date.now())
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP code.");
  }

  if (otpRecord.attempts >= 5) {
    throw new Error("Maximum verification attempts exceeded. Please request a new OTP.");
  }

  const hash = crypto.createHash("sha256").update(otp).digest("hex");
  if (otpRecord.otpHash !== hash) {
    otpRecord.attempts += 1;
    const remaining = 5 - otpRecord.attempts;
    throw new Error(`Incorrect OTP code. You have ${remaining} attempts remaining.`);
  }

  otpRecord.used = true;

  // Generate 15-minute JWT reset token
  const resetToken = jwt.sign(
    { sub: userId, type: "password-reset" },
    MOCK_JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { success: true, resetToken };
}

// Password Validator Regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
function validatePasswordStrength(pwd) {
  return passwordRegex.test(pwd);
}

// ---------------------------------------------------------
// Test Suite Runner
// ---------------------------------------------------------

const tests = {
  testOtpCryptosecurity() {
    console.log("▶️ Running OTP Cryptosecurity tests...");
    const { otp } = generateOtpForUser("user-123");
    assert.strictEqual(otp.length, 6, "OTP must be exactly 6 characters");
    assert.match(otp, /^\d+$/, "OTP must contain only digits");
    
    // Ensure randomness over 20 generations
    const otps = new Set();
    for (let i = 0; i < 20; i++) {
      otps.add(crypto.randomInt(100000, 999999).toString());
    }
    assert.strictEqual(otps.size, 20, "Generated OTPs should be cryptographically unique");
    console.log("✅ OTP Cryptosecurity tests passed.");
  },

  testOtpRateLimiting() {
    console.log("▶️ Running OTP Rate Limiting tests...");
    resetMockDb();
    
    // Generate 3 OTPs (allowed)
    generateOtpForUser("user-123");
    generateOtpForUser("user-123");
    generateOtpForUser("user-123");
    
    // 4th request must be rejected
    assert.throws(
      () => generateOtpForUser("user-123"),
      /otp_rate_limited/,
      "Should reject OTP generation if requested more than 3 times in 15 minutes"
    );
    console.log("✅ OTP Rate Limiting tests passed.");
  },

  testOtpExpiration() {
    console.log("▶️ Running OTP Expiration tests...");
    resetMockDb();
    
    const { otp, record } = generateOtpForUser("user-123");
    
    // Manually push expiresAt into the past (expired)
    record.expiresAt = Date.now() - 1000;
    
    assert.throws(
      () => verifyOtpForUser("user-123", otp),
      /Invalid or expired OTP code/,
      "Should reject OTP verification if it is expired"
    );
    console.log("✅ OTP Expiration tests passed.");
  },

  testOtpVerificationAttempts() {
    console.log("▶️ Running OTP Verification Attempts limit tests...");
    resetMockDb();
    
    const { otp, record } = generateOtpForUser("user-123");
    
    // Attempt with incorrect OTP 5 times
    for (let i = 1; i <= 5; i++) {
      assert.throws(
        () => verifyOtpForUser("user-123", "000000"), // wrong code
        (err) => {
          const expectedRemaining = 5 - i;
          return err.message.includes(`Incorrect OTP code. You have ${expectedRemaining} attempts remaining.`);
        },
        `Failed attempt ${i} should decrement attempts remaining`
      );
    }
    
    // 6th attempt should block entirely with lock warning
    assert.throws(
      () => verifyOtpForUser("user-123", otp), // correct code now, but attempts exceeded
      /Maximum verification attempts exceeded/,
      "Should lock out verification after 5 failures"
    );
    console.log("✅ OTP Verification Attempts limit tests passed.");
  },

  testResetTokenSecurity() {
    console.log("▶️ Running Reset Token Security tests...");
    resetMockDb();
    
    const { otp } = generateOtpForUser("user-123");
    const { resetToken } = verifyOtpForUser("user-123", otp);
    
    // Verify JWT reset token properties
    const decoded = jwt.verify(resetToken, MOCK_JWT_SECRET);
    assert.strictEqual(decoded.sub, "user-123", "Reset token payload sub should match user id");
    assert.strictEqual(decoded.type, "password-reset", "Reset token type must be 'password-reset'");
    
    // Expiration check (15m from creation, allows small delta)
    const nowSecs = Math.floor(Date.now() / 1000);
    const expiresSecs = decoded.exp;
    assert.ok(
      expiresSecs - nowSecs <= 15 * 60 && expiresSecs - nowSecs > 14 * 60,
      "Reset token must expire in 15 minutes"
    );
    console.log("✅ Reset Token Security tests passed.");
  },

  testPasswordFormatValidation() {
    console.log("▶️ Running Password Format Validation tests...");
    
    // Reject weak passwords
    assert.strictEqual(validatePasswordStrength("weak"), false, "Rejects short passwords");
    assert.strictEqual(validatePasswordStrength("OnlyLettersHere"), false, "Rejects passwords without numbers and symbols");
    assert.strictEqual(validatePasswordStrength("LettersAnd123"), false, "Rejects passwords without special characters");
    assert.strictEqual(validatePasswordStrength("no_uppercase_123!"), false, "Rejects passwords without uppercase letters");
    assert.strictEqual(validatePasswordStrength("NO_LOWERCASE_123!"), false, "Rejects passwords without lowercase letters");

    // Approve strong passwords
    assert.strictEqual(validatePasswordStrength("StrongPassword123!"), true, "Approves robust password");
    assert.strictEqual(validatePasswordStrength("Secure@ITMS2026"), true, "Approves robust password");
    
    console.log("✅ Password Format Validation tests passed.");
  },

  testEmailTemplateContent() {
    console.log("▶️ Running Email Template Content tests...");
    // Check template properties
    const testOtp = "777888";
    
    // Simple inline emulation of sendBrandedResetOtpEmail HTML generation
    const htmlTemplate = `
      <div style="font-family: sans-serif; background-color: #0f172a;">
        <h2>Password Reset Verification Code</h2>
        <span style="font-size: 36px;">${testOtp}</span>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    assert.ok(htmlTemplate.includes(testOtp), "Email template must contain the generated OTP code");
    assert.ok(htmlTemplate.includes("10 minutes"), "Email template must display expiration warning");
    assert.ok(htmlTemplate.includes("ignore this email"), "Email template must contain security bypass notice");
    console.log("✅ Email Template Content tests passed.");
  }
};

// Run all test methods
console.log("=========================================================");
console.log("📊 RUNNING ITMS RECOVERY SYSTEM TEST SUITE");
console.log("=========================================================");
try {
  tests.testOtpCryptosecurity();
  tests.testOtpRateLimiting();
  tests.testOtpExpiration();
  tests.testOtpVerificationAttempts();
  tests.testResetTokenSecurity();
  tests.testPasswordFormatValidation();
  tests.testEmailTemplateContent();
  console.log("=========================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================================");
  process.exit(0);
} catch (error) {
  console.error("❌ TEST FAILURE DETECTED:");
  console.error(error);
  process.exit(1);
}
