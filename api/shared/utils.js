import jwt from 'jsonwebtoken';

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authenticate token middleware for Azure Functions
export const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return { isAuthenticated: false, error: 'No token provided' };
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { isAuthenticated: true, user };
  } catch (err) {
    return { isAuthenticated: false, error: 'Invalid token' };
  }
};

// Helper function to create a standardized response
export const createResponse = (status, body) => {
  return {
    status,
    headers: {
      'Content-Type': 'application/json'
    },
    body
  };
};