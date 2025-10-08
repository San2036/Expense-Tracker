import { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../utils/api';

const FutureExpenseForm = ({ setMessage }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    scheduledDate: '',
    description: '',
    isRecurring: false,
    recurrence: {
      type: 'monthly', // daily, weekly, monthly, yearly
      interval: 1,
      endDate: '',
      maxOccurrences: '',
      currentOccurrence: 0
    },
    notificationSettings: {
      enabled: true,
      daysBefore: 1 // Notify 1 day before due date
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('recurrence.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recurrence: {
          ...prev.recurrence,
          [field]: type === 'number' ? parseInt(value) || 1 : value
        }
      }));
    } else if (name.startsWith('notificationSettings.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          [field]: type === 'number' ? parseInt(value) || 1 : type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title || !formData.amount || !formData.scheduledDate) {
        setError('Title, amount, and scheduled date are required');
        setLoading(false);
        return;
      }

      if (formData.amount <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      // Validate scheduled date is in the future
      const scheduledDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (scheduledDate < today) {
        setError('Scheduled date must be in the future');
        setLoading(false);
        return;
      }

      // Prepare data for submission
      const submitData = {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category.trim() || 'Uncategorized',
        scheduledDate: formData.scheduledDate,
        description: formData.description.trim(),
        isRecurring: formData.isRecurring,
        notificationSettings: formData.notificationSettings
      };

      // Add recurrence data if recurring
      if (formData.isRecurring) {
        submitData.recurrence = {
          ...formData.recurrence,
          currentOccurrence: 0
        };
      }

      console.log('Scheduling future expense:', submitData);

      const response = await axios.post(
        apiUrl('/api/expenses/future'),
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Future expense scheduled:', response.data);

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: '',
        scheduledDate: '',
        description: '',
        isRecurring: false,
        recurrence: {
          type: 'monthly',
          interval: 1,
          endDate: '',
          maxOccurrences: '',
          currentOccurrence: 0
        },
        notificationSettings: {
          enabled: true,
          daysBefore: 1
        }
      });

      setMessage(`📅 Future expense "${submitData.title}" scheduled successfully!`);
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      console.error('Future expense scheduling failed:', err);
      setError(err.response?.data?.error || 'Failed to schedule future expense');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="card">
      <h2>📅 Schedule Future Expense</h2>
      <div className="form-container">
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#1e40af',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💡 <strong>Schedule EMIs, Loans & Recurring Expenses</strong>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#3730a3',
            marginTop: '5px',
            lineHeight: '1.4'
          }}>
            Set up future expenses that will automatically be added on their due dates, with optional notifications.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Expense Details */}
          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px', display: 'block' }}>
              📝 Expense Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Home Loan EMI, Netflix Subscription, Car Insurance"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px', display: 'block' }}>
                💰 Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px', display: 'block' }}>
                🏷️ Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., EMI, Subscription, Insurance"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px', display: 'block' }}>
              📅 First Due Date *
            </label>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              min={getMinDate()}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px', display: 'block' }}>
              📄 Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any additional notes about this expense..."
              rows="3"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Recurring Options */}
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '20px'
          }}>
            <div className="form-group">
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#047857'
              }}>
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleChange}
                  style={{ transform: 'scale(1.2)' }}
                />
                🔄 Make this a recurring expense
              </label>
            </div>

            {formData.isRecurring && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}>
                      Repeat Every
                    </label>
                    <select
                      name="recurrence.type"
                      value={formData.recurrence.type}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #d1fae5',
                        borderRadius: '8px',
                        fontSize: '16px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}>
                      Interval
                    </label>
                    <input
                      type="number"
                      name="recurrence.interval"
                      value={formData.recurrence.interval}
                      onChange={handleChange}
                      min="1"
                      max="12"
                      placeholder="1"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #d1fae5',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                      Every {formData.recurrence.interval} {formData.recurrence.type.slice(0, -2)}(s)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}>
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="recurrence.endDate"
                      value={formData.recurrence.endDate}
                      onChange={handleChange}
                      min={formData.scheduledDate}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #d1fae5',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}>
                      Max Occurrences (Optional)
                    </label>
                    <input
                      type="number"
                      name="recurrence.maxOccurrences"
                      value={formData.recurrence.maxOccurrences}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g., 12 for 1 year"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #d1fae5',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(249, 115, 22, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            marginBottom: '20px'
          }}>
            <div className="form-group">
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#c2410c'
              }}>
                <input
                  type="checkbox"
                  name="notificationSettings.enabled"
                  checked={formData.notificationSettings.enabled}
                  onChange={handleChange}
                  style={{ transform: 'scale(1.2)' }}
                />
                🔔 Enable notifications
              </label>
            </div>

            {formData.notificationSettings.enabled && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: '600', color: '#c2410c', marginBottom: '8px', display: 'block' }}>
                  Notify me (days before due date)
                </label>
                <select
                  name="notificationSettings.daysBefore"
                  value={formData.notificationSettings.daysBefore}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '12px 16px',
                    border: '2px solid #fed7aa',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="0">On due date</option>
                  <option value="1">1 day before</option>
                  <option value="2">2 days before</option>
                  <option value="3">3 days before</option>
                  <option value="7">1 week before</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              color: '#dc2626',
              backgroundColor: '#fee2e2',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fecaca',
              fontSize: '14px'
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
              fontSize: '18px',
              fontWeight: '600',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Scheduling...' : '📅 Schedule Future Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FutureExpenseForm;