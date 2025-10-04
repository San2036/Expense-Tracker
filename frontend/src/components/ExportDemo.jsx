import React from 'react';
import { exportToCSV, exportToExcel, exportCurrentData } from '../utils/exportUtils';

// Sample data for testing export functionality
const sampleExpenses = [
  {
    id: '1',
    date: '2024-10-02T10:30:00.000Z',
    title: 'Groceries',
    amount: 1500,
    category: 'Food',
    supermarket: 'DMart',
    imageUrl: 'https://example.com/bill1.jpg',
    isImage: true,
    isPDF: false,
    fileName: 'grocery_bill.jpg'
  },
  {
    id: '2',
    date: '2024-10-02T14:15:00.000Z',
    title: 'Fuel',
    amount: 2000,
    category: 'Transport'
  },
  {
    id: '3',
    date: '2024-10-02T16:45:00.000Z',
    supermarket: 'Big Bazaar',
    amount: 3500,
    category: 'Shopping',
    fileUrl: 'https://example.com/receipt.pdf',
    isPDF: true,
    isImage: false,
    fileName: 'shopping_receipt.pdf'
  },
  {
    id: '4',
    date: '2024-10-02T18:20:00.000Z',
    title: 'Coffee',
    amount: 250,
    category: 'Food & Beverages'
  },
  {
    id: '5',
    date: '2024-10-02T20:10:00.000Z',
    supermarket: 'Medical Store',
    amount: 850,
    category: 'Healthcare',
    imageUrl: 'https://example.com/medicine_bill.jpg',
    isImage: true,
    isPDF: false,
    fileName: 'medicine_bill.jpg'
  }
];

const ExportDemo = () => {
  const handleTestExport = (format) => {
    console.log(`Testing ${format} export with sample data:`, sampleExpenses);
    exportCurrentData(sampleExpenses, format, 'demo_expenses');
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px dashed #cbd5e0',
      borderRadius: '12px',
      margin: '20px',
      backgroundColor: '#f8fafc'
    }}>
      <h3 style={{ color: '#4a5568', marginBottom: '15px' }}>
        🧪 Export Functionality Demo
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          This demo will export sample expense data to test the export functionality.
          Sample data includes {sampleExpenses.length} expenses with various types (manual entries, receipts, PDFs).
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleTestExport('csv')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          📊 Test CSV Export
        </button>
        
        <button
          onClick={() => handleTestExport('excel')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          📈 Test Excel Export
        </button>
      </div>

      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        * Files will be downloaded to your default Downloads folder
      </div>
    </div>
  );
};

export default ExportDemo;