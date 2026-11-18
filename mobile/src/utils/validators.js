// Client-side checks that give field-level messages (FR-SUB-05, NFR-USA-05).
// The server checks everything again, so these only save the user a round trip.
// Allowed email domains are a server setting (D10), so they are NOT checked here;
// the server answers with a field error on "email".

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value) => EMAIL_PATTERN.test(String(value || '').trim());

// At least 8 characters, at least 1 letter and 1 digit (screen 2 hint).
export const isValidPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

export function validateLogin({ email, password }) {
  const errors = {};
  if (!String(email || '').trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address, for example name@iba.edu.pk.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateSignUp({ fullName, email, password, confirmPassword }) {
  const errors = {};
  const name = String(fullName || '').trim();
  if (!name) errors.fullName = 'Enter your full name.';
  else if (name.length < 2) errors.fullName = 'Your name must have at least 2 characters.';
  else if (name.length > 60) errors.fullName = 'Your name can have at most 60 characters.';

  if (!String(email || '').trim()) errors.email = 'Enter your IBA email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address, for example name@iba.edu.pk.';

  if (!password) errors.password = 'Enter a password.';
  else if (!isValidPassword(password)) {
    errors.password = 'Use at least 8 characters with at least 1 letter and 1 digit.';
  }

  if (!confirmPassword) errors.confirmPassword = 'Enter your password again.';
  else if (confirmPassword !== password) errors.confirmPassword = 'The two passwords do not match.';

  return errors;
}

// Verify email: exactly 6 digits (AUT-02).
export function validateCode(code) {
  const value = String(code || '').trim();
  if (!value) return 'Enter the 6-digit code from your email.';
  if (!/^\d{6}$/.test(value)) return 'The code has 6 digits. Check your email and try again.';
  return null;
}
