import { google } from 'googleapis';
import { Request, Response } from 'express';
import { getDb } from './db';
import { emailConnections } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Gmail OAuth Configuration
 */
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
];

function getGmailOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/oauth/gmail/callback`
  );
}

/**
 * Gmail OAuth: Initiate flow
 */
export function initiateGmailOAuth(req: Request, res: Response) {
  const oauth2Client = getGmailOAuth2Client();
  
  // Store user ID in state parameter for callback
  const state = Buffer.from(JSON.stringify({ userId: (req as any).user?.id })).toString('base64');
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state,
    prompt: 'consent', // Force consent to get refresh token
  });

  res.redirect(authUrl);
}

/**
 * Gmail OAuth: Handle callback
 */
export async function handleGmailCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/email-settings?error=${encodeURIComponent(error as string)}`);
  }

  if (!code || !state) {
    return res.redirect('/email-settings?error=missing_parameters');
  }

  try {
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;

    if (!userId) {
      return res.redirect('/email-settings?error=invalid_state');
    }

    // Exchange code for tokens
    const oauth2Client = getGmailOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token) {
      return res.redirect('/email-settings?error=no_access_token');
    }

    // Get user email from Gmail API
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress;

    if (!userEmail) {
      return res.redirect('/email-settings?error=no_email');
    }

    // Store connection in database
    const db = await getDb();
    if (!db) {
      return res.redirect('/email-settings?error=database_unavailable');
    }

    // Check if connection already exists
    const existing = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.email, userEmail))
      .limit(1);

    if (existing.length > 0) {
      // Update existing connection
      await db
        .update(emailConnections)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: GMAIL_SCOPES.join(' '),
          isActive: 1,
          updatedAt: new Date(),
        })
        .where(eq(emailConnections.id, existing[0].id));
    } else {
      // Create new connection
      await db.insert(emailConnections).values({
        userId,
        provider: 'Gmail',
        email: userEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: GMAIL_SCOPES.join(' '),
        isActive: 1,
      });
    }

    res.redirect('/email-settings?success=gmail_connected');
  } catch (error) {
    console.error('Gmail OAuth error:', error);
    res.redirect(`/email-settings?error=${encodeURIComponent((error as Error).message)}`);
  }
}

/**
 * Outlook OAuth Configuration
 */
const OUTLOOK_SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Calendars.Read',
  'offline_access',
];

/**
 * Outlook OAuth: Initiate flow
 */
export function initiateOutlookOAuth(req: Request, res: Response) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/oauth/outlook/callback`;
  
  if (!clientId) {
    return res.redirect('/email-settings?error=outlook_not_configured');
  }

  // Store user ID in state parameter
  const state = Buffer.from(JSON.stringify({ userId: (req as any).user?.id })).toString('base64');

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_mode=query` +
    `&scope=${encodeURIComponent(OUTLOOK_SCOPES.join(' '))}` +
    `&state=${state}` +
    `&prompt=consent`;

  res.redirect(authUrl);
}

/**
 * Outlook OAuth: Handle callback
 */
export async function handleOutlookCallback(req: Request, res: Response) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`/email-settings?error=${encodeURIComponent(error_description as string || error as string)}`);
  }

  if (!code || !state) {
    return res.redirect('/email-settings?error=missing_parameters');
  }

  try {
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;

    if (!userId) {
      return res.redirect('/email-settings?error=invalid_state');
    }

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/oauth/outlook/callback`;

    if (!clientId || !clientSecret) {
      return res.redirect('/email-settings?error=outlook_not_configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return res.redirect(`/email-settings?error=${encodeURIComponent(errorData.error_description || 'token_exchange_failed')}`);
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return res.redirect('/email-settings?error=no_access_token');
    }

    // Get user email from Microsoft Graph
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return res.redirect('/email-settings?error=failed_to_get_profile');
    }

    const profile = await profileResponse.json();
    const userEmail = profile.mail || profile.userPrincipalName;

    if (!userEmail) {
      return res.redirect('/email-settings?error=no_email');
    }

    // Calculate token expiry
    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

    // Store connection in database
    const db = await getDb();
    if (!db) {
      return res.redirect('/email-settings?error=database_unavailable');
    }

    // Check if connection already exists
    const existing = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.email, userEmail))
      .limit(1);

    if (existing.length > 0) {
      // Update existing connection
      await db
        .update(emailConnections)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiry: expiryDate,
          scope: OUTLOOK_SCOPES.join(' '),
          isActive: 1,
          updatedAt: new Date(),
        })
        .where(eq(emailConnections.id, existing[0].id));
    } else {
      // Create new connection
      await db.insert(emailConnections).values({
        userId,
        provider: 'Outlook',
        email: userEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: expiryDate,
        scope: OUTLOOK_SCOPES.join(' '),
        isActive: 1,
      });
    }

    res.redirect('/email-settings?success=outlook_connected');
  } catch (error) {
    console.error('Outlook OAuth error:', error);
    res.redirect(`/email-settings?error=${encodeURIComponent((error as Error).message)}`);
  }
}

/**
 * Refresh Gmail access token
 */
export async function refreshGmailToken(connectionId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const connection = await db
    .select()
    .from(emailConnections)
    .where(eq(emailConnections.id, connectionId))
    .limit(1);

  if (connection.length === 0 || !connection[0].refreshToken) {
    return null;
  }

  try {
    const oauth2Client = getGmailOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: connection[0].refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token) {
      // Update stored token
      await db
        .update(emailConnections)
        .set({
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          updatedAt: new Date(),
        })
        .where(eq(emailConnections.id, connectionId));

      return credentials.access_token;
    }
  } catch (error) {
    console.error('Failed to refresh Gmail token:', error);
  }

  return null;
}

/**
 * Refresh Outlook access token
 */
export async function refreshOutlookToken(connectionId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const connection = await db
    .select()
    .from(emailConnections)
    .where(eq(emailConnections.id, connectionId))
    .limit(1);

  if (connection.length === 0 || !connection[0].refreshToken) {
    return null;
  }

  try {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection[0].refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      return null;
    }

    const tokens = await tokenResponse.json();

    if (tokens.access_token) {
      const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

      // Update stored token
      await db
        .update(emailConnections)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || connection[0].refreshToken,
          tokenExpiry: expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(emailConnections.id, connectionId));

      return tokens.access_token;
    }
  } catch (error) {
    console.error('Failed to refresh Outlook token:', error);
  }

  return null;
}
