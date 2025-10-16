import { useState } from "react";
import axios from "axios";
import { exportExpensesByDate } from '../utils/exportUtils';
import "../App.css";

export default function EnhancedExpenseFilter({ setExpenses }) {
  const [filterType, setFilterType] = useState('date'); // 'date' or 'month'
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);

  // Get current month as default
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  const handleDateFilter = async () => {
    if (!date) return;
    try {
      const res = await axios.get(`/api/expenses/${date}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setExpenses(res.data);
    } catch (error) {
      console.error('Error filtering by date:', error);
    }
  };

  const handleMonthFilter = async () => {
    if (!month) return;
    try {
      // Convert YYYY-MM to date range
      const startDate = `${month}-01`; // First day of month
      const endDate = getLastDayOfMonth(month);
      
      console.log(`📅 Filtering expenses for ${month}: ${startDate} to ${endDate}`);
      
      const res = await axios.get(`/api/expenses/export?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setExpenses(res.data);
    } catch (error) {
      console.error('Error filtering by month:', error);
    }
  };

  const getLastDayOfMonth = (monthString) => {
    // Convert YYYY-MM to last day of that month
    const [year, month] = monthString.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    return `${monthString}-${lastDay.toString().padStart(2, '0')}`;
  };

  const handleFilter = () => {
    if (filterType === 'date') {
      handleDateFilter();
    } else {
      handleMonthFilter();
    }
  };

  const handleClear = () => {
    setExpenses([]);
    setDate("");
    setMonth("");
  };

  const handleExport = async (format) => {
    let startDate, endDate, filename;
    
    if (filterType === 'date') {
      if (!date) {
        alert('Please select a date first');
        return;
      }
      startDate = endDate = date;
      filename = `expenses_${date}`;
    } else {
      if (!month) {
        alert('Please select a month first');
        return;
      }
      startDate = `${month}-01`;
      endDate = getLastDayOfMonth(month);
      filename = `expenses_${month}`;
    }
    
    setExporting(true);
    try {
      const result = await exportExpensesByDate(startDate, endDate, format);
      if (result.success) {
        const period = filterType === 'date' ? `date ${date}` : `month ${month}`;
        alert(`Successfully exported ${result.count} expense(s) for ${period} as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getMonthName = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="card">
      <h2>🔎 Filter Expenses</h2>
      
      {/* Filter Type Selection */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '8px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setFilterType('date')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: filterType === 'date' ? '#3b82f6' : 'transparent',
              color: filterType === 'date' ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            📅 By Date
          </button>
          <button
            onClick={() => setFilterType('month')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: filterType === 'month' ? '#10b981' : 'transparent',
              color: filterType === 'month' ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            📊 By Month
          </button>
        </div>
      </div>

      <div className="form-container">
        <div className="form-group" style={{ alignItems: 'center' }}>
          
          {/* Date Filter */}
          {filterType === 'date' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              border: '2px solid rgba(59, 130, 246, 0.1)'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e40af',
                minWidth: '120px'
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
                  border: '2px solid #ddd6fe',
                  fontSize: '16px',
                  fontWeight: '500',
                  minWidth: '200px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          )}

          {/* Month Filter */}
          {filterType === 'month' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              border: '2px solid rgba(16, 185, 129, 0.1)'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#047857',
                minWidth: '120px'
              }}>
                📊 Select Month:
              </span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder={currentMonth}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid #a7f3d0',
                  fontSize: '16px',
                  fontWeight: '500',
                  minWidth: '200px',
                  backgroundColor: '#ffffff'
                }}
              />
              {month && (
                <span style={{
                  fontSize: '14px',
                  color: '#059669',
                  fontStyle: 'italic',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '6px'
                }}>
                  {getMonthName(month)}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              onClick={handleFilter}
              className="btn btn-secondary"
              disabled={(filterType === 'date' && !date) || (filterType === 'month' && !month)}
              style={{
                opacity: ((filterType === 'date' && !date) || (filterType === 'month' && !month)) ? 0.6 : 1,
                cursor: ((filterType === 'date' && !date) || (filterType === 'month' && !month)) ? 'not-allowed' : 'pointer',
                background: filterType === 'date' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
              }}
            >
              {filterType === 'date' ? '🔍 Filter by Date' : '📊 Filter by Month'}
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
                boxShadow: '0 4px 15px rgba(100, 116, 139, 0.4)'
              }}
            >
              🧹 Clear Filter
            </button>
          </div>

          {/* Export Section */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📁 Export {filterType === 'date' ? 'Selected Date' : 'Selected Month'}:
              </span>
              {filterType === 'month' && month && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  📊 Exporting all expenses for {getMonthName(month)}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleExport('csv')}
                disabled={((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting}
                style={{
                  padding: '14px 24px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting) ? 'not-allowed' : 'pointer',
                  background: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting)
                    ? 'rgba(156, 163, 175, 0.3)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting) ? '#9ca3af' : 'white',
                  opacity: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting) ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {exporting ? '🔄 Exporting...' : '📊 Export CSV'}
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting}
                style={{
                  padding: '14px 24px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting) ? 'not-allowed' : 'pointer',
                  background: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting)
                    ? 'rgba(156, 163, 175, 0.3)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting) ? '#9ca3af' : 'white',
                  opacity: (((filterType === 'date' && !date) || (filterType === 'month' && !month)) || exporting) ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                {exporting ? '🔄 Exporting...' : '📈 Export Excel'}
              </button>
            </div>

            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              * {filterType === 'date' ? 'Select a date' : 'Select a month'} above to enable export options
            </div>
          </div>

          {/* Help Section */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(109, 40, 217, 0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#5b21b6',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <div>
                <strong>How to use:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
                  <li><strong>By Date:</strong> View expenses for a specific day</li>
                  <li><strong>By Month:</strong> View all expenses for an entire month (e.g., October 2025)</li>
                  <li><strong>Export:</strong> Download filtered data as CSV or Excel files</li>
                  <li><strong>Clear:</strong> Reset the filter to show no results</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}