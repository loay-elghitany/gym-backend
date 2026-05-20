/**
 * Validation Utilities
 * Helper functions for common validations
 */

const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  // Minimum 6 characters
  // At least one uppercase letter, one lowercase letter, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

const isValidSlug = (slug) => {
  // Only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
};

const isValidPhone = (phone) => {
  // Basic international phone validation
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidSlug,
  isValidPhone,
};
