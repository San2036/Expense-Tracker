import { useState, useEffect } from 'react';
import axios from 'axios';

const ExpenseEditModal = ({ expense, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: '',
    supermarket: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
      const isReceipt = expense.imageUrl || expense.fileUrl;
      setFormData({
        title: expense.title || '',
        amount: expense.amount || '',
        category: expense.category || '',
        date: expense.date ? expense.date.split('T')[0] : '',
        supermarket: expense.supermarket || ''
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.amount || formData.amount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      const isReceipt = expense.imageUrl || expense.fileUrl;
      
      // Prepare update data based on expense type
      const updateData = {
        amount: parseFloat(formData.amount),
        category: formData.category.trim(),
        date: formData.date ? new Date(formData.date).toISOString() : expense.date
      };

      // Add title or supermarket based on expense type
      if (isReceipt) {
        updateData.supermarket = formData.supermarket.trim();
      } else {
        updateData.title = formData.title.trim();
        if (!updateData.title) {
          setError('Please enter a title for this expense');
          setLoading(false);
          return;
        }
      }

      console.log('Updating expense:', expense.id, 'with data:', updateData);

      const response = await axios.put(
        `http://127.0.0.1:5000/api/expenses/update/${expense.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Update response:', response.data);
      onSuccess(response.data.expense);
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.response?.data?.error || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !expense) return null;

  const isReceipt = expense.imageUrl || expense.fileUrl;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '25px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#2d3748',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            ✏️ Edit {isReceipt ? 'Receipt' : 'Expense'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#a0aec0',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f7fafc';
              e.target.style.color = '#2d3748';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#a0aec0';
            }}
          >
            ×
          </button>
        </div>

        {/* Expense Type Indicator */}
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: isReceipt ? 'rgba(255, 193, 7, 0.1)' : 'rgba(76, 175, 80, 0.1)',
          border: isReceipt ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>
            {isReceipt ? (expense.isPDF ? '📄' : '📸') : '🛍️'}
          </span>
          <div>
            <div style={{ fontWeight: '600', color: '#2d3748' }}>
              {isReceipt ? 
                (expense.isPDF ? 'Receipt PDF' : 'Receipt Image') : 
                'Manual Expense'
              }
            </div>
            {expense.fileName && (
              <div style={{ fontSize: '12px', color: '#718096' }}>
                File: {expense.fileName}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title or Supermarket field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>
              {isReceipt ? '🏪 Store/Supermarket' : '📝 Expense Title'} *
            </label>
            <input
              type="text"
              name={isReceipt ? 'supermarket' : 'title'}
              value={isReceipt ? formData.supermarket : formData.title}
              onChange={handleChange}
              placeholder={isReceipt ? 'Enter store name' : 'Enter expense description'}
              required={!isReceipt}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Amount field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>
              💰 Amount (₹) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Category field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>
              🏷️ Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Enter category (e.g., Food, Transport, Healthcare)"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Date field */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>
              📅 Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              color: '#e53e3e',
              backgroundColor: '#fed7d7',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #feb2b2',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: 'white',
                color: '#4a5568',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#f7fafc';
                  e.target.style.borderColor = '#cbd5e0';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading 
                  ? 'rgba(102, 126, 234, 0.6)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.8 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? '🔄 Saving...' : '✅ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseEditModal;