// Backend password strength validation utility

export const passwordRequirements = [
  { id: 'length', text: 'At least 8 characters', regex: /.{8,}/, required: true },
  { id: 'uppercase', text: 'At least one uppercase letter', regex: /[A-Z]/, required: true },
  { id: 'lowercase', text: 'At least one lowercase letter', regex: /[a-z]/, required: true },
  { id: 'number', text: 'At least one number', regex: /\d/, required: true },
  { id: 'special', text: 'At least one special character (!@#$%^&*)', regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, required: true }
];

export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      requirements: passwordRequirements.map(req => ({ ...req, met: false }))
    };
  }

  const results = passwordRequirements.map(req => ({
    ...req,
    met: req.regex.test(password)
  }));

  const unmetRequirements = results.filter(r => r.required && !r.met);
  const errors = unmetRequirements.map(r => r.text);

  return {
    isValid: unmetRequirements.length === 0,
    errors,
    requirements: results,
    strength: calculateStrength(results)
  };
};

const calculateStrength = (requirements) => {
  const metCount = requirements.filter(r => r.met).length;
  const totalCount = requirements.length;

  if (metCount === totalCount) return 'strong';
  if (metCount >= 3) return 'medium';
  if (metCount >= 1) return 'weak';
  return 'very-weak';
};

export const getPasswordStrengthMessage = (validation) => {
  if (validation.isValid) {
    return 'Password meets all security requirements';
  }
  
  return `Password must have: ${validation.errors.join(', ')}`;
};