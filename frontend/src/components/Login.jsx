import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { passwordRequirements } from '../utils/passwordValidator';
import '../App.css';

export default function Login({ onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>💰 Expense Tracker</h1>
        <h2>🔑 Login to Your Account</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              style={{
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            
            {/* Password Requirements Reminder */}
            <details style={{ marginTop: '8px' }}>
              <summary style={{
                fontSize: '12px',
                color: '#64748b',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                📝 Password Requirements
              </summary>
              <div style={{
                marginTop: '8px',
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Your password should have:</div>
                {passwordRequirements.map(req => (
                  <div key={req.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    marginBottom: '2px',
                    color: '#64748b'
                  }}>
                    <span style={{ marginRight: '6px' }}>•</span>
                    {req.text}
                  </div>
                ))}
              </div>
            </details>
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
            {loading ? '🔄 Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(59, 130, 246, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{ margin: '0 0 15px 0', color: '#4a5568' }}>
            Don't have an account yet?
          </p>
          <button
            onClick={onSwitchToRegister}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            📝 Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}
