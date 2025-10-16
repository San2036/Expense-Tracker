// Notification service for scheduled expense reminders

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.intervalId = null; // Track the interval ID
    this.isRunning = false; // Track if periodic check is already running
    this.init();
  }

  async init() {
    // Request notification permission on initialization
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      console.log('Notification permission:', this.permission);
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  // Show browser notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('Notifications not permitted');
      return false;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      tag: 'expense-reminder'
      // Note: badge, actions, and requireInteraction are only supported for persistent notifications via Service Workers
    };

    const notification = new Notification(title, {
      ...defaultOptions,
      ...options
    });

    // Handle notification clicks
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) {
        options.onClick();
      }
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return true;
  }

  // Check for due expenses and show notifications
  async checkDueExpenses() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/expenses/future/due', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const dueExpenses = await response.json();

      // Show notifications for due expenses
      dueExpenses.forEach(expense => {
        this.showDueExpenseNotification(expense);
      });

      return dueExpenses.length;
    } catch (error) {
      console.error('Error checking due expenses:', error);
      return 0;
    }
  }

  // Show notification for a specific due expense
  showDueExpenseNotification(expense) {
    const title = `💰 Expense Due: ${expense.title}`;
    const options = {
      body: `Amount: ₹${expense.amount?.toLocaleString()}\nCategory: ${expense.category}\nDue: ${this.formatDate(expense.scheduledDate)}`,
      icon: '/favicon.ico',
      tag: `expense-${expense.id}`,
      onClick: () => {
        // Could navigate to expense details or scheduled expenses page
        console.log('Clicked expense notification:', expense);
      }
    };

    return this.showNotification(title, options);
  }

  // Show notification for upcoming expenses (reminder)
  showUpcomingExpenseNotification(expense, daysAhead) {
    const title = `🔔 Expense Reminder: ${expense.title}`;
    const daysText = daysAhead === 1 ? 'tomorrow' : `in ${daysAhead} days`;
    const options = {
      body: `Amount: ₹${expense.amount?.toLocaleString()}\nDue: ${daysText}\nCategory: ${expense.category}`,
      icon: '/favicon.ico',
      tag: `reminder-${expense.id}`
    };

    return this.showNotification(title, options);
  }

  // Check for upcoming expenses based on notification settings
  async checkUpcomingExpenses() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/expenses/future', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const futureExpenses = await response.json();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let notificationCount = 0;

      futureExpenses.forEach(expense => {
        if (expense.status !== 'scheduled' || !expense.notificationSettings?.enabled) {
          return;
        }

        const scheduledDate = new Date(expense.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((scheduledDate - today) / (1000 * 60 * 60 * 24));
        const notifyDaysBefore = expense.notificationSettings.daysBefore || 1;

        if (daysDiff === notifyDaysBefore) {
          this.showUpcomingExpenseNotification(expense, daysDiff);
          notificationCount++;
        }
      });

      return notificationCount;
    } catch (error) {
      console.error('Error checking upcoming expenses:', error);
      return 0;
    }
  }

  // Start periodic checking for due/upcoming expenses
  startPeriodicCheck(intervalMinutes = 60) {
    // Prevent multiple intervals from being created
    if (this.isRunning) {
      console.log('Notification service is already running');
      return;
    }

    this.isRunning = true;
    
    // Check immediately
    this.checkDueExpenses();
    this.checkUpcomingExpenses();

    // Set up periodic checking
    const interval = intervalMinutes * 60 * 1000; // Convert to milliseconds
    
    this.intervalId = setInterval(() => {
      this.checkDueExpenses();
      this.checkUpcomingExpenses();
    }, interval);

    console.log(`🔔 Started periodic expense checking every ${intervalMinutes} minutes`);
  }

  // Stop periodic checking
  stopPeriodicCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🔔 Stopped periodic expense checking');
    }
  }

  // Format date for display
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateStr));
  }

  // Show summary notification
  showSummaryNotification(dueCount, upcomingCount) {
    if (dueCount === 0 && upcomingCount === 0) return;

    let title = '💼 Expense Tracker Update';
    let body = '';

    if (dueCount > 0) {
      body += `${dueCount} expense${dueCount > 1 ? 's' : ''} due now`;
    }

    if (upcomingCount > 0) {
      if (body) body += ', ';
      body += `${upcomingCount} upcoming expense${upcomingCount > 1 ? 's' : ''}`;
    }

    return this.showNotification(title, { body });
  }

  // Manual notification for testing
  showTestNotification() {
    return this.showNotification('🧪 Test Notification', {
      body: 'This is a test notification from Expense Tracker!',
      tag: 'test-notification'
    });
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();

export default notificationService;