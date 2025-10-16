import { useState, useEffect } from 'react';
import axios from 'axios';

const ScheduledExpensesDashboard = ({ setMessage }) => {
  const [futureExpenses, setFutureExpenses] = useState([]);
  const [dueExpenses, setDueExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, scheduled, due, recurring

  useEffect(() => {
    fetchFutureExpenses();
    fetchDueExpenses();
  }, []);

  const fetchFutureExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses/future', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setFutureExpenses(response.data);
    } catch (err) {
      console.error('Failed to fetch future expenses:', err);
      setError('Failed to load future expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDueExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses/future/due', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setDueExpenses(response.data);
    } catch (err) {
      console.error('Failed to fetch due expenses:', err);
    }
  };

  const processExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/expenses/future/process', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage(`✅ ${response.data.message}`);
      setTimeout(() => setMessage(''), 4000);
      
      // Refresh the lists
      await fetchFutureExpenses();
      await fetchDueExpenses();
    } catch (err) {
      console.error('Failed to process expenses:', err);
      setMessage('❌ Failed to process due expenses');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateStr));
  };

  const formatRecurrence = (expense) => {
    if (!expense.isRecurring || !expense.recurrence) return 'One-time';
    
    const { type, interval, endDate, maxOccurrences, currentOccurrence } = expense.recurrence;
    let recurrenceText = `Every ${interval > 1 ? interval + ' ' : ''}${type.slice(0, -2)}${interval > 1 ? 's' : ''}`;
    
    if (endDate) {
      recurrenceText += ` until ${formatDate(endDate)}`;
    } else if (maxOccurrences) {
      const remaining = maxOccurrences - (currentOccurrence || 0);
      recurrenceText += ` (${remaining} remaining)`;
    }
    
    return recurrenceText;
  };

  const getStatusBadge = (expense) => {
    const now = new Date();
    const scheduledDate = new Date(expense.scheduledDate);
    
    if (expense.status === 'completed') {
      return { text: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    } else if (expense.status === 'cancelled') {
      return { text: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    } else if (scheduledDate <= now) {
      return { text: 'Due Now', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    } else {
      return { text: 'Scheduled', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
    }
  };

  const getDaysUntil = (dateStr) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const filteredExpenses = futureExpenses.filter(expense => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return expense.status === 'scheduled';
    if (filter === 'due') return new Date(expense.scheduledDate) <= new Date();
    if (filter === 'recurring') return expense.isRecurring;
    return true;
  });

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading scheduled expenses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ margin: 0 }}>📅 Scheduled Expenses</h2>
        
        {dueExpenses.length > 0 && (
          <button
            onClick={processExpenses}
            disabled={loading}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}
          >
            🔄 Process {dueExpenses.length} Due Expense{dueExpenses.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '25px' 
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#4c1d95' }}>
            {futureExpenses.filter(e => e.status === 'scheduled').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6366f1', fontWeight: '500' }}>Scheduled</div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
            {dueExpenses.length}
          </div>
          <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '500' }}>Due Now</div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
            {futureExpenses.filter(e => e.isRecurring).length}
          </div>
          <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Recurring</div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
            ₹{futureExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>Total Scheduled</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', count: futureExpenses.length },
          { key: 'scheduled', label: 'Scheduled', count: futureExpenses.filter(e => e.status === 'scheduled').length },
          { key: 'due', label: 'Due Now', count: dueExpenses.length },
          { key: 'recurring', label: 'Recurring', count: futureExpenses.filter(e => e.isRecurring).length }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: filter === filterOption.key 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#f3f4f6',
              color: filter === filterOption.key ? 'white' : '#374151',
              transition: 'all 0.3s ease'
            }}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          color: '#dc2626',
          backgroundColor: '#fee2e2',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          ❌ {error}
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>No {filter !== 'all' ? filter : ''} scheduled expenses</div>
          <div style={{ fontSize: '14px' }}>Use the "Schedule Future Expense" form to add your first scheduled expense.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  📝 Expense
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  💰 Amount
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  📅 Due Date
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  🔄 Recurrence
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  🔔 Status
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  ⏰ Timeline
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, index) => {
                const statusBadge = getStatusBadge(expense);
                return (
                  <tr 
                    key={expense.id || index}
                    style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {expense.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {expense.category}
                      </div>
                      {expense.description && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                          {expense.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#059669',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        ₹{expense.amount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '500', color: '#374151' }}>
                        {formatDate(expense.scheduledDate)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: expense.isRecurring ? '#7c3aed' : '#6b7280',
                        background: expense.isRecurring ? 'rgba(124, 58, 237, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}>
                        {formatRecurrence(expense)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: statusBadge.color,
                        background: statusBadge.bg,
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}>
                        {statusBadge.text}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {getDaysUntil(expense.scheduledDate)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScheduledExpensesDashboard;