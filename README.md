# 💰 Smart Expense Tracker

A comprehensive expense tracking system with advanced features for managing both regular and future expenses, complete with automated processing, notifications, and a modern web interface.

## 🚀 Features

### Core Functionality
- ✅ **User Authentication** - Secure login/register with JWT tokens
- ✅ **Regular Expense Management** - CRUD operations for daily expenses
- ✅ **Bill/Receipt Upload** - Upload and manage expense documents
- ✅ **Expense Categories** - Organize expenses by categories
- ✅ **Expense Filtering** - Filter by date range, category, and amount

### Advanced Features
- ✅ **Future Expense Scheduling** - Schedule one-time and recurring expenses
- ✅ **EMI & Subscription Management** - Set up recurring payments
- ✅ **Automated Processing** - Background service converts due expenses to actual expenses
- ✅ **Smart Notifications** - Browser notifications for due and upcoming expenses  
- ✅ **Recurrence Patterns** - Daily, weekly, monthly, and yearly recurring expenses
- ✅ **Notification Settings** - Customizable notification timing (days before due)

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Regular         │  │ Future Expense   │  │ Demo        │ │
│  │ Expenses        │  │ Management       │  │ Component   │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Express API     │  │ Background       │  │ Azure Blob  │ │
│  │ Routes          │  │ Processor        │  │ Storage     │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📱 User Interface

The application features a modern tabbed interface:

1. **💳 Regular Expenses** - Manage daily expenses, upload bills, view expense history
2. **📅 Future Expenses & EMIs** - Schedule and manage future expenses and recurring payments
3. **🚀 System Demo** - Interactive demo with sample data and testing features

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Azure Blob Storage account
- Modern web browser with notification support

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file with your Azure credentials:
   ```env
   AZURE_STORAGE_ACCOUNT_NAME=your_account_name
   AZURE_STORAGE_ACCOUNT_KEY=your_account_key
   AZURE_STORAGE_CONTAINER_NAME=your_container_name
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend application:**
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`

## 🧪 Testing the System

### Automated System Test

Run the comprehensive test suite:
```bash
cd backend
npm run test:system
```

This will test:
- Authentication system
- Regular expense operations
- Future expense functionality
- Background processor
- System integration

### Manual Testing via Web Interface

1. **Access the application** at `http://localhost:3000`
2. **Register/Login** with your credentials
3. **Navigate to "System Demo" tab**
4. **Use the demo features:**
   - Create sample EMIs and subscriptions
   - Process due expenses manually
   - Test notification system
   - View real-time statistics

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Regular Expense Endpoints
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/update/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/upload` - Upload bill/receipt

### Future Expense Endpoints
- `GET /api/expenses/future` - List future expenses
- `POST /api/expenses/future` - Create future expense
- `GET /api/expenses/future/due` - Get due expenses
- `POST /api/expenses/future/process` - Process due expenses

### System Endpoints
- `GET /api/system/status` - Get system status
- `POST /api/system/process-manual` - Trigger manual processing

## 🔄 Background Processing

The system includes an automated background processor that:

- **Runs every 30 minutes** to check for due expenses
- **Processes recurring expenses** automatically
- **Creates next occurrences** for recurring payments
- **Handles notification scheduling**
- **Maintains expense history**

### Background Jobs

1. **Due Expense Processing** (`0 */30 * * * *`)
   - Checks all users for due expenses
   - Converts scheduled expenses to actual expenses
   - Creates next occurrences for recurring expenses

2. **Notification System** (`0 9 * * *`)
   - Daily check for upcoming expenses
   - Sends browser notifications based on user preferences

## 🔔 Notification System

The notification service provides:

- **Browser Notifications** for due and upcoming expenses
- **Customizable Timing** - set notification days in advance
- **Automatic Permission Request** - seamless user experience
- **Batch Notifications** - summary of multiple due expenses
- **Real-time Checks** - periodic background monitoring

### Notification Features
- Test notifications on demand
- Summary notifications for multiple expenses
- Respects user notification preferences
- Automatic permission handling

## 📊 Data Management

### Storage Structure
```
Azure Blob Storage
├── expenses/
│   └── {userId}/
│       ├── expenses.json      # Regular expenses
│       ├── future.json        # Future/scheduled expenses
│       └── uploads/           # Uploaded bills/receipts
└── users/
    └── users.json             # User accounts
```

### Data Models

**Regular Expense:**
```json
{
  "id": "exp_unique_id",
  "title": "Coffee",
  "amount": 150,
  "category": "Food",
  "description": "Morning coffee",
  "date": "2023-12-01",
  "type": "manual",
  "tags": ["daily"]
}
```

**Future Expense:**
```json
{
  "id": "future_unique_id",
  "title": "Home Loan EMI",
  "amount": 25000,
  "category": "EMI",
  "scheduledDate": "2023-12-15",
  "description": "Monthly EMI payment",
  "isRecurring": true,
  "recurrence": {
    "type": "monthly",
    "interval": 1,
    "maxOccurrences": 240
  },
  "notificationSettings": {
    "enabled": true,
    "daysBefore": 2
  },
  "status": "scheduled"
}
```

## 🎯 Use Cases

### Personal Finance Management
- Track daily expenses and income
- Categorize spending patterns
- Upload and store receipts
- Set spending budgets and limits

### Recurring Payment Management  
- Set up monthly EMI payments
- Manage subscription services
- Track insurance premiums
- Handle utility bill payments

### Financial Planning
- Schedule future expenses
- Plan for major purchases
- Track recurring commitments
- Monitor spending trends

## 🔧 Configuration Options

### Notification Settings
```javascript
// Frontend notification service configuration
notificationService.configure({
  checkInterval: 30, // minutes
  defaultDaysBefore: 1,
  enableSound: true,
  showSummary: true
});
```

### Background Processor Settings
```javascript
// Backend processor configuration  
// Every 30 minutes: '0 */30 * * * *'
// Every hour: '0 0 * * * *'  
// Every day at 9 AM: '0 9 * * *'
cron.schedule('0 */30 * * * *', processExpenses);
```

### Recurrence Patterns
- **Daily**: Every N days
- **Weekly**: Every N weeks  
- **Monthly**: Every N months
- **Yearly**: Every N years

## 🚧 Development

### Project Structure
```
expense-tracker/
├── backend/
│   ├── routes/           # API route handlers
│   ├── services/         # Background services
│   ├── config/          # Configuration files
│   ├── azureBlob.js     # Storage operations
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # Frontend services
│   │   └── App.jsx       # Main app component
│   └── public/          # Static files
├── test-system.js       # Comprehensive test suite
└── README.md           # This file
```

### Adding New Features

1. **Backend**: Add new routes in `/routes/` directory
2. **Frontend**: Create new components in `/src/components/`
3. **Services**: Add business logic in respective service files
4. **Tests**: Update `test-system.js` with new test cases

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
- Check Azure Blob Storage credentials
- Ensure all dependencies are installed
- Verify Node.js version compatibility

**Frontend connection issues:**
- Confirm backend server is running on port 5000
- Check for CORS configuration
- Verify API endpoints in frontend code

**Background processor not working:**
- Check server logs for cron job execution
- Verify system time and timezone settings
- Ensure adequate system resources

**Notifications not appearing:**
- Check browser notification permissions
- Verify HTTPS is enabled (required for notifications)
- Test with different browsers

### Debug Mode

Enable verbose logging:
```javascript
// Backend
console.log('Debug mode enabled');
process.env.DEBUG = 'true';

// Frontend  
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋‍♀️ Support

For questions or issues:
1. Check the troubleshooting section
2. Run the system test suite
3. Review the API documentation
4. Open an issue in the repository

---

## 🎉 Quick Start Guide

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Backend setup:**
   ```bash
   cd backend
   npm install
   # Configure .env file
   npm start
   ```

3. **Frontend setup:**
   ```bash
   cd frontend  
   npm install
   npm start
   ```

4. **Test the system:**
   ```bash
   cd backend
   npm run test:system
   ```

5. **Access the app** at `http://localhost:3000`

Enjoy your smart expense tracking experience! 💰✨