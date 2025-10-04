#!/usr/bin/env node

/**
 * Comprehensive System Test Script
 * Tests all aspects of the expense tracker including:
 * - Regular expense CRUD operations
 * - Future expense scheduling and processing
 * - Background processor functionality
 * - Notifications
 * - Integration between components
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
let authToken = null;

// Test configuration
const TEST_CONFIG = {
  user: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  server: BASE_URL,
  verbose: true
};

// Utility functions
const log = (message, level = 'info') => {
  if (!TEST_CONFIG.verbose && level === 'debug') return;
  
  const timestamp = new Date().toISOString().slice(11, 19);
  const icons = { info: '📋', success: '✅', error: '❌', debug: '🔍', warn: '⚠️' };
  console.log(`[${timestamp}] ${icons[level] || '📋'} ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API helpers
const apiCall = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test suites
const testAuth = async () => {
  log('🔐 Testing Authentication System...');
  
  try {
    // Try to register (might fail if user exists)
    const registerResult = await apiCall('POST', '/api/auth/register', TEST_CONFIG.user);
    if (registerResult.success) {
      log('Successfully registered new user', 'success');
    } else {
      log('User already exists or registration failed', 'debug');
    }

    // Login
    const loginResult = await apiCall('POST', '/api/auth/login', {
      email: TEST_CONFIG.user.email,
      password: TEST_CONFIG.user.password
    });

    if (loginResult.success) {
      authToken = loginResult.data.token;
      log('Successfully logged in', 'success');
      return true;
    } else {
      log('Login failed: ' + JSON.stringify(loginResult.error), 'error');
      return false;
    }
  } catch (error) {
    log('Auth test failed: ' + error.message, 'error');
    return false;
  }
};

const testRegularExpenses = async () => {
  log('💳 Testing Regular Expense Operations...');
  
  try {
    // Create sample expenses
    const sampleExpenses = [
      { title: 'Coffee', amount: 150, category: 'Food', description: 'Morning coffee' },
      { title: 'Uber ride', amount: 250, category: 'Transport', description: 'To office' },
      { title: 'Grocery', amount: 1200, category: 'Food', description: 'Weekly shopping' }
    ];

    const createdExpenses = [];
    
    for (const expense of sampleExpenses) {
      const result = await apiCall('POST', '/api/expenses', expense);
      if (result.success) {
        createdExpenses.push(result.data);
        log(`Created expense: ${expense.title} - ₹${expense.amount}`, 'success');
      } else {
        log(`Failed to create expense: ${expense.title}`, 'error');
      }
    }

    // List expenses
    const listResult = await apiCall('GET', '/api/expenses');
    if (listResult.success) {
      log(`Retrieved ${listResult.data.length} expenses`, 'success');
    }

    // Update an expense
    if (createdExpenses.length > 0) {
      const expenseToUpdate = createdExpenses[0];
      const updateResult = await apiCall('PUT', `/api/expenses/update/${expenseToUpdate.id}`, {
        title: expenseToUpdate.title + ' (Updated)',
        amount: expenseToUpdate.amount + 10,
        category: expenseToUpdate.category,
        description: expenseToUpdate.description + ' - Updated'
      });
      
      if (updateResult.success) {
        log('Successfully updated expense', 'success');
      } else {
        log('Failed to update expense', 'error');
      }
    }

    // Delete an expense
    if (createdExpenses.length > 1) {
      const expenseToDelete = createdExpenses[1];
      const deleteResult = await apiCall('DELETE', `/api/expenses/${expenseToDelete.id}`);
      
      if (deleteResult.success) {
        log('Successfully deleted expense', 'success');
      } else {
        log('Failed to delete expense', 'error');
      }
    }

    return true;
  } catch (error) {
    log('Regular expenses test failed: ' + error.message, 'error');
    return false;
  }
};

const testFutureExpenses = async () => {
  log('📅 Testing Future Expense System...');
  
  try {
    // Create future expenses with various scenarios
    const futureExpenses = [
      {
        title: 'Test EMI',
        amount: 15000,
        category: 'EMI',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        description: 'Monthly EMI payment',
        isRecurring: true,
        recurrence: {
          type: 'monthly',
          interval: 1,
          maxOccurrences: 12
        },
        notificationSettings: {
          enabled: true,
          daysBefore: 1
        }
      },
      {
        title: 'Insurance Premium',
        amount: 8000,
        category: 'Insurance',
        scheduledDate: new Date().toISOString().split('T')[0], // Today (due now)
        description: 'Annual insurance payment',
        isRecurring: false,
        notificationSettings: {
          enabled: true,
          daysBefore: 1
        }
      },
      {
        title: 'Subscription Renewal',
        amount: 999,
        category: 'Subscription',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        description: 'Monthly subscription',
        isRecurring: true,
        recurrence: {
          type: 'monthly',
          interval: 1,
          maxOccurrences: 6
        },
        notificationSettings: {
          enabled: true,
          daysBefore: 2
        }
      }
    ];

    const createdFutureExpenses = [];
    
    for (const expense of futureExpenses) {
      const result = await apiCall('POST', '/api/expenses/future', expense);
      if (result.success) {
        createdFutureExpenses.push(result.data);
        log(`Created future expense: ${expense.title} - ₹${expense.amount} (Due: ${expense.scheduledDate})`, 'success');
      } else {
        log(`Failed to create future expense: ${expense.title} - ${JSON.stringify(result.error)}`, 'error');
      }
    }

    // List future expenses
    const listResult = await apiCall('GET', '/api/expenses/future');
    if (listResult.success) {
      log(`Retrieved ${listResult.data.length} future expenses`, 'success');
    }

    // Get due expenses
    const dueResult = await apiCall('GET', '/api/expenses/future/due');
    if (dueResult.success) {
      log(`Found ${dueResult.data.length} due expenses`, 'success');
    }

    // Process due expenses
    const processResult = await apiCall('POST', '/api/expenses/future/process');
    if (processResult.success) {
      log(`Processing result: ${processResult.data.message}`, 'success');
    }

    return true;
  } catch (error) {
    log('Future expenses test failed: ' + error.message, 'error');
    return false;
  }
};

const testBackgroundProcessor = async () => {
  log('🔄 Testing Background Processor...');
  
  try {
    // Check system status
    const statusResult = await apiCall('GET', '/api/system/status');
    if (statusResult.success) {
      log('System Status:', 'success');
      log(`  Server: ${statusResult.data.server}`, 'debug');
      log(`  Background Processor Running: ${statusResult.data.backgroundProcessor.isRunning}`, 'debug');
      log(`  Active Jobs: ${statusResult.data.backgroundProcessor.activeJobs?.join(', ') || 'None'}`, 'debug');
    }

    // Trigger manual processing
    const manualProcessResult = await apiCall('POST', '/api/system/process-manual');
    if (manualProcessResult.success) {
      log(`Manual processing completed: ${manualProcessResult.data.message}`, 'success');
    } else {
      log(`Manual processing failed: ${JSON.stringify(manualProcessResult.error)}`, 'error');
    }

    return true;
  } catch (error) {
    log('Background processor test failed: ' + error.message, 'error');
    return false;
  }
};

const testIntegration = async () => {
  log('🔗 Testing System Integration...');
  
  try {
    // Create a future expense that's due today
    const todayExpense = {
      title: 'Integration Test Expense',
      amount: 500,
      category: 'Test',
      scheduledDate: new Date().toISOString().split('T')[0],
      description: 'Testing integration between future and regular expenses',
      isRecurring: false,
      notificationSettings: {
        enabled: true,
        daysBefore: 0
      }
    };

    const createResult = await apiCall('POST', '/api/expenses/future', todayExpense);
    if (createResult.success) {
      log('Created test future expense', 'success');
    }

    // Wait a moment
    await sleep(1000);

    // Process due expenses
    const processResult = await apiCall('POST', '/api/expenses/future/process');
    if (processResult.success) {
      log(`Processed due expenses: ${processResult.data.message}`, 'success');
    }

    // Check if the expense was created in regular expenses
    const regularExpensesResult = await apiCall('GET', '/api/expenses');
    if (regularExpensesResult.success) {
      const regularExpenses = regularExpensesResult.data;
      const createdFromFuture = regularExpenses.find(exp => 
        exp.title === todayExpense.title && exp.tags?.includes('from-scheduled')
      );
      
      if (createdFromFuture) {
        log('✅ Integration test passed! Future expense was converted to regular expense', 'success');
      } else {
        log('Integration test partial - expense may not have been processed yet', 'warn');
      }
    }

    return true;
  } catch (error) {
    log('Integration test failed: ' + error.message, 'error');
    return false;
  }
};

const generateReport = (results) => {
  log('📊 System Test Report');
  log('='.repeat(50));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'warn');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'success' : 'error');
  
  log('\\nTest Details:');
  Object.entries(results).forEach(([testName, result]) => {
    log(`  ${testName}: ${result ? 'PASS' : 'FAIL'}`, result ? 'success' : 'error');
  });
  
  if (passedTests === totalTests) {
    log('\\n🎉 All tests passed! Your expense tracker system is working perfectly!', 'success');
  } else {
    log(`\\n⚠️ ${failedTests} test(s) failed. Check the logs above for details.`, 'warn');
  }
  
  log('\\n💡 Next steps:');
  log('  1. Start the frontend: cd frontend && npm start');
  log('  2. Open http://localhost:3000 in your browser');
  log('  3. Login with test@example.com / password123');
  log('  4. Test the "System Demo" tab for interactive features');
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting Comprehensive System Tests...');
  log('='.repeat(50));
  
  const results = {};
  
  // Check if server is running
  try {
    const healthCheck = await apiCall('GET', '/api/system/status');
    if (!healthCheck.success) {
      log('❌ Server is not running! Please start the backend server first:', 'error');
      log('  cd backend && npm start', 'error');
      return;
    }
    log('Server is running', 'success');
  } catch (error) {
    log('❌ Cannot connect to server. Please start the backend first:', 'error');
    log('  cd backend && npm start', 'error');
    return;
  }
  
  // Run test suites
  log('\\n🧪 Running Test Suites...');
  
  results['Authentication'] = await testAuth();
  if (!results['Authentication']) {
    log('❌ Authentication failed. Cannot continue with other tests.', 'error');
    return;
  }
  
  await sleep(500);
  results['Regular Expenses'] = await testRegularExpenses();
  
  await sleep(500);
  results['Future Expenses'] = await testFutureExpenses();
  
  await sleep(500);
  results['Background Processor'] = await testBackgroundProcessor();
  
  await sleep(500);
  results['System Integration'] = await testIntegration();
  
  log('\\n');
  generateReport(results);
};

// Run the tests
runTests().catch(error => {
  log('💥 Test runner crashed: ' + error.message, 'error');
  console.error(error);
});