import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { getDb } from './db';
import { emailConnections, activities, contacts, leads, accounts } from '../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { logger } from './_core/logger';
import { withRetry } from './_core/errorHandler';

/**
 * Gmail API Integration
 */
export class GmailSync {
  private oauth2Client: any;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Fetch recent emails from Gmail
   */
  async fetchEmails(maxResults = 50): Promise<any[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      // Get list of message IDs with retry logic
      const response = await withRetry(
        () => gmail.users.messages.list({
          userId: 'me',
          maxResults,
          q: 'in:sent OR in:inbox', // both sent and received
        }),
        { maxRetries: 3, exponentialBackoff: true }
      );

      const messages = response.data.messages || [];
      const emailData: any[] = [];

      // Fetch full message details
      for (const message of messages) {
        const fullMessage = await withRetry(
          () => gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          }),
          { maxRetries: 3, exponentialBackoff: true }
        );

        const headers = fullMessage.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Extract body
        let body = '';
        let htmlBody = '';
        
        if (fullMessage.data.payload?.parts) {
          for (const part of fullMessage.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            if (part.mimeType === 'text/html' && part.body?.data) {
              htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
        } else if (fullMessage.data.payload?.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
        }

        emailData.push({
          messageId: fullMessage.data.id!,
          threadId: fullMessage.data.threadId!,
          subject,
          from,
          to,
          date: new Date(date),
          body,
          htmlBody,
          labelIds: fullMessage.data.labelIds || [],
        });
      }

      return emailData;
    } catch (error) {
      logger.error('Gmail fetch error', { maxResults }, error as Error);
      throw error;
    }
  }

  /**
   * Fetch calendar events from Google Calendar
   */
  async fetchCalendarEvents(maxResults = 50): Promise<any[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // last 30 days
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      return events.map(event => ({
        id: event.id!,
        summary: event.summary || '(No Title)',
        description: event.description || '',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        attendees: event.attendees?.map(a => a.email) || [],
        location: event.location || '',
      }));
    } catch (error) {
      logger.error('Google Calendar fetch error', { maxResults }, error as Error);
      throw error;
    }
  }
}

/**
 * Microsoft Graph (Outlook) Integration
 */
export class OutlookSync {
  private client: Client;

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Fetch recent emails from Outlook
   */
  async fetchEmails(maxResults = 50): Promise<any[]> {
    try {
      const response = await withRetry(
        () => this.client
          .api('/me/messages')
          .top(maxResults)
          .select('id,subject,from,toRecipients,receivedDateTime,body,bodyPreview,isRead')
          .orderby('receivedDateTime DESC')
          .get(),
        { maxRetries: 3, exponentialBackoff: true }
      );

      return response.value.map((message: any) => ({
        messageId: message.id,
        threadId: message.conversationId,
        subject: message.subject || '(No Subject)',
        from: message.from?.emailAddress?.address || '',
        to: message.toRecipients?.map((r: any) => r.emailAddress.address).join(', ') || '',
        date: new Date(message.receivedDateTime),
        body: message.bodyPreview || '',
        htmlBody: message.body?.content || '',
        isRead: message.isRead,
      }));
    } catch (error) {
      logger.error('Outlook fetch error', { maxResults }, error as Error);
      throw error;
    }
  }

  /**
   * Fetch calendar events from Outlook
   */
  async fetchCalendarEvents(maxResults = 50): Promise<any[]> {
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await withRetry(
        () => this.client
          .api('/me/calendar/events')
          .top(maxResults)
          .filter(`start/dateTime ge '${startDate}'`)
          .select('id,subject,body,start,end,attendees,location')
          .orderby('start/dateTime')
          .get(),
        { maxRetries: 3, exponentialBackoff: true }
      );

      return response.value.map((event: any) => ({
        id: event.id,
        summary: event.subject || '(No Title)',
        description: event.body?.content || '',
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
        location: event.location?.displayName || '',
      }));
    } catch (error) {
      logger.error('Outlook calendar fetch error', { maxResults }, error as Error);
      throw error;
    }
  }
}

/**
 * Match email address to CRM records
 */
export async function matchEmailToCRM(emailAddress: string): Promise<{
  type: 'Contact' | 'Lead' | null;
  id: number | null;
  accountId?: number;
}> {
  const db = await getDb();
  if (!db) return { type: null, id: null };

  // Check contacts first
  const contact = await db
    .select()
    .from(contacts)
    .where(eq(contacts.email, emailAddress))
    .limit(1);

  if (contact.length > 0) {
    return {
      type: 'Contact',
      id: contact[0].id,
      accountId: contact[0].accountId,
    };
  }

  // Check leads
  const lead = await db
    .select()
    .from(leads)
    .where(eq(leads.email, emailAddress))
    .limit(1);

  if (lead.length > 0) {
    return {
      type: 'Lead',
      id: lead[0].id,
    };
  }

  return { type: null, id: null };
}

/**
 * Create activity from email
 */
export async function createActivityFromEmail(
  email: any,
  provider: 'Gmail' | 'Outlook',
  userId: number,
  isInbound: boolean
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // Try to match sender or recipient to CRM
  const emailToMatch = isInbound ? email.from : email.to.split(',')[0].trim();
  const match = await matchEmailToCRM(emailToMatch);

  if (!match.type || !match.id) {
    logger.debug('No CRM match found for email', { email: emailToMatch });
    return null;
  }

  // Check if activity already exists
  const existing = await db
    .select()
    .from(activities)
    .where(eq(activities.emailMessageId, email.messageId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new activity
  const result = await db.insert(activities).values({
    subject: email.subject,
    type: 'Email',
    activityDate: email.date,
    relatedToType: match.type,
    relatedToId: match.id,
    notes: email.body.substring(0, 1000), // truncate for notes field
    ownerId: userId,
    emailMessageId: email.messageId,
    emailThreadId: email.threadId,
    emailProvider: provider,
    emailFrom: email.from,
    emailTo: email.to,
    emailBody: email.body,
    emailHtml: email.htmlBody,
    isInbound: isInbound ? 1 : 0,
  });

  return Number(result[0].insertId);
}

/**
 * Create activity from calendar event
 */
export async function createActivityFromCalendarEvent(
  event: any,
  provider: 'Gmail' | 'Outlook',
  userId: number
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // Try to match attendees to CRM
  let match: { type: 'Contact' | 'Lead' | null; id: number | null; accountId?: number } = { type: null, id: null };
  
  for (const attendeeEmail of event.attendees) {
    match = await matchEmailToCRM(attendeeEmail);
    if (match.type && match.id) break;
  }

  if (!match.type || !match.id) {
    logger.debug('No CRM match found for calendar event', { summary: event.summary });
    return null;
  }

  // Check if activity already exists (by event ID in notes)
  const existing = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.type, 'Meeting'),
        eq(activities.subject, event.summary)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Calculate duration
  const start = new Date(event.start);
  const end = new Date(event.end);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes

  // Create new activity
  const result = await db.insert(activities).values({
    subject: event.summary,
    type: 'Meeting',
    activityDate: start,
    duration,
    relatedToType: match.type,
    relatedToId: match.id,
    notes: `${event.description}\n\nLocation: ${event.location}\nAttendees: ${event.attendees.join(', ')}`,
    ownerId: userId,
  });

  return Number(result[0].insertId);
}
