import { google } from 'googleapis';
import axios from 'axios';
import { getDb } from './db';
import { emailConnections } from '../drizzle/schema';
import { eq, lt, and } from 'drizzle-orm';

/**
 * Gmail Watch Renewal Service
 * 
 * Gmail watches expire after 7 days. This service renews watches
 * for all active Gmail connections before they expire.
 */
export async function renewGmailWatches(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const db = await getDb();
    if (!db) {
      results.errors.push('Database not available');
      return results;
    }

    // Find all active Gmail connections that need renewal (expiring within 2 days)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const connections = await db
      .select()
      .from(emailConnections)
      .where(
        and(
          eq(emailConnections.provider, 'Gmail'),
          eq(emailConnections.isActive, 1),
          lt(emailConnections.webhookExpiry, twoDaysFromNow)
        )
      );

    console.log(`[Gmail Renewal] Found ${connections.length} connections to renew`);

    for (const connection of connections) {
      try {
        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
          process.env.GMAIL_CLIENT_ID,
          process.env.GMAIL_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
          access_token: connection.accessToken,
          refresh_token: connection.refreshToken || undefined,
        });

        // Check if token needs refresh
        const tokenInfo = await oauth2Client.getAccessToken();
        if (tokenInfo.token && tokenInfo.token !== connection.accessToken) {
          // Token was refreshed, update in database
          await db
            .update(emailConnections)
            .set({
              accessToken: tokenInfo.token,
              tokenExpiry: tokenInfo.res?.data.expiry_date 
                ? new Date(tokenInfo.res.data.expiry_date)
                : undefined,
            })
            .where(eq(emailConnections.id, connection.id));
        }

        // Set up Gmail watch
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const watchResponse = await gmail.users.watch({
          userId: 'me',
          requestBody: {
            topicName: process.env.GMAIL_PUBSUB_TOPIC || 'projects/YOUR_PROJECT/topics/gmail-notifications',
            labelIds: ['INBOX'], // Watch only inbox, or remove to watch all labels
          },
        });

        // Calculate expiration (Gmail returns expiration in milliseconds)
        const expirationMs = parseInt(watchResponse.data.expiration || '0');
        const expirationDate = new Date(expirationMs);

        // Update connection with new watch expiration
        await db
          .update(emailConnections)
          .set({
            webhookExpiry: expirationDate,
            lastSyncAt: new Date(),
          })
          .where(eq(emailConnections.id, connection.id));

        console.log(`[Gmail Renewal] Successfully renewed watch for connection ${connection.id}, expires: ${expirationDate.toISOString()}`);
        results.success++;
      } catch (error: any) {
        console.error(`[Gmail Renewal] Failed to renew connection ${connection.id}:`, error.message);
        results.failed++;
        results.errors.push(`Connection ${connection.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error('[Gmail Renewal] Error:', error.message);
    results.errors.push(`General error: ${error.message}`);
  }

  return results;
}

/**
 * Outlook Webhook Subscription Renewal Service
 * 
 * Outlook webhook subscriptions expire after 3 days (max). This service
 * renews subscriptions for all active Outlook connections before they expire.
 */
export async function renewOutlookSubscriptions(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const db = await getDb();
    if (!db) {
      results.errors.push('Database not available');
      return results;
    }

    // Find all active Outlook connections that need renewal (expiring within 1 day)
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const connections = await db
      .select()
      .from(emailConnections)
      .where(
        and(
          eq(emailConnections.provider, 'Outlook'),
          eq(emailConnections.isActive, 1),
          lt(emailConnections.webhookExpiry, oneDayFromNow)
        )
      );

    console.log(`[Outlook Renewal] Found ${connections.length} connections to renew`);

    for (const connection of connections) {
      try {
        // Check if token needs refresh
        let accessToken = connection.accessToken;
        
        if (connection.tokenExpiry && new Date(connection.tokenExpiry) < new Date()) {
          // Token expired, refresh it
          if (!connection.refreshToken) {
            throw new Error('No refresh token available');
          }

          const tokenResponse = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
              client_id: process.env.OUTLOOK_CLIENT_ID || '',
              client_secret: process.env.OUTLOOK_CLIENT_SECRET || '',
              refresh_token: connection.refreshToken,
              grant_type: 'refresh_token',
            }),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
          );

          accessToken = tokenResponse.data.access_token;
          const expiresIn = tokenResponse.data.expires_in; // seconds
          const newExpiry = new Date();
          newExpiry.setSeconds(newExpiry.getSeconds() + expiresIn);

          // Update token in database
          await db
            .update(emailConnections)
            .set({
              accessToken,
              refreshToken: tokenResponse.data.refresh_token || connection.refreshToken,
              tokenExpiry: newExpiry,
            })
            .where(eq(emailConnections.id, connection.id));
        }

        // Renew or create webhook subscription
        if (connection.webhookSubscriptionId) {
          // Try to extend existing subscription
          try {
            const renewResponse = await axios.patch(
              `https://graph.microsoft.com/v1.0/subscriptions/${connection.webhookSubscriptionId}`,
              {
                expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            const newExpiry = new Date(renewResponse.data.expirationDateTime);
            
            await db
              .update(emailConnections)
              .set({
                webhookExpiry: newExpiry,
                lastSyncAt: new Date(),
              })
              .where(eq(emailConnections.id, connection.id));

            console.log(`[Outlook Renewal] Successfully renewed subscription ${connection.webhookSubscriptionId}, expires: ${newExpiry.toISOString()}`);
            results.success++;
          } catch (renewError: any) {
            // If renewal fails, try creating a new subscription
            console.warn(`[Outlook Renewal] Failed to renew subscription ${connection.webhookSubscriptionId}, creating new one`);
            throw renewError; // Will be caught by outer try-catch to create new subscription
          }
        } else {
          // Create new subscription
          const subscriptionResponse = await axios.post(
            'https://graph.microsoft.com/v1.0/subscriptions',
            {
              changeType: 'created',
              notificationUrl: `${process.env.PUBLIC_URL || 'https://your-domain.com'}/api/webhooks/outlook`,
              resource: 'me/mailFolders(\'Inbox\')/messages',
              expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              clientState: `connection_${connection.id}`, // Secret value for validation
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const subscriptionId = subscriptionResponse.data.id;
          const newExpiry = new Date(subscriptionResponse.data.expirationDateTime);

          await db
            .update(emailConnections)
            .set({
              webhookSubscriptionId: subscriptionId,
              webhookExpiry: newExpiry,
              lastSyncAt: new Date(),
            })
            .where(eq(emailConnections.id, connection.id));

          console.log(`[Outlook Renewal] Successfully created subscription ${subscriptionId}, expires: ${newExpiry.toISOString()}`);
          results.success++;
        }
      } catch (error: any) {
        console.error(`[Outlook Renewal] Failed to renew connection ${connection.id}:`, error.message);
        results.failed++;
        results.errors.push(`Connection ${connection.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error('[Outlook Renewal] Error:', error.message);
    results.errors.push(`General error: ${error.message}`);
  }

  return results;
}

/**
 * Renew all webhook subscriptions (both Gmail and Outlook)
 */
export async function renewAllWebhooks(): Promise<{
  gmail: { success: number; failed: number; errors: string[] };
  outlook: { success: number; failed: number; errors: string[] };
}> {
  console.log('[Webhook Renewal] Starting renewal process...');
  
  const gmailResults = await renewGmailWatches();
  const outlookResults = await renewOutlookSubscriptions();

  console.log('[Webhook Renewal] Renewal complete:', {
    gmail: `${gmailResults.success} success, ${gmailResults.failed} failed`,
    outlook: `${outlookResults.success} success, ${outlookResults.failed} failed`,
  });

  return {
    gmail: gmailResults,
    outlook: outlookResults,
  };
}
