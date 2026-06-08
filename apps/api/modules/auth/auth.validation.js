import { validateUser, validateEmail, validatePassword } from "@itms/shared";

export function validateSignupBody(req, res, next) {
  const { email, password, fullName, role } = req.body || {};
  
  const userValidation = validateUser({ email, fullName, role });
  if (!userValidation.isValid) {
    return res.status(400).json({ message: userValidation.errors[0] });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  next();
}

export function validateLoginBody(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  next();
}
