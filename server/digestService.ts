import * as db from './db';
import { notifyOwner } from './_core/notification';
import { logger } from './_core/logger';

/**
 * Generate and send email digest for a user
 */
export async function generateAndSendDigest(userId: number, userName: string, userEmail: string) {
  try {
    const prefs = await db.getUserPreferences(userId);
    if (!prefs || !prefs.digestEnabled) {
      await db.logEmailDigest({
        userId,
        digestType: 'Combined',
        itemCount: 0,
        status: 'Skipped',
        errorMessage: 'Digest disabled',
      });
      return;
    }

    let digestContent = '';
    let totalItems = 0;

    // At-risk deals section
    if (prefs.includeAtRiskDeals) {
      const atRiskDeals = await db.getAtRiskDealsForDigest(userId);
      if (atRiskDeals.length > 0) {
        digestContent += `## At-Risk Opportunities (${atRiskDeals.length})\\n\\n`;
        atRiskDeals.slice(0, 5).forEach(deal => {
          const amount = deal.amount ? `$${parseFloat(deal.amount.toString()).toLocaleString()}` : 'N/A';
          const healthScore = deal.healthScore || 0;
          const daysStale = deal.lastActivityDate 
            ? Math.floor((Date.now() - new Date(deal.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
            : 'N/A';
          
          digestContent += `- **${deal.opportunityName}** (${deal.accountName})\\n`;
          digestContent += `  - Stage: ${deal.stage} | Amount: ${amount}\\n`;
          digestContent += `  - Health Score: ${healthScore}/100 | Days since activity: ${daysStale}\\n`;
          digestContent += `  - Close Date: ${deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : 'Not set'}\\n\\n`;
        });
        totalItems += atRiskDeals.length;
      }
    }

    // Low-engagement accounts section
    if (prefs.includeLowEngagement) {
      const lowEngagement = await db.getLowEngagementAccountsForDigest(userId);
      if (lowEngagement.length > 0) {
        digestContent += `## Low-Engagement Accounts (${lowEngagement.length})\\n\\n`;
        lowEngagement.slice(0, 5).forEach(account => {
          digestContent += `- **${account.accountName}**\\n`;
          digestContent += `  - Engagement Score: ${account.engagementScore}/100 (${account.engagementLevel})\\n`;
          digestContent += `  - Activities: ${account.activityCount} | Days since last: ${account.daysSinceLastActivity}\\n`;
          digestContent += `  - Industry: ${account.industry || 'N/A'} | Region: ${account.region || 'N/A'}\\n\\n`;
        });
        totalItems += lowEngagement.length;
      }
    }

    // Send digest if there's content
    if (digestContent && totalItems > 0) {
      const title = `Sales Digest for ${userName} - ${new Date().toLocaleDateString()}`;
      const fullContent = `# ${title}\\n\\n${digestContent}\\n---\\nThis is an automated digest. To manage preferences, visit your CRM settings.`;

      // Send via notification API
      const sent = await notifyOwner({
        title,
        content: fullContent,
      });

      await db.logEmailDigest({
        userId,
        digestType: 'Combined',
        itemCount: totalItems,
        status: sent ? 'Sent' : 'Failed',
        errorMessage: sent ? undefined : 'Notification API failed',
      });

      return sent;
    } else {
      // No items to report
      await db.logEmailDigest({
        userId,
        digestType: 'Combined',
        itemCount: 0,
        status: 'Skipped',
        errorMessage: 'No items to report',
      });
      return true;
    }
  } catch (error) {
    await db.logEmailDigest({
      userId,
      digestType: 'Combined',
      itemCount: 0,
      status: 'Failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Run digest job (called by scheduler)
 */
export async function runDigestJob(frequency: 'Daily' | 'Weekly') {
  const now = new Date();
  const currentDay = now.getDay(); // 0-6
  const currentHour = now.getHours();

  const usersToNotify = await db.getUsersForDigest(frequency, currentDay, currentHour);

  logger.info('Digest job started', { frequency, userCount: usersToNotify.length, currentDay, currentHour });

  for (const userPref of usersToNotify) {
    // Get user info
    const user = await db.getUserById(userPref.userId);
    if (user) {
      await generateAndSendDigest(user.id, user.name || 'User', user.email || '');
    }
  }
}
