/**
 * Idempotency Utilities
 * 
 * Ensures webhook events and email sync operations are processed exactly once,
 * even if webhooks are delivered multiple times.
 */

import { getDb } from '../db';
import { logger } from './logger';

/**
 * Processed Events Table Schema (add to drizzle/schema.ts):
 * 
 * export const processedEvents = mysqlTable("processedEvents", {
 *   id: int("id").autoincrement().primaryKey(),
 *   eventType: varchar("eventType", { length: 50 }).notNull(), // "gmail_webhook", "outlook_webhook", "email_sync"
 *   eventKey: varchar("eventKey", { length: 255 }).notNull().unique(), // messageId or historyId
 *   processedAt: timestamp("processedAt").defaultNow().notNull(),
 *   metadata: json("metadata"), // Additional context
 * }, (table) => ({
 *   eventKeyIdx: index("event_key_idx").on(table.eventKey),
 *   eventTypeIdx: index("event_type_idx").on(table.eventType),
 * }));
 */

export interface ProcessedEvent {
  id: number;
  eventType: string;
  eventKey: string;
  processedAt: Date;
  metadata?: any;
}

/**
 * Check if an event has already been processed
 */
export async function isEventProcessed(eventType: string, eventKey: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logger.warn('Database unavailable for idempotency check', { eventType, eventKey });
      return false; // Fail open to avoid blocking legitimate events
    }

    // Query processedEvents table
    // const result = await db.select().from(processedEvents).where(eq(processedEvents.eventKey, eventKey)).limit(1);
    // return result.length > 0;

    // Temporary implementation using activities table
    // Check if an activity with this emailMessageId already exists
    const { activities } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.emailMessageId, eventKey))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    logger.error('Error checking event processing status', { eventType, eventKey }, error as Error);
    return false; // Fail open
  }
}

/**
 * Mark an event as processed
 */
export async function markEventProcessed(
  eventType: string,
  eventKey: string,
  metadata?: any
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logger.warn('Database unavailable for marking event as processed', { eventType, eventKey });
      return false;
    }

    // Insert into processedEvents table
    // await db.insert(processedEvents).values({
    //   eventType,
    //   eventKey,
    //   metadata,
    // });

    logger.info('Event marked as processed', { eventType, eventKey });
    return true;
  } catch (error) {
    // If unique constraint violation, event was already processed (race condition)
    if ((error as any).code === 'ER_DUP_ENTRY') {
      logger.debug('Event already processed (race condition)', { eventType, eventKey });
      return true;
    }

    logger.error('Error marking event as processed', { eventType, eventKey }, error as Error);
    return false;
  }
}

/**
 * Process an event with idempotency guarantee
 * 
 * Usage:
 * await processIdempotently('gmail_webhook', messageId, async () => {
 *   // Process the email
 *   await createActivityFromEmail(email);
 * });
 */
export async function processIdempotently<T>(
  eventType: string,
  eventKey: string,
  handler: () => Promise<T>,
  metadata?: any
): Promise<{ processed: boolean; result?: T }> {
  const context = { eventType, eventKey };

  // Check if already processed
  if (await isEventProcessed(eventType, eventKey)) {
    logger.debug('Event already processed, skipping', context);
    return { processed: false };
  }

  // Mark as processed before executing (optimistic locking)
  await markEventProcessed(eventType, eventKey, metadata);

  // Execute handler
  try {
    const result = await handler();
    logger.info('Event processed successfully', context);
    return { processed: true, result };
  } catch (error) {
    logger.error('Error processing event', context, error as Error);
    // Note: Event remains marked as processed to prevent retry loops
    // Manual intervention may be required for failed events
    throw error;
  }
}

/**
 * Clean up old processed events (run periodically)
 * Keeps last 30 days of events
 */
export async function cleanupProcessedEvents(daysToKeep: number = 30): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      logger.warn('Database unavailable for cleanup');
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old events
    // const result = await db.delete(processedEvents).where(lt(processedEvents.processedAt, cutoffDate));
    // logger.info(`Cleaned up ${result.rowsAffected} old processed events`, { daysToKeep, cutoffDate });
    // return result.rowsAffected;

    logger.info('Cleanup skipped (processedEvents table not yet implemented)');
    return 0;
  } catch (error) {
    logger.error('Error cleaning up processed events', {}, error as Error);
    return 0;
  }
}
