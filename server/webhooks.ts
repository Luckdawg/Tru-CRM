import { Router, Request, Response } from 'express';
import { createActivityFromEmail } from './emailSync';
import { getDb } from './db';
import { emailConnections } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { logger } from './_core/logger';
import { checkIdempotency, recordIdempotency } from './_core/idempotency';

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

    const idempotencyKey = `gmail-webhook-${message.messageId || historyId}`;
    
    logger.info('Gmail webhook notification received', { 
      emailAddress, 
      historyId,
      messageId: message.messageId,
      idempotencyKey
    });

    // Check if we've already processed this notification
    if (await checkIdempotency(idempotencyKey)) {
      logger.info('Gmail webhook: duplicate notification ignored', { idempotencyKey });
      res.status(200).json({ success: true, message: 'Already processed' });
      return;
    }

    // Find the email connection for this user
    const db = await getDb();
    if (!db) {
      logger.error('Gmail webhook: database not available');
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
      logger.warn('Gmail webhook: no connection found', { emailAddress });
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection = connections[0];

    // Log the notification for now
    // Full sync implementation would fetch new emails using Gmail API
    // and create activities using createActivityFromEmail()
    logger.info('Gmail webhook: would sync emails', { 
      emailAddress, 
      historyId, 
      connectionId: connection.id,
      userId: connection.userId 
    });

    // Record that we've processed this notification
    await recordIdempotency(idempotencyKey, { emailAddress, historyId });

    // Always return 200 to acknowledge receipt (prevents Pub/Sub retries)
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Gmail webhook: error processing notification', {}, error as Error);
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
      logger.info('Outlook webhook: responding to validation request');
      res.status(200).send(validationToken);
      return;
    }

    // Process actual notification
    const notifications = req.body.value;
    
    if (!Array.isArray(notifications)) {
      res.status(400).json({ error: 'Invalid notification format' });
      return;
    }

    logger.info('Outlook webhook: notifications received', { count: notifications.length });

    const db = await getDb();
    if (!db) {
      logger.error('Outlook webhook: database not available');
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    // Process each notification
    for (const notification of notifications) {
      const subscriptionId = notification.subscriptionId;
      const changeType = notification.changeType;
      const resource = notification.resource;
      const clientState = notification.clientState;
      
      // Create idempotency key from notification ID or combination of fields
      const idempotencyKey = `outlook-webhook-${subscriptionId}-${resource}-${changeType}`;

      logger.debug('Outlook webhook: processing notification', { 
        changeType, 
        subscriptionId, 
        resource,
        idempotencyKey
      });

      // Check if we've already processed this notification
      if (await checkIdempotency(idempotencyKey)) {
        logger.info('Outlook webhook: duplicate notification ignored', { idempotencyKey });
        continue;
      }

      // Find the connection associated with this subscription
      const connections = await db
        .select()
        .from(emailConnections)
        .where(
          eq(emailConnections.webhookSubscriptionId, subscriptionId)
        );

      if (connections.length === 0) {
        logger.warn('Outlook webhook: no connection found', { subscriptionId });
        continue;
      }

      const connection = connections[0];

      // Log the notification for now
      // Full sync implementation would fetch new emails using Microsoft Graph API
      // and create activities using createActivityFromEmail()
      logger.info('Outlook webhook: would sync emails', { 
        userId: connection.userId, 
        connectionId: connection.id,
        changeType 
      });

      // Record that we've processed this notification
      await recordIdempotency(idempotencyKey, { subscriptionId, changeType, resource });
    }

    // Return 202 Accepted to acknowledge receipt
    res.status(202).json({ success: true });
  } catch (error) {
    logger.error('Outlook webhook: error processing notification', {}, error as Error);
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
      logger.info('Webhook renewal: Gmail watch renewal requested', { connectionId });
      res.status(501).json({ error: 'Gmail watch renewal not yet implemented' });
    } else if (provider === 'outlook') {
      // Renew Outlook subscription
      // This would call Microsoft Graph API to extend the subscription
      logger.info('Webhook renewal: Outlook subscription renewal requested', { connectionId });
      res.status(501).json({ error: 'Outlook subscription renewal not yet implemented' });
    } else {
      res.status(400).json({ error: 'Invalid provider' });
    }
  } catch (error) {
    logger.error('Webhook renewal: error', {}, error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
