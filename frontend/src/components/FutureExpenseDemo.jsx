import React, { useState, useEffect } from 'react';
import axios from 'axios';
import notificationService from '../services/notificationService';
import { apiUrl } from '../utils/api';

const FutureExpenseDemo = ({ setMessage }) => {
  const [demoData, setDemoData] = useState({
    scheduled: 0,
    due: 0,
    processed: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load demo data when component mounts
    // Note: Notification service is now initialized at the app level
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get future expenses
      const futureResponse = await axios.get(apiUrl('/api/expenses/future'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Get due expenses
      const dueResponse = await axios.get(apiUrl('/api/expenses/future/due'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setDemoData({
        scheduled: futureResponse.data?.length || 0,
        due: dueResponse.data?.length || 0,
        processed: 0,
        notifications: 0
      });
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  };

  const createSampleFutureExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('❌ Please login first');
        return;
      }

      const sampleExpenses = [
        {
          title: 'Home Loan EMI',
          amount: 25000,
          category: 'EMI',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
          description: 'Monthly home loan payment',
          isRecurring: true,
          recurrence: {
            type: 'monthly',
            interval: 1,
            maxOccurrences: 240 // 20 years
          },
          notificationSettings: {
            enabled: true,
            daysBefore: 2
          }
        },
        {
          title: 'Netflix Subscription',
          amount: 649,
          category: 'Subscription',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
          description: 'Monthly streaming service',
          isRecurring: true,
          recurrence: {
            type: 'monthly',
            interval: 1,
            maxOccurrences: 12 // 1 year
          },
          notificationSettings: {
            enabled: true,
            daysBefore: 1
          }
        },
        {
          title: 'Car Insurance Premium',
          amount: 12500,
          category: 'Insurance',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
          description: 'Annual car insurance renewal',
          isRecurring: true,
          recurrence: {
            type: 'yearly',
            interval: 1,
            maxOccurrences: 10
          },
          notificationSettings: {
            enabled: true,
            daysBefore: 7
          }
        }
      ];

      let created = 0;
      for (const expense of sampleExpenses) {
        try {
          await axios.post(apiUrl('/api/expenses/future'), expense, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          created++;
        } catch (error) {
          console.error('Error creating sample expense:', error);
        }
      }

      setMessage(`✅ Created ${created} sample future expenses!`);
      setTimeout(() => setMessage(''), 3000);
      await loadDemoData();

    } catch (error) {
      console.error('Error creating sample expenses:', error);
      setMessage('❌ Failed to create sample expenses');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const processDueExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(apiUrl('/auth/login'), credentials);
      const response = await axios.post(apiUrl('/api/expenses/future/process'), {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessage(`✅ ${response.data.message}`);
      setTimeout(() => setMessage(''), 3000);
      
      setDemoData(prev => ({
        ...prev,
        processed: response.data.processedExpenses?.length || 0
      }));

      await loadDemoData();
    } catch (error) {
      console.error('Error processing due expenses:', error);
      setMessage('❌ Failed to process due expenses');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const testNotifications = async () => {
    setLoading(true);
    try {
      // Request notification permission first
      const hasPermission = await notificationService.requestPermission();
      
      if (!hasPermission) {
        setMessage('❌ Notifications not permitted. Please enable in browser settings.');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Show test notification
      notificationService.showTestNotification();
      
      // Check for due expenses and show notifications
      const dueCount = await notificationService.checkDueExpenses();
      const upcomingCount = await notificationService.checkUpcomingExpenses();
      
      setDemoData(prev => ({
        ...prev,
        notifications: dueCount + upcomingCount
      }));

      if (dueCount > 0 || upcomingCount > 0) {
        notificationService.showSummaryNotification(dueCount, upcomingCount);
        setMessage(`🔔 Sent ${dueCount + upcomingCount} expense notifications!`);
      } else {
        setMessage('🔔 Test notification sent! No due expenses found.');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error testing notifications:', error);
      setMessage('❌ Failed to test notifications');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px dashed #e2e8f0',
      borderRadius: '12px',
      margin: '20px',
      backgroundColor: '#f8fafc'
    }}>
      <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>
        📅 Future Expense System Demo
      </h3>

      {/* System Overview */}
      <div style={{
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>🎯 System Features</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            ✅ Schedule future expenses with dates
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            🔄 Set up recurring EMIs, subscriptions
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            🔔 Get notifications before due dates
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            ⚡ Auto-create expenses on due dates
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1d4ed8' }}>
            {demoData.scheduled}
          </div>
          <div style={{ fontSize: '12px', color: '#3730a3' }}>Scheduled</div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>
            {demoData.due}
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>Due Now</div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
            {demoData.processed}
          </div>
          <div style={{ fontSize: '12px', color: '#047857' }}>Processed</div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
            {demoData.notifications}
          </div>
          <div style={{ fontSize: '12px', color: '#991b1b' }}>Notifications</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <button
          onClick={createSampleFutureExpenses}
          disabled={loading}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '🔄 Creating...' : '📅 Create Sample EMIs'}
        </button>

        <button
          onClick={processDueExpenses}
          disabled={loading}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '🔄 Processing...' : '⚡ Process Due Expenses'}
        </button>

        <button
          onClick={testNotifications}
          disabled={loading}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '🔄 Testing...' : '🔔 Test Notifications'}
        </button>

        <button
          onClick={loadDemoData}
          disabled={loading}
          style={{
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'white',
            color: '#374151',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Usage Instructions */}
      <div style={{
        padding: '15px',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(34, 197, 94, 0.2)'
      }}>
        <h4 style={{ color: '#166534', marginBottom: '10px' }}>🚀 How to Test:</h4>
        <ol style={{ color: '#15803d', fontSize: '14px', lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
          <li><strong>Create Sample EMIs</strong> - Adds sample recurring expenses (EMI, subscriptions, insurance)</li>
          <li><strong>Process Due Expenses</strong> - Converts due scheduled expenses to actual expenses</li>
          <li><strong>Test Notifications</strong> - Shows browser notifications for due/upcoming expenses</li>
          <li><strong>View in Dashboard</strong> - Use the "Scheduled Expenses" component to manage</li>
        </ol>
      </div>

      <div style={{
        marginTop: '15px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        💡 The system automatically checks for due expenses every 30 minutes and sends notifications
      </div>
    </div>
  );
};

export default FutureExpenseDemo;