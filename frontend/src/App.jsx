import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import EnhancedExpenseFilter from "./components/EnhancedExpenseFilter";
import BillUpload from "./components/BillUpload";
import FutureExpenseForm from "./components/FutureExpenseForm";
import ScheduledExpensesDashboard from "./components/ScheduledExpensesDashboard";
import FutureExpenseDemo from "./components/FutureExpenseDemo";
import notificationService from "./services/notificationService";
import "./App.css";

// Main authenticated app component
function ExpenseApp() {
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState('expenses');
  const { user, logout } = useAuth();

  // Initialize notification service when user is authenticated
  useEffect(() => {
    // Start notification service for all authenticated users
    console.log('🔔 Starting notification service for authenticated user');
    notificationService.startPeriodicCheck(30); // Check every 30 minutes
    
    // Cleanup function to prevent multiple intervals
    return () => {
      console.log('🔔 Notification service cleanup (component unmount)');
      // Note: We don't stop the service here since we want it to persist
    };
  }, [user]); // Depend on user to restart if user changes

  const renderTabContent = () => {
    switch(activeTab) {
      case 'expenses':
        return (
          <>
            {/* Forms */}
            <ExpenseForm setMessage={setMessage} />
            <BillUpload setMessage={setMessage} />
            <EnhancedExpenseFilter setExpenses={setExpenses} />
            
            {/* Pass setExpenses + setMessage to list so delete works */}
            <ExpenseList
              expenses={expenses}
              setExpenses={setExpenses}
              setMessage={setMessage}
            />
          </>
        );
      case 'future':
        return (
          <>
            <FutureExpenseForm setMessage={setMessage} />
            <ScheduledExpensesDashboard setMessage={setMessage} />
          </>
        );
      case 'demo':
        return (
          <>
            <FutureExpenseDemo setMessage={setMessage} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container">
      {/* User Header */}
      <div className="user-header">
        <div className="user-info">
          <div>
            <h3>👤 Welcome, {user?.name || 'User'}!</h3>
            <p>📧 {user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="logout-btn">
          🚪 Logout
        </button>
      </div>

      <h1>💰 Expense Tracker</h1>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'expenses' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'expenses' ? 'white' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          💳 Regular Expenses
        </button>
        <button
          onClick={() => setActiveTab('future')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'future' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'future' ? 'white' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          📅 Future Expenses & EMIs
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'demo' ? '#10b981' : '#f3f4f6',
            color: activeTab === 'demo' ? 'white' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          🚀 System Demo
        </button>
      </div>

      {/* ✅ Display success/error messages */}
      {message && (
        <div className={`message ${message.startsWith("❌") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

// Auth wrapper component
function AuthWrapper() {
  const { isAuthenticated, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>💰 Expense Tracker</h1>
          <p style={{ textAlign: 'center', fontSize: '18px' }}>🔄 Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return <ExpenseApp />;
}

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;
