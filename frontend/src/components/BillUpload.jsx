import { useState } from "react";
import axios from "axios";
import "../App.css";
import { apiUrl } from '../utils/api';

export default function BillUpload({ setMessage }) {
  const [supermarket, setSupermarket] = useState("");
  const [amount, setAmount] = useState("");
  const [billFiles, setBillFiles] = useState([]);
  const [useToday, setUseToday] = useState(true);
  const [customDate, setCustomDate] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    if (validFiles.length > 0) {
      setBillFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    if (validFiles.length > 0) {
      setBillFiles(prev => [...prev, ...validFiles]);
    }
  };
  
  const removeFile = (indexToRemove) => {
    setBillFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return '📄';
    } else if (file.type.startsWith('image/')) {
      return '🖼️';
    }
    return '📎';
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (billFiles.length === 0) {
      setMessage("❌ Please select at least one file to upload.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("supermarket", supermarket);
      formData.append("amount", amount);
      
      // Append all files
      billFiles.forEach((file, index) => {
        formData.append(`billFiles`, file);
      });

      if (useToday) {
        formData.append("date", new Date().toISOString());
      } else {
        formData.append("date", new Date(customDate).toISOString());
      }

      // ✅ axios will set the correct Content-Type automatically
      const res = await axios.post(
        apiUrl('/api/expenses/upload-bill'),
        formData
      );

      console.log("Upload response:", res.data);

      // Reset form only if success
      setSupermarket("");
      setAmount("");
      setBillFiles([]);
      setCustomDate("");
      setUseToday(true);

      setMessage(`✅ ${billFiles.length} file(s) uploaded successfully!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("❌ Bill upload failed. Check server logs.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <div className="card">
      <h2>📸 Upload Bill Receipt</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              placeholder="Shop/Store Name (e.g., Big Bazaar, DMart)"
              value={supermarket}
              onChange={(e) => setSupermarket(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Total Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Beautiful Drag & Drop File Upload */}
          <div 
            className={`file-upload-container ${dragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>📁</div>
              {billFiles.length > 0 ? (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#10b981',
                    marginBottom: '12px'
                  }}>
                    ✅ {billFiles.length} File(s) Selected!
                  </div>
                  
                  {/* File List */}
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginBottom: '12px'
                  }}>
                    {billFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        margin: '4px 0',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>
                            {getFileIcon(file)}
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#374151',
                              wordBreak: 'break-all'
                            }}>
                              {file.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af', 
                    marginTop: '8px' 
                  }}>
                    Click to add more files
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#4a5568',
                    marginBottom: '8px'
                  }}>
                    Drop your bill files here
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#718096' 
                  }}>
                    or click to browse files
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#a0aec0', 
                    marginTop: '8px' 
                  }}>
                    Supports: Images (JPG, PNG, WEBP) & PDF files
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af', 
                    marginTop: '4px' 
                  }}>
                    You can select multiple files at once
                  </div>
                </div>
              )}
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Date Selection */}
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '12px 18px',
                borderRadius: '10px',
                background: useToday ? 'rgba(102, 126, 234, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                border: useToday ? '2px solid #667eea' : '2px solid #d1d5db',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}>
                <input
                  type="radio"
                  checked={useToday}
                  onChange={() => setUseToday(true)}
                  style={{ margin: 0, accentColor: '#667eea' }}
                />
                <span>📅 Today ({new Date().toLocaleDateString()})</span>
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '12px 18px',
                borderRadius: '10px',
                background: !useToday ? 'rgba(102, 126, 234, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                border: !useToday ? '2px solid #667eea' : '2px solid #d1d5db',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}>
                <input
                  type="radio"
                  checked={!useToday}
                  onChange={() => setUseToday(false)}
                  style={{ margin: 0, accentColor: '#667eea' }}
                />
                <span>🗓️ Custom Date</span>
              </label>
              
              {!useToday && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    fontWeight: '500',
                    background: '#ffffff',
                    transition: 'all 0.3s ease'
                  }}
                />
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            🚀 Upload Bill Receipt
          </button>
        </form>
      </div>
    </div>
  );
}
