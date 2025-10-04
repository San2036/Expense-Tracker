// Export utility functions for CSV and Excel generation

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Convert expenses to CSV format
export const exportToCSV = (expenses, filename = 'expenses') => {
  if (!expenses || expenses.length === 0) {
    alert('No data to export');
    return;
  }

  // CSV headers
  const headers = [
    'Date',
    'Type',
    'Description',
    'Amount (₹)',
    'Category',
    'Supermarket/Store',
    'File Attached',
    'File Type'
  ];

  // Convert expense data to CSV rows
  const csvRows = expenses.map(expense => {
    const isReceipt = expense.imageUrl || expense.fileUrl;
    return [
      formatDate(expense.date),
      isReceipt ? 'Receipt/Bill' : 'Manual Entry',
      isReceipt ? expense.supermarket || 'N/A' : expense.title || 'N/A',
      expense.amount || 0,
      expense.category || 'Uncategorized',
      expense.supermarket || 'N/A',
      (expense.imageUrl || expense.fileUrl) ? 'Yes' : 'No',
      expense.isPDF ? 'PDF' : expense.isImage ? 'Image' : 'N/A'
    ].map(field => {
      // Escape fields that contain commas, quotes, or newlines
      const stringField = String(field || '');
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    });
  });

  // Calculate totals
  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalCount = expenses.length;

  // Add summary rows
  csvRows.push([]);
  csvRows.push(['Summary', '', '', '', '', '', '', '']);
  csvRows.push(['Total Expenses', '', '', totalAmount.toFixed(2), '', '', '', '']);
  csvRows.push(['Total Count', '', '', totalCount, '', '', '', '']);

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => Array.isArray(row) ? row.join(',') : row)
    .join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Convert expenses to Excel-like CSV format (tab-separated for better Excel compatibility)
export const exportToExcel = (expenses, filename = 'expenses') => {
  if (!expenses || expenses.length === 0) {
    alert('No data to export');
    return;
  }

  // Excel-friendly headers
  const headers = [
    'Date',
    'Type',
    'Description',
    'Amount',
    'Category',
    'Store/Supermarket',
    'Has File',
    'File Type',
    'File Name'
  ];

  // Convert expense data to tab-separated rows
  const excelRows = expenses.map(expense => {
    const isReceipt = expense.imageUrl || expense.fileUrl;
    return [
      formatDate(expense.date),
      isReceipt ? 'Receipt/Bill' : 'Manual Entry',
      isReceipt ? expense.supermarket || 'N/A' : expense.title || 'N/A',
      parseFloat(expense.amount || 0),
      expense.category || 'Uncategorized',
      expense.supermarket || 'N/A',
      (expense.imageUrl || expense.fileUrl) ? 'Yes' : 'No',
      expense.isPDF ? 'PDF' : expense.isImage ? 'Image' : 'N/A',
      expense.fileName || 'N/A'
    ].map(field => String(field || '').replace(/\t/g, ' '));
  });

  // Calculate totals
  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalCount = expenses.length;
  const receiptCount = expenses.filter(exp => exp.imageUrl || exp.fileUrl).length;
  const manualCount = totalCount - receiptCount;

  // Add summary rows
  excelRows.push([]);
  excelRows.push(['SUMMARY', '', '', '', '', '', '', '', '']);
  excelRows.push(['Total Amount', '', '', totalAmount.toFixed(2), '', '', '', '', '']);
  excelRows.push(['Total Expenses', '', '', totalCount, '', '', '', '', '']);
  excelRows.push(['Receipt Entries', '', '', receiptCount, '', '', '', '', '']);
  excelRows.push(['Manual Entries', '', '', manualCount, '', '', '', '', '']);

  // Combine headers and rows with tabs
  const tsvContent = [headers, ...excelRows]
    .map(row => Array.isArray(row) ? row.join('\t') : row)
    .join('\n');

  // Create and download the file with .xls extension for Excel
  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export expenses by date range
export const exportExpensesByDate = async (startDate, endDate, format = 'csv') => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/expenses/export?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch export data');
    }
    
    const expenses = await response.json();
    
    const filename = startDate === endDate 
      ? `expenses_${startDate}` 
      : `expenses_${startDate}_to_${endDate}`;
    
    if (format === 'excel') {
      exportToExcel(expenses, filename);
    } else {
      exportToCSV(expenses, filename);
    }
    
    return { success: true, count: expenses.length };
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export data. Please try again.');
    return { success: false, error: error.message };
  }
};

// Quick export current filtered data
export const exportCurrentData = (expenses, format = 'csv', filename = 'current_expenses') => {
  if (format === 'excel') {
    exportToExcel(expenses, filename);
  } else {
    exportToCSV(expenses, filename);
  }
};