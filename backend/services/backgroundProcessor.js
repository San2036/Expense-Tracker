import cron from 'node-cron';
import axios from 'axios';
import { processDueFutureExpenses } from '../config/azureBlob.js';

class BackgroundProcessor {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start the background processor
  start() {
    if (this.isRunning) {
      console.log('⚠️ Background processor is already running');
      return;
    }

    console.log('🚀 Starting background processor...');
    
    // Run every 30 minutes: 0 */30 * * * *
    // For testing, run every minute: * * * * *
    this.jobs.set('processDueExpenses', cron.schedule('0 */30 * * * *', async () => {
      await this.processAllDueExpenses();
    }, {
      scheduled: false
    }));

    // Run every day at 9 AM: 0 9 * * *
    this.jobs.set('notifyUpcoming', cron.schedule('0 9 * * *', async () => {
      await this.notifyUpcomingExpenses();
    }, {
      scheduled: false
    }));

    // Start all jobs
    this.jobs.forEach(job => job.start());
    this.isRunning = true;
    
    console.log('✅ Background processor started successfully');
  }

  // Stop the background processor
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Background processor is not running');
      return;
    }

    console.log('⏹️ Stopping background processor...');
    
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    this.isRunning = false;
    
    console.log('✅ Background processor stopped');
  }

  // Process due expenses for all users
  async processAllDueExpenses() {
    try {
      console.log('🔄 Processing due expenses for all users...');
      
      // Use the built-in processDueFutureExpenses function which handles all users
      const processedExpenses = await processDueFutureExpenses();
      
      console.log(`✅ Processed ${processedExpenses.length} due expenses`);
      return processedExpenses.length;
    } catch (error) {
      console.error('❌ Error in processAllDueExpenses:', error.message);
      return 0;
    }
  }

  // Notify users about upcoming expenses (placeholder)
  async notifyUpcomingExpenses() {
    try {
      console.log('🔔 Checking for upcoming expenses to notify...');
      
      // This would typically send emails, push notifications, etc.
      // For now, we'll just log the notification
      
      // TODO: In a real application, you would:
      // 1. Get all users from a user database
      // 2. Check their notification preferences
      // 3. Send actual notifications (email, SMS, push)
      
      console.log('🔔 Notification system is not fully implemented yet');
    } catch (error) {
      console.error('❌ Error in notifyUpcomingExpenses:', error.message);
    }
  }

  // Get processor status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      uptime: this.isRunning ? process.uptime() : 0
    };
  }

  // Run a manual check (for testing)
  async runManualCheck() {
    console.log('🔧 Running manual due expense check...');
    await this.processAllDueExpenses();
    await this.notifyUpcomingExpenses();
  }
}

// Create and export singleton instance
const backgroundProcessor = new BackgroundProcessor();

export default backgroundProcessor;
