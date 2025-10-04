import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword, generateStrongPassword } from '../utils/passwordValidator';
import '../App.css';

export default function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate password strength in real-time
    if (name === 'password') {
      setPasswordValidation(validatePassword(value));
    }
  };
  
  const generatePassword = () => {
    const newPassword = generateStrongPassword();
    setFormData({ ...formData, password: newPassword, confirmPassword: '' });
    setPasswordValidation(validatePassword(newPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password strength
    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.isValid) {
      setError('Password does not meet security requirements. Please use the password generator or ensure all requirements are met.');
      setLoading(false);
      return;
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register(formData.email, formData.password, formData.name);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>💰 Expense Tracker</h1>
        <h2>📝 Create Your Account</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">👤 Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              style={{
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">📧 Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              style={{
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter a strong password"
                style={{
                  padding: '15px 90px 15px 15px',
                  borderRadius: '8px',
                  border: `2px solid ${passwordValidation?.isValid ? '#16a34a' : passwordValidation?.score > 0 ? '#ca8a04' : '#e2e8f0'}`,
                  fontSize: '16px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '50px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                title="Generate strong password"
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🎲
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordValidation && formData.password && (
              <div style={{ marginTop: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ marginRight: '10px', fontSize: '14px', fontWeight: '500' }}>Strength:</span>
                  <div style={{
                    flex: 1,
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${passwordValidation.strengthPercentage}%`,
                      height: '100%',
                      backgroundColor: passwordValidation.strengthColor,
                      transition: 'all 0.3s ease'
                    }}></div>
                  </div>
                  <span style={{
                    marginLeft: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: passwordValidation.strengthColor,
                    textTransform: 'uppercase'
                  }}>
                    {passwordValidation.strength}
                  </span>
                </div>
                
                {/* Requirements List */}
                <div style={{
                  padding: '10px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Requirements:</div>
                  {passwordValidation.requirements.map(req => (
                    <div key={req.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12px',
                      marginBottom: '2px',
                      color: req.met ? '#16a34a' : '#64748b'
                    }}>
                      <span style={{ marginRight: '6px' }}>{req.met ? '✅' : '⭕'}</span>
                      {req.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">🔒 Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
              style={{
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              color: '#dc2626',
              backgroundColor: '#fee2e2',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '20px'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Creating account...' : '✨ Create Account'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <p style={{ margin: '0 0 15px 0', color: '#4a5568' }}>
            Already have an account?
          </p>
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔑 Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
}