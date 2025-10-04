import bcrypt from 'bcryptjs';
import { validatePasswordStrength, getPasswordStrengthMessage } from '../utils/passwordValidator.js';

// User model for Azure Blob Storage
export class User {
  constructor(userData) {
    if (!userData) {
      throw new Error('User data is required');
    }
    
    this.id = userData.id;
    this.email = userData.email;
    this.name = userData.name || '';
    this.createdAt = userData.createdAt || new Date().toISOString();
    
    // Explicitly handle password - ensure it's properly assigned
    if (userData.password !== undefined) {
      this.password = userData.password;
    }
    
    // Debug log to see what we're getting
    console.log('👤 User constructor - password info:', {
      hasUserData: !!userData,
      hasPassword: !!userData.password,
      passwordLength: userData.password ? userData.password.length : 0,
      passwordStart: userData.password ? userData.password.substring(0, 10) + '...' : 'none',
      thisPasswordSet: !!this.password
    });
  }

  // Validate password strength
  validatePasswordStrength() {
    if (!this.password) {
      return {
        isValid: false,
        errors: ['Password is required'],
        message: 'Password is required'
      };
    }
    
    const validation = validatePasswordStrength(this.password);
    return {
      ...validation,
      message: getPasswordStrengthMessage(validation)
    };
  }
  
  // Hash password before saving (only if it passes validation)
  async hashPassword() {
    if (this.password) {
      // Validate password strength before hashing
      const validation = this.validatePasswordStrength();
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.message}`);
      }
      
      console.log('✅ Password meets security requirements, hashing...');
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Compare password for login
  async comparePassword(candidatePassword) {
    console.log('Comparing password:', {
      candidatePassword: candidatePassword ? 'provided' : 'missing',
      candidatePasswordLength: candidatePassword ? candidatePassword.length : 0,
      hashedPassword: this.password ? 'exists' : 'missing',
      hashedPasswordLength: this.password ? this.password.length : 0,
      hashedPasswordStart: this.password ? this.password.substring(0, 10) : 'none'
    });
    
    // Validate inputs before calling bcrypt.compare
    if (!candidatePassword) {
      console.error('❌ Candidate password is missing or empty');
      throw new Error('Password is required');
    }
    
    if (!this.password) {
      console.error('❌ Stored password hash is missing');
      throw new Error('User password hash not found');
    }
    
    try {
      const result = await bcrypt.compare(candidatePassword, this.password);
      console.log('✅ Password comparison result:', result);
      return result;
    } catch (error) {
      console.error('❌ bcrypt.compare error:', error.message);
      throw new Error('Password comparison failed');
    }
  }

  // Convert to JSON (excluding password for security)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

export default User;