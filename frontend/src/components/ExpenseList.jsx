import { useState } from 'react';
import axios from "axios";
import { exportCurrentData } from '../utils/exportUtils';
import { apiUrl } from '../utils/api';
import ExpenseEditModal from './ExpenseEditModal';
import "../App.css";

function formatDateOnly(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium"
  }).format(d);
}

export default function ExpenseList({ expenses = [], setExpenses, setMessage }) {
  const [editingExpense, setEditingExpense] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!expenses.length) {
    return (
      <div className="card">
        <h2>📜 Expense List</h2>
        <p>No expenses to show. Use filter to view expenses.</p>
      </div>
    );
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };
  
  const handleEditSuccess = (updatedExpense) => {
    // Update the expense in the current list (optimistic update)
    setExpenses(prevExpenses => 
      prevExpenses.map(exp => 
        exp.id === updatedExpense.id ? updatedExpense : exp
      )
    );
    setMessage("✏️ Expense updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleDelete = async (exp) => {
    try {
      console.log("Delete request for expense:", exp);
      const dateStr = exp.date.split("T")[0]; // extract YYYY-MM-DD
      console.log("Delete URL:", apiUrl(`/api/expenses/${dateStr}/${exp.id}`));
      
      const response = await axios.delete(apiUrl(`/api/expenses/${dateStr}/${exp.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log("Delete response:", response);
      
      setMessage("🗑️ Expense deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
      // Remove the deleted expense from current list to maintain filter state
      setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== exp.id));
    } catch (err) {
      console.error("Delete failed - Full error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setMessage(`❌ Failed to delete expense: ${err.response?.data?.error || err.message}`);
    }
  };

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ margin: 0 }}>📜 Expense List ({expenses.length} items)</h2>
        
        {/* Quick Export Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => exportCurrentData(expenses, 'csv', 'filtered_expenses')}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}
          >
            📊 Export CSV
          </button>
          
          <button
            onClick={() => exportCurrentData(expenses, 'excel', 'filtered_expenses')}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(5, 150, 105, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(5, 150, 105, 0.3)';
            }}
          >
            📈 Export Excel
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>🏷️ Type</th>
              <th>📝 Details</th>
              <th>💰 Amount</th>
              <th>📂 Category</th>
              <th>🗓️ Date</th>
              <th>🖼️ Image</th>
              <th>⚙️ Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp, i) => (
              <tr key={exp.id || i}>
                <td>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    background: (exp.imageUrl || exp.fileUrl) 
                      ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 235, 59, 0.1) 100%)' 
                      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
                    border: (exp.imageUrl || exp.fileUrl) ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {(exp.imageUrl || exp.fileUrl) ? 
                      (exp.isPDF ? "📄 Bill PDF" : "📸 Bill") : 
                      "🛍️ Grocery"}
                  </div>
                </td>
                <td style={{ fontWeight: '500' }}>
                  {(exp.imageUrl || exp.fileUrl) ? (
                    <div>
                      <div style={{ fontWeight: '600', color: '#4a5568' }}>Supermarket</div>
                      <div style={{ color: '#718096', fontSize: '14px' }}>{exp.supermarket}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: '600', color: '#4a5568' }}>Item</div>
                      <div style={{ color: '#718096', fontSize: '14px' }}>{exp.title}</div>
                    </div>
                  )}
                </td>
                <td>
                  <div className="amount" style={{ 
                    fontSize: '18px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-block'
                  }}>
                    ₹{exp.amount}
                  </div>
                </td>
                <td>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    color: '#4c51bf',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}>
                    {exp.category || "📆 Uncategorized"}
                  </div>
                </td>
                <td style={{ 
                  fontWeight: '500',
                  color: '#4a5568'
                }}>
                  {formatDateOnly(exp.date)}
                </td>
                <td>
                  {(exp.imageUrl || exp.fileUrl) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <a 
                        href={exp.fileUrl || exp.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title={exp.fileName ? `View ${exp.fileName}` : 'View file'}
                      >
                        {exp.isPDF || (exp.fileType && exp.fileType === 'application/pdf') ? (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            borderRadius: '12px',
                            border: '2px solid #fecaca',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '24px',
                            fontWeight: 'bold'
                          }}>
                            📄
                            <span style={{ fontSize: '10px', marginTop: '2px' }}>PDF</span>
                          </div>
                        ) : (
                          <img
                            src={exp.fileUrl || exp.imageUrl}
                            alt="bill"
                            className="bill-image"
                            style={{ 
                              width: "60px", 
                              height: "60px", 
                              objectFit: "cover", 
                              borderRadius: "12px",
                              border: '2px solid #e2e8f0',
                              cursor: 'pointer'
                            }}
                          />
                        )}
                      </a>
                      {exp.fileName && (
                        <div style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          textAlign: 'center',
                          maxWidth: '60px',
                          wordBreak: 'break-all',
                          lineHeight: '1.2'
                        }}>
                          {exp.fileName.length > 15 ? exp.fileName.substring(0, 15) + '...' : exp.fileName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(156, 163, 175, 0.1)',
                      borderRadius: '12px',
                      border: '2px dashed #cbd5e0',
                      color: '#9ca3af',
                      fontSize: '24px'
                    }}>
                      🖼️
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(exp)}
                      title="Edit this expense"
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      ✏️ Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(exp)}
                      title="Delete this expense"
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            <tr style={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderTop: '3px solid #667eea'
            }}>
              <td colSpan="2" style={{ 
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#4a5568',
                padding: '20px 15px'
              }}>
                📊 TOTAL EXPENSES
              </td>
              <td style={{ padding: '20px 15px' }}>
                <div className="amount" style={{ 
                  fontSize: '24px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  display: 'inline-block',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}>
                  ₹{total}
                </div>
              </td>
              <td colSpan="4" style={{ padding: '20px 15px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Edit Modal */}
      <ExpenseEditModal 
        expense={editingExpense}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
