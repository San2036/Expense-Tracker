import { useState } from "react";
import axios from "axios";
import { exportExpensesByDate } from '../utils/exportUtils';
import "../App.css";

export default function ExpenseFilter({ setExpenses }) {
  const [date, setDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleFilter = async () => {
    if (!date) return;
    const res = await axios.get(`http://127.0.0.1:5000/api/expenses/${date}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    setExpenses(res.data);
  };

  const handleClear = () => {
    setExpenses([]); // clear list
    setDate("");
  };
  
  const handleExport = async (format) => {
    if (!date) {
      alert('Please select a date first');
      return;
    }
    
    setExporting(true);
    try {
      const result = await exportExpensesByDate(date, date, format);
      if (result.success) {
        alert(`Successfully exported ${result.count} expense(s) as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card">
      <h2>🔎 Filter Expenses by Date</h2>
      <div className="form-container">
        <div className="form-group" style={{ alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '12px',
            border: '2px solid rgba(102, 126, 234, 0.1)'
          }}>
            <span style={{ 
              fontSize: '18px',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              📅 Select Date:
            </span>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                fontWeight: '500',
                minWidth: '200px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleFilter}
              className="btn btn-secondary"
              disabled={!date}
              style={{
                opacity: !date ? 0.6 : 1,
                cursor: !date ? 'not-allowed' : 'pointer'
              }}
            >
              🔍 Filter Expenses
            </button>
            
            <button 
              onClick={handleClear}
              style={{
                padding: '15px 30px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(100, 116, 139, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 25px rgba(100, 116, 139, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(100, 116, 139, 0.4)';
              }}
            >
              🧵 Clear Filter
            </button>
          </div>
          
          {/* Export Buttons */}
          <div style={{ 
            marginTop: '20px', 
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📁 Export Selected Date:
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleExport('csv')}
                disabled={!date || exporting}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !date || exporting ? 'not-allowed' : 'pointer',
                  background: !date || exporting 
                    ? 'rgba(156, 163, 175, 0.3)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: !date || exporting ? '#9ca3af' : 'white',
                  opacity: !date || exporting ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {exporting ? '🔄 Exporting...' : '📊 Export CSV'}
              </button>
              
              <button
                onClick={() => handleExport('excel')}
                disabled={!date || exporting}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !date || exporting ? 'not-allowed' : 'pointer',
                  background: !date || exporting 
                    ? 'rgba(156, 163, 175, 0.3)' 
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: !date || exporting ? '#9ca3af' : 'white',
                  opacity: !date || exporting ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {exporting ? '🔄 Exporting...' : '📈 Export Excel'}
              </button>
            </div>
            <div style={{ 
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              * Select a date above to enable export options
            </div>
          </div>
        </div>
        
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#3730a3',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ℹ️ <strong>Tip:</strong> Select a date to view expenses for that specific day. The total will show only for the filtered expenses.
            </div>
          </div>
      </div>
    </div>
  );
}
