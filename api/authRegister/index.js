import jwt from 'jsonwebtoken';
import { saveUser } from '../../backend/config/azureBlob.js';
import { validatePasswordStrength, getPasswordStrengthMessage } from '../../backend/utils/passwordValidator.js';
import { createResponse } from '../shared/utils.js';

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function (context, req) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return context.res = createResponse(400, { error: 'Email and password are required' });
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return context.res = createResponse(400, { 
        error: `Password does not meet security requirements: ${getPasswordStrengthMessage(passwordValidation)}`,
        passwordErrors: passwordValidation.errors,
        requirements: passwordValidation.requirements
      });
    }

    // Create new user
    const user = await saveUser({ email, password, name });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    context.res = createResponse(201, {
      message: 'User registered successfully',
      token,
      user
    });
  } catch (err) {
    context.res = createResponse(400, { error: err.message });
  }
}