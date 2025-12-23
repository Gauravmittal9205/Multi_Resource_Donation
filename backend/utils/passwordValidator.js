// Password validation utility
const validatePassword = (password) => {
  const errors = [];
  
  // Minimum 8 characters
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // At least one numeric digit
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one numeric digit');
  }
  
  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Password strength checker
const checkPasswordStrength = (password) => {
  let strength = 0;
  let feedback = [];
  
  if (password.length >= 8) strength += 1;
  else feedback.push('Add at least 8 characters');
  
  if (password.length >= 12) strength += 1;
  else if (password.length >= 8) feedback.push('Consider adding more characters');
  
  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push('Add uppercase letters');
  
  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[0-9]/.test(password)) strength += 1;
  else feedback.push('Add numbers');
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
  else feedback.push('Add special characters');
  
  // Determine strength level
  let strengthLevel = 'Weak';
  if (strength >= 5) strengthLevel = 'Strong';
  else if (strength >= 3) strengthLevel = 'Medium';
  
  return {
    score: strength,
    level: strengthLevel,
    feedback: feedback
  };
};

module.exports = {
  validatePassword,
  checkPasswordStrength
};
