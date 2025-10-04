import { useState } from "react";
import axios from "axios";
import "../App.css";

export default function GroceryForm({ setMessage }) {
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [useToday, setUseToday] = useState(true);
  const [customDate, setCustomDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    let expenseDate;
    if (useToday) {
      expenseDate = new Date().toISOString();
    } else if (customDate) {
      expenseDate = new Date(customDate).toISOString();
    } else {
      expenseDate = new Date().toISOString();
    }

    await axios.post("http://localhost:5000/api/expenses", {
      title: itemName,
      amount,
      category,
      date: expenseDate,
    });

    setItemName("");
    setAmount("");
    setCategory("");
    setCustomDate("");
    setUseToday(true);

    setMessage("✅ Grocery expense added successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="card">
      <h2>🛒 Add Grocery Expense</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              placeholder="Item Name (e.g., Milk, Bread, Rice)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              <option value="Fruits & Vegetables">🥕 Fruits & Vegetables</option>
              <option value="Dairy Products">🥛 Dairy Products</option>
              <option value="Grains & Cereals">🌾 Grains & Cereals</option>
              <option value="Snacks">🍪 Snacks</option>
              <option value="Beverages">☕ Beverages</option>
              <option value="Meat & Fish">🐟 Meat & Fish</option>
              <option value="Household Items">🧽 Household Items</option>
              <option value="Other">📦 Other</option>
            </select>
          </div>

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
                padding: '10px 16px',
                borderRadius: '8px',
                background: useToday ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                border: useToday ? '2px solid #667eea' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="radio"
                  checked={useToday}
                  onChange={() => setUseToday(true)}
                  style={{ margin: 0 }}
                />
                <span>📅 Today ({new Date().toLocaleDateString()})</span>
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '10px 16px',
                borderRadius: '8px',
                background: !useToday ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                border: !useToday ? '2px solid #667eea' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="radio"
                  checked={!useToday}
                  onChange={() => setUseToday(false)}
                  style={{ margin: 0 }}
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
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px'
                  }}
                />
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            ✨ Add Grocery Expense
          </button>
        </form>
      </div>
    </div>
  );
}
