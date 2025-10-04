// Password strength validation utility

export const passwordRequirements = [
  { id: 'length', text: 'At least 8 characters', regex: /.{8,}/ },
  { id: 'uppercase', text: 'At least one uppercase letter', regex: /[A-Z]/ },
  { id: 'lowercase', text: 'At least one lowercase letter', regex: /[a-z]/ },
  { id: 'number', text: 'At least one number', regex: /\d/ },
  { id: 'special', text: 'At least one special character (!@#$%^&*)', regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/ }
];

export const validatePassword = (password) => {
  const results = passwordRequirements.map(req => ({
    ...req,
    met: req.regex.test(password)
  }));

  const metCount = results.filter(r => r.met).length;
  const totalCount = results.length;

  let strength = 'weak';
  let strengthColor = '#dc2626';
  let strengthPercentage = 0;

  if (metCount === totalCount) {
    strength = 'strong';
    strengthColor = '#16a34a';
    strengthPercentage = 100;
  } else if (metCount >= 3) {
    strength = 'medium';
    strengthColor = '#ca8a04';
    strengthPercentage = (metCount / totalCount) * 100;
  } else if (metCount >= 1) {
    strength = 'weak';
    strengthColor = '#dc2626';
    strengthPercentage = (metCount / totalCount) * 100;
  }

  return {
    requirements: results,
    strength,
    strengthColor,
    strengthPercentage,
    isValid: metCount === totalCount,
    score: metCount
  };
};

export const generateStrongPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly (minimum 8 chars total)
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};