import cron, { ScheduledTask } from 'node-cron';
import { renewAllWebhooks } from './webhookRenewal';

/**
 * Scheduled Job Runner
 * 
 * Manages all scheduled tasks for the CRM system, including:
 * - Webhook subscription renewals (Gmail and Outlook)
 * - Future: Lead scoring updates, data cleanup, etc.
 */

let isShuttingDown = false;
const activeJobs: ScheduledTask[] = [];

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log('[Scheduler] Initializing scheduled jobs...');

  // Job 1: Renew webhook subscriptions daily at 2 AM
  const webhookRenewalJob = cron.schedule(
    '0 2 * * *', // Every day at 2:00 AM
    async () => {
      if (isShuttingDown) {
        console.log('[Scheduler] Skipping webhook renewal - shutdown in progress');
        return;
      }

      console.log('[Scheduler] Running webhook renewal job...');
      try {
        const results = await renewAllWebhooks();
        
        // Log results
        console.log('[Scheduler] Webhook renewal completed:', {
          gmail: {
            success: results.gmail.success,
            failed: results.gmail.failed,
            errors: results.gmail.errors.length,
          },
          outlook: {
            success: results.outlook.success,
            failed: results.outlook.failed,
            errors: results.outlook.errors.length,
          },
        });

        // If there are failures, log them
        if (results.gmail.failed > 0 || results.outlook.failed > 0) {
          console.error('[Scheduler] Webhook renewal had failures:', {
            gmailErrors: results.gmail.errors,
            outlookErrors: results.outlook.errors,
          });
        }
      } catch (error: any) {
        console.error('[Scheduler] Webhook renewal job failed:', error.message);
      }
    },
    {
      timezone: 'UTC', // Use UTC to avoid timezone issues
    }
  );

  activeJobs.push(webhookRenewalJob);
  console.log('[Scheduler] Webhook renewal job scheduled (daily at 2:00 AM UTC)');

  // Job 2: Health check - run every 6 hours to verify scheduler is alive
  const healthCheckJob = cron.schedule(
    '0 */6 * * *', // Every 6 hours
    () => {
      if (!isShuttingDown) {
        console.log('[Scheduler] Health check - scheduler is running');
      }
    },
    {
      timezone: 'UTC',
    }
  );

  activeJobs.push(healthCheckJob);
  console.log('[Scheduler] Health check job scheduled (every 6 hours)');

  console.log(`[Scheduler] ${activeJobs.length} jobs initialized successfully`);
}

/**
 * Gracefully shutdown all scheduled jobs
 */
export function shutdownScheduler() {
  console.log('[Scheduler] Shutting down all scheduled jobs...');
  isShuttingDown = true;

  activeJobs.forEach((job, index) => {
    try {
      job.stop();
      console.log(`[Scheduler] Stopped job ${index + 1}/${activeJobs.length}`);
    } catch (error: any) {
      console.error(`[Scheduler] Error stopping job ${index + 1}:`, error.message);
    }
  });

  activeJobs.length = 0; // Clear the array
  console.log('[Scheduler] All jobs stopped');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: !isShuttingDown,
    activeJobs: activeJobs.length,
    jobs: [
      {
        name: 'Webhook Renewal',
        schedule: 'Daily at 2:00 AM UTC',
        description: 'Renews Gmail watches and Outlook webhook subscriptions',
      },
      {
        name: 'Health Check',
        schedule: 'Every 6 hours',
        description: 'Verifies scheduler is running',
      },
    ],
  };
}

// Handle process termination signals
process.on('SIGTERM', () => {
  console.log('[Scheduler] Received SIGTERM signal');
  shutdownScheduler();
});

process.on('SIGINT', () => {
  console.log('[Scheduler] Received SIGINT signal');
  shutdownScheduler();
});
