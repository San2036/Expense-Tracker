import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../../backend/config/azureBlob.js';
import { createResponse } from '../shared/utils.js';

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function (context, req) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return context.res = createResponse(400, { error: 'Email and password are required' });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return context.res = createResponse(401, { error: 'Invalid email or password' });
    }

    // Check password
    let isMatch;
    try {
      isMatch = await user.comparePassword(password);
    } catch (error) {
      return context.res = createResponse(500, { error: 'Authentication error occurred' });
    }
    
    if (!isMatch) {
      return context.res = createResponse(401, { error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    context.res = createResponse(200, {
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    context.res = createResponse(500, { error: err.message });
  }
}