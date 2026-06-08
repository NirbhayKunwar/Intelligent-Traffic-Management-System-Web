export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

export function validateUser(user) {
  const errors = [];
  if (!user.email || !validateEmail(user.email)) {
    errors.push("Invalid email format.");
  }
  if (!user.fullName || user.fullName.trim().length === 0) {
    errors.push("Full name is required.");
  }
  if (user.role && !["user", "operator"].includes(user.role)) {
    errors.push("Role must be either 'user' or 'operator'.");
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCamera(camera) {
  const errors = [];
  if (!camera.name || camera.name.trim().length === 0) {
    errors.push("Camera name is required.");
  }
  if (camera.coordinates) {
    const { lat, lng } = camera.coordinates;
    if (typeof lat !== "number" || typeof lng !== "number") {
      errors.push("Coordinates lat and lng must be numbers.");
    }
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
