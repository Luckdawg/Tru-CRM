import { Router, Request, Response } from 'express';
import { createActivityFromEmail } from './emailSync';
import { getDb } from './db';
import { emailConnections } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Gmail Pub/Sub Webhook Handler
 * 
 * Gmail sends push notifications via Google Cloud Pub/Sub when new emails arrive.
 * The notification contains the user's email address and a history ID.
 * 
 * Setup required:
 * 1. Enable Gmail API in Google Cloud Console
 * 2. Create a Pub/Sub topic (e.g., "gmail-notifications")
 * 3. Grant Gmail API publish permissions to the topic
 * 4. Set up watch on user's mailbox using Gmail API
 * 5. Configure this endpoint as the push endpoint in Pub/Sub subscription
 */
router.post('/webhooks/gmail', async (req: Request, res: Response) => {
  try {
    // Gmail sends notifications as Pub/Sub messages
    const message = req.body.message;
    
    if (!message || !message.data) {
      res.status(400).json({ error: 'Invalid Pub/Sub message' });
      return;
    }

    // Decode the base64-encoded message data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    // Extract email address and history ID from notification
    const emailAddress = notification.emailAddress;
    const historyId = notification.historyId;

    console.log(`[Gmail Webhook] Received notification for ${emailAddress}, historyId: ${historyId}`);

    // Find the email connection for this user
    const db = await getDb();
    if (!db) {
      console.error('[Gmail Webhook] Database not available');
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const connections = await db
      .select()
      .from(emailConnections)
      .where(
        eq(emailConnections.provider, 'Gmail')
      );

    if (connections.length === 0) {
      console.warn(`[Gmail Webhook] No connection found for ${emailAddress}`);
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection = connections[0];

    // Log the notification for now
    // Full sync implementation would fetch new emails using Gmail API
    // and create activities using createActivityFromEmail()
    console.log(`[Gmail Webhook] Notification received for ${emailAddress}, historyId: ${historyId}`);
    console.log(`[Gmail Webhook] Would sync emails for connection ${connection.id}`);

    // Always return 200 to acknowledge receipt (prevents Pub/Sub retries)
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Gmail Webhook] Error processing notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Microsoft Graph Webhook Handler
 * 
 * Microsoft Graph sends webhook notifications when email events occur.
 * The notification contains a subscription ID and change type.
 * 
 * Setup required:
 * 1. Register app in Azure Portal with Mail.Read permissions
 * 2. Create webhook subscription using Microsoft Graph API
 * 3. Provide this endpoint as the notification URL
 * 4. Implement validation token response for initial setup
 */
router.post('/webhooks/outlook', async (req: Request, res: Response) => {
  try {
    // Handle validation request (sent when creating subscription)
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      console.log('[Outlook Webhook] Responding to validation request');
      res.status(200).send(validationToken);
      return;
    }

    // Process actual notification
    const notifications = req.body.value;
    
    if (!Array.isArray(notifications)) {
      res.status(400).json({ error: 'Invalid notification format' });
      return;
    }

    console.log(`[Outlook Webhook] Received ${notifications.length} notification(s)`);

    const db = await getDb();
    if (!db) {
      console.error('[Outlook Webhook] Database not available');
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    // Process each notification
    for (const notification of notifications) {
      const subscriptionId = notification.subscriptionId;
      const changeType = notification.changeType;
      const resource = notification.resource;

      console.log(`[Outlook Webhook] Processing ${changeType} for subscription ${subscriptionId}`);

      // Find the connection associated with this subscription
      const connections = await db
        .select()
        .from(emailConnections)
        .where(
          eq(emailConnections.webhookSubscriptionId, subscriptionId)
        );

      if (connections.length === 0) {
        console.warn(`[Outlook Webhook] No connection found for subscription ${subscriptionId}`);
        continue;
      }

      const connection = connections[0];

      // Log the notification for now
      // Full sync implementation would fetch new emails using Microsoft Graph API
      // and create activities using createActivityFromEmail()
      console.log(`[Outlook Webhook] Notification received for user ${connection.userId}`);
      console.log(`[Outlook Webhook] Would sync emails for connection ${connection.id}`);
    }

    // Return 202 Accepted to acknowledge receipt
    res.status(202).json({ success: true });
  } catch (error) {
    console.error('[Outlook Webhook] Error processing notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook subscription renewal endpoint
 * 
 * Both Gmail and Outlook webhooks have expiration times:
 * - Gmail watch: 7 days
 * - Outlook subscription: 3 days (max)
 * 
 * This endpoint can be called periodically to renew subscriptions.
 */
router.post('/webhooks/renew', async (req: Request, res: Response) => {
  try {
    const { provider, connectionId } = req.body;

    if (!provider || !connectionId) {
      res.status(400).json({ error: 'Provider and connectionId required' });
      return;
    }

    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const connections = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.id, connectionId));

    if (connections.length === 0) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection = connections[0];

    if (provider === 'gmail') {
      // Renew Gmail watch
      // This would call Gmail API to set up a new watch
      // Implementation depends on having the Gmail API client configured
      console.log(`[Webhook Renewal] Gmail watch renewal for connection ${connectionId}`);
      res.status(501).json({ error: 'Gmail watch renewal not yet implemented' });
    } else if (provider === 'outlook') {
      // Renew Outlook subscription
      // This would call Microsoft Graph API to extend the subscription
      console.log(`[Webhook Renewal] Outlook subscription renewal for connection ${connectionId}`);
      res.status(501).json({ error: 'Outlook subscription renewal not yet implemented' });
    } else {
      res.status(400).json({ error: 'Invalid provider' });
    }
  } catch (error) {
    console.error('[Webhook Renewal] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
