# Email Integration OAuth Setup Guide

**Visium CRM - Gmail and Outlook Configuration**

This comprehensive guide walks you through setting up OAuth 2.0 authentication for Gmail and Microsoft Outlook email integration in your Visium CRM system. Once configured, the CRM will automatically sync emails and calendar events, creating activity records linked to your contacts and leads.

---

## Overview

The Visium CRM email integration requires OAuth 2.0 credentials from both Google and Microsoft to access user email accounts securely. This guide covers the complete setup process for both providers, including API enablement, OAuth app creation, redirect URI configuration, and environment variable setup.

**Prerequisites:**
- Access to Google Cloud Console (requires Google account)
- Access to Azure Portal (requires Microsoft account)
- Admin access to your Visium CRM deployment
- Your CRM's public domain name (e.g., `crm.visiumtechnologies.com`)

**Estimated Setup Time:** 30-45 minutes (15-20 minutes per provider)

---

## Part 1: Google Gmail OAuth Setup

### Step 1: Create a Google Cloud Project

Google Cloud Console is the central hub for managing all Google Cloud services, including API access for Gmail integration.

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top navigation bar (next to "Google Cloud")
3. Click **"NEW PROJECT"** in the project selector dialog
4. Enter project details:
   - **Project name:** `Visium CRM Email Integration` (or your preferred name)
   - **Organization:** Select your organization if applicable
   - **Location:** Leave as default or select your organization
5. Click **"CREATE"**
6. Wait for the project to be created (usually takes 10-30 seconds)
7. Ensure the new project is selected in the project dropdown

### Step 2: Enable Gmail API

The Gmail API must be explicitly enabled for your project before you can access user email data.

1. In the Google Cloud Console, open the navigation menu (☰) in the top-left
2. Navigate to **"APIs & Services"** → **"Library"**
3. In the search bar, type `Gmail API`
4. Click on **"Gmail API"** from the search results
5. Click the blue **"ENABLE"** button
6. Wait for the API to be enabled (usually instant)
7. You should see the API Overview page with usage metrics

**Note:** You may also want to enable the **Google Calendar API** if you plan to sync calendar events. Follow the same process and search for "Google Calendar API".

### Step 3: Configure OAuth Consent Screen

The OAuth consent screen is what users see when they authorize your CRM to access their Gmail account. This step is required before creating OAuth credentials.

1. In the Google Cloud Console navigation menu, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select user type:
   - **Internal:** Only for Google Workspace organizations (users within your domain)
   - **External:** For any Google account users (recommended for most cases)
3. Click **"CREATE"**
4. Fill in the OAuth consent screen configuration:

   **App information:**
   - **App name:** `Visium CRM`
   - **User support email:** Your support email address
   - **App logo:** (Optional) Upload your Visium logo (120x120px PNG or JPG)

   **App domain:**
   - **Application home page:** `https://crm.visiumtechnologies.com` (your CRM domain)
   - **Application privacy policy link:** Your privacy policy URL
   - **Application terms of service link:** Your terms of service URL

   **Authorized domains:**
   - Add your CRM domain: `visiumtechnologies.com` (without https://)

   **Developer contact information:**
   - **Email addresses:** Your developer email address(es)

5. Click **"SAVE AND CONTINUE"**

6. **Scopes** page:
   - Click **"ADD OR REMOVE SCOPES"**
   - Search for and select the following scopes:
     - `https://www.googleapis.com/auth/gmail.readonly` - Read email messages
     - `https://www.googleapis.com/auth/gmail.send` - Send emails (optional, for future features)
     - `https://www.googleapis.com/auth/calendar.readonly` - Read calendar events (if syncing calendar)
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

7. **Test users** page (only if you selected "External" and app is in testing):
   - Click **"ADD USERS"**
   - Enter email addresses of users who should be able to test the integration
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

8. Review the summary and click **"BACK TO DASHBOARD"**

**Important:** If your app is in "Testing" status, only test users you explicitly add can authorize the app. To make it available to all users, you'll need to submit for verification (required for production use with external users).

### Step 4: Create OAuth 2.0 Client ID

Now you'll create the actual OAuth credentials that your CRM will use to authenticate with Gmail.

1. In the Google Cloud Console, navigate to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"** from the dropdown
4. Configure the OAuth client:
   - **Application type:** Select **"Web application"**
   - **Name:** `Visium CRM Gmail Integration`
   
   **Authorized JavaScript origins:**
   - Click **"+ ADD URI"**
   - Enter: `https://crm.visiumtechnologies.com` (your CRM's base URL)
   
   **Authorized redirect URIs:**
   - Click **"+ ADD URI"**
   - Enter: `https://crm.visiumtechnologies.com/api/oauth/gmail/callback`
   - **Critical:** This must match exactly what's configured in your CRM code

5. Click **"CREATE"**
6. A dialog will appear with your credentials:
   - **Client ID:** Copy this value (format: `xxxxx.apps.googleusercontent.com`)
   - **Client secret:** Copy this value (format: `GOCSPX-xxxxx`)
7. Click **"OK"** to close the dialog

**Security Note:** Treat the Client Secret like a password. Never commit it to version control or share it publicly.

### Step 5: Set Environment Variables for Gmail

Add the Gmail OAuth credentials to your CRM's environment configuration.

**For Manus-hosted deployments:**

1. Open your Visium CRM project in the Manus interface
2. Navigate to **Settings** → **Secrets** (in the Management UI)
3. Add the following environment variables:
   - **Key:** `GMAIL_CLIENT_ID`
     - **Value:** Paste the Client ID from Step 4
   - **Key:** `GMAIL_CLIENT_SECRET`
     - **Value:** Paste the Client Secret from Step 4
4. Click **"Save"** for each variable
5. Restart your application to load the new environment variables

**For self-hosted deployments:**

Add these lines to your `.env` file:

```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-client-secret
```

Then restart your application server.

### Step 6: Set Up Gmail Push Notifications (Optional but Recommended)

For real-time email sync, configure Gmail Pub/Sub push notifications. This allows Gmail to notify your CRM immediately when new emails arrive, instead of polling periodically.

1. In Google Cloud Console, navigate to **"Pub/Sub"** → **"Topics"**
2. Click **"CREATE TOPIC"**
3. Enter topic details:
   - **Topic ID:** `gmail-notifications`
   - Leave other settings as default
4. Click **"CREATE"**
5. Grant Gmail permission to publish to this topic:
   - In the topic details page, click **"PERMISSIONS"**
   - Click **"ADD PRINCIPAL"**
   - **New principals:** `gmail-api-push@system.gserviceaccount.com`
   - **Role:** Select **"Pub/Sub Publisher"**
   - Click **"SAVE"**
6. Create a push subscription:
   - Click **"CREATE SUBSCRIPTION"**
   - **Subscription ID:** `gmail-push-subscription`
   - **Delivery type:** Select **"Push"**
   - **Endpoint URL:** `https://crm.visiumtechnologies.com/api/webhooks/gmail`
   - Click **"CREATE"**

**Note:** You'll also need to set up Gmail watch requests in your code to start receiving notifications. This is handled automatically by the CRM when users connect their Gmail accounts.

---

## Part 2: Microsoft Outlook OAuth Setup

### Step 1: Register an Application in Azure Portal

Azure Active Directory (Azure AD) is Microsoft's identity platform that manages OAuth for Outlook and other Microsoft services.

1. Navigate to the [Azure Portal](https://portal.azure.com/)
2. In the search bar at the top, type `Azure Active Directory` and select it
3. In the left sidebar, click **"App registrations"**
4. Click **"+ New registration"** at the top
5. Fill in the application registration form:

   **Name:** `Visium CRM Email Integration`
   
   **Supported account types:**
   - Select **"Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**
   - This allows both work/school accounts and personal Microsoft accounts
   
   **Redirect URI:**
   - **Platform:** Select **"Web"**
   - **Redirect URI:** Enter `https://crm.visiumtechnologies.com/api/oauth/outlook/callback`

6. Click **"Register"**
7. You'll be taken to the app overview page. **Copy the following values:**
   - **Application (client) ID:** This is your `OUTLOOK_CLIENT_ID`
   - **Directory (tenant) ID:** (for reference, not needed for multi-tenant apps)

### Step 2: Create a Client Secret

The client secret is the password your CRM uses to authenticate with Microsoft's OAuth service.

1. In your app registration page, click **"Certificates & secrets"** in the left sidebar
2. Under **"Client secrets"**, click **"+ New client secret"**
3. Configure the secret:
   - **Description:** `Visium CRM Production Secret`
   - **Expires:** Select **"24 months"** (or your preferred duration)
   - **Note:** You'll need to rotate this secret before it expires
4. Click **"Add"**
5. **Immediately copy the secret value** (shown in the "Value" column)
   - **Critical:** This value is only shown once. If you lose it, you'll need to create a new secret
   - This is your `OUTLOOK_CLIENT_SECRET`

**Security Note:** Store this secret securely. Never commit it to version control or share it publicly.

### Step 3: Configure API Permissions

Define which Microsoft Graph APIs your CRM can access on behalf of users.

1. In your app registration page, click **"API permissions"** in the left sidebar
2. You'll see **"Microsoft Graph"** with **"User.Read"** permission already added by default
3. Click **"+ Add a permission"**
4. Select **"Microsoft Graph"**
5. Select **"Delegated permissions"** (permissions that require user consent)
6. Search for and select the following permissions:

   **Email permissions:**
   - `Mail.Read` - Read user mail
   - `Mail.ReadWrite` - Read and write access to user mail (if you want to send emails)
   - `Mail.Send` - Send mail as a user (optional, for future features)

   **Calendar permissions:**
   - `Calendars.Read` - Read user calendars (if syncing calendar events)
   - `Calendars.ReadWrite` - Read and write user calendars (optional)

   **User profile:**
   - `User.Read` - Already added by default (read basic user profile)

7. Click **"Add permissions"**
8. Review the permissions list

**Admin Consent (Optional):**
- If your organization requires admin consent for these permissions, click **"Grant admin consent for [Your Organization]"**
- This pre-approves the permissions for all users in your organization
- Otherwise, each user will be prompted to consent when they first connect their account

### Step 4: Set Environment Variables for Outlook

Add the Outlook OAuth credentials to your CRM's environment configuration.

**For Manus-hosted deployments:**

1. Open your Visium CRM project in the Manus interface
2. Navigate to **Settings** → **Secrets** (in the Management UI)
3. Add the following environment variables:
   - **Key:** `OUTLOOK_CLIENT_ID`
     - **Value:** Paste the Application (client) ID from Step 1
   - **Key:** `OUTLOOK_CLIENT_SECRET`
     - **Value:** Paste the Client Secret value from Step 2
4. Click **"Save"** for each variable
5. Restart your application to load the new environment variables

**For self-hosted deployments:**

Add these lines to your `.env` file:

```bash
OUTLOOK_CLIENT_ID=your-application-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret-value
```

Then restart your application server.

### Step 5: Configure Microsoft Graph Webhooks (Optional but Recommended)

For real-time email sync, set up Microsoft Graph webhook subscriptions. This allows Microsoft to notify your CRM immediately when new emails arrive.

**Webhook Configuration:**

Microsoft Graph webhooks are created programmatically through the API. Your CRM will automatically create webhook subscriptions when users connect their Outlook accounts. However, you need to ensure your webhook endpoint is accessible:

1. **Webhook endpoint:** `https://crm.visiumtechnologies.com/api/webhooks/outlook`
2. **Validation:** Microsoft will send a validation request when creating the subscription
3. **Expiration:** Outlook webhook subscriptions expire after 3 days and must be renewed

**Webhook Validation:**

When creating a webhook subscription, Microsoft sends a POST request with a `validationToken` query parameter. Your CRM endpoint must respond with the validation token in plain text (this is already implemented in the code).

**Renewal:**

Webhook subscriptions must be renewed before they expire. The CRM includes a renewal endpoint at `/api/webhooks/renew` that can be called periodically (recommended: daily) to extend subscriptions.

---

## Part 3: Testing the Integration

### Test Gmail Connection

1. Log in to your Visium CRM as a user
2. Navigate to **Email Settings** (in the main navigation or user menu)
3. Click **"Connect Gmail"** button
4. You'll be redirected to Google's OAuth consent screen
5. Select your Google account
6. Review the permissions requested
7. Click **"Allow"** to grant access
8. You'll be redirected back to your CRM with a success message
9. Your Gmail connection should now appear in the **"Connected Accounts"** section
10. Click **"Sync Emails"** to test fetching emails
11. Navigate to a contact or lead record and check if email activities appear in the timeline

### Test Outlook Connection

1. In the **Email Settings** page, click **"Connect Outlook"**
2. You'll be redirected to Microsoft's login page
3. Sign in with your Microsoft account (work, school, or personal)
4. Review the permissions requested
5. Click **"Accept"** to grant access
6. You'll be redirected back to your CRM with a success message
7. Your Outlook connection should now appear in the **"Connected Accounts"** section
8. Click **"Sync Emails"** to test fetching emails
9. Navigate to a contact or lead record and check if email activities appear in the timeline

### Verify Webhook Functionality

**Gmail Webhooks:**

1. Send a test email to your connected Gmail account
2. Check the CRM server logs for webhook notifications:
   ```
   [Gmail Webhook] Received notification for user@example.com, historyId: 12345
   ```
3. Verify that a new activity record is created in the CRM within seconds

**Outlook Webhooks:**

1. Send a test email to your connected Outlook account
2. Check the CRM server logs for webhook notifications:
   ```
   [Outlook Webhook] Processing created for subscription abc-123
   ```
3. Verify that a new activity record is created in the CRM within seconds

---

## Troubleshooting

### Common Gmail Issues

**Error: "Access blocked: This app's request is invalid"**
- **Cause:** OAuth consent screen not configured or redirect URI mismatch
- **Solution:** Verify the redirect URI in Google Cloud Console matches exactly: `https://your-domain.com/api/oauth/gmail/callback`

**Error: "This app isn't verified"**
- **Cause:** App is in testing mode with external user type
- **Solution:** Add test users in OAuth consent screen, or submit app for verification for production use

**Error: "Invalid grant" when refreshing tokens**
- **Cause:** Refresh token expired or revoked
- **Solution:** User needs to reconnect their Gmail account through the CRM

**Emails not syncing automatically**
- **Cause:** Gmail watch not set up or expired
- **Solution:** Gmail watches expire after 7 days. Implement automatic renewal in your CRM code

### Common Outlook Issues

**Error: "AADSTS50011: The reply URL specified in the request does not match"**
- **Cause:** Redirect URI mismatch
- **Solution:** Verify the redirect URI in Azure Portal matches exactly: `https://your-domain.com/api/oauth/outlook/callback`

**Error: "AADSTS65001: The user or administrator has not consented"**
- **Cause:** Required permissions not granted
- **Solution:** Ensure all required Microsoft Graph permissions are added in Azure Portal

**Error: "Invalid client secret"**
- **Cause:** Client secret expired or incorrect
- **Solution:** Create a new client secret in Azure Portal and update environment variables

**Webhook subscriptions expiring**
- **Cause:** Outlook webhook subscriptions expire after 3 days
- **Solution:** Implement automatic renewal (call `/api/webhooks/renew` daily)

### General Debugging Tips

1. **Check server logs:** Most OAuth errors are logged with detailed error messages
2. **Verify environment variables:** Ensure `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `OUTLOOK_CLIENT_ID`, and `OUTLOOK_CLIENT_SECRET` are set correctly
3. **Test redirect URIs:** Use a tool like Postman to verify your callback endpoints are accessible
4. **Check token expiry:** Access tokens typically expire after 1 hour; ensure refresh token logic is working
5. **Review API quotas:** Both Gmail API and Microsoft Graph have rate limits; check your usage in respective consoles

---

## Security Best Practices

### Token Storage

- **Never log tokens:** Access tokens and refresh tokens should never be written to logs
- **Encrypt at rest:** Store tokens encrypted in your database
- **Use HTTPS only:** All OAuth flows must use HTTPS to prevent token interception
- **Implement token rotation:** Regularly refresh access tokens and handle refresh token expiration

### Scope Minimization

- **Request only necessary scopes:** Don't request `Mail.ReadWrite` if you only need `Mail.Read`
- **Explain permissions to users:** Clearly communicate why each permission is needed
- **Allow users to revoke access:** Provide a way for users to disconnect their email accounts

### Webhook Security

- **Validate webhook signatures:** Verify that webhook requests are actually from Google/Microsoft
- **Use HTTPS for webhook endpoints:** Prevent man-in-the-middle attacks
- **Implement rate limiting:** Protect against webhook flooding attacks
- **Log webhook activity:** Monitor for suspicious patterns

### Compliance

- **GDPR compliance:** If operating in EU, ensure proper data handling and user consent
- **Data retention policies:** Define how long email data is stored in your CRM
- **User data deletion:** Implement processes to delete user data upon request
- **Privacy policy:** Clearly document how email data is used and stored

---

## Maintenance and Monitoring

### Regular Tasks

**Weekly:**
- Monitor OAuth error rates in server logs
- Check for failed email sync operations
- Review webhook delivery success rates

**Monthly:**
- Review API usage and quotas in Google Cloud Console and Azure Portal
- Check for expiring client secrets (Outlook secrets expire after 24 months)
- Verify webhook subscriptions are being renewed successfully

**Quarterly:**
- Review and update OAuth scopes if new features are added
- Audit user permissions and revoke unused connections
- Update OAuth consent screens with any policy changes

### Monitoring Metrics

Track these key metrics to ensure email integration health:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| OAuth success rate | >95% | <90% |
| Email sync latency | <30 seconds | >2 minutes |
| Webhook delivery rate | >98% | <95% |
| Token refresh success rate | >99% | <95% |
| API error rate | <1% | >5% |

### Scaling Considerations

As your user base grows, consider:

- **API quota increases:** Request higher quotas from Google/Microsoft if needed
- **Webhook processing:** Use a queue system (e.g., Redis, RabbitMQ) to handle high webhook volumes
- **Database optimization:** Index email activity tables for fast queries
- **Caching:** Cache frequently accessed email metadata to reduce API calls

---

## Appendix A: Environment Variables Reference

Complete list of environment variables for email integration:

```bash
# Gmail OAuth
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-client-secret

# Outlook OAuth
OUTLOOK_CLIENT_ID=your-application-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret-value

# Optional: Gmail Pub/Sub (if using push notifications)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Optional: Webhook configuration
WEBHOOK_SECRET=your-webhook-signing-secret
```

---

## Appendix B: API Endpoints Reference

Email integration endpoints in your Visium CRM:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/oauth/gmail` | GET | Initiate Gmail OAuth flow |
| `/api/oauth/gmail/callback` | GET | Handle Gmail OAuth callback |
| `/api/oauth/outlook` | GET | Initiate Outlook OAuth flow |
| `/api/oauth/outlook/callback` | GET | Handle Outlook OAuth callback |
| `/api/webhooks/gmail` | POST | Receive Gmail push notifications |
| `/api/webhooks/outlook` | POST | Receive Outlook webhook notifications |
| `/api/webhooks/renew` | POST | Renew webhook subscriptions |

---

## Support and Resources

### Official Documentation

- **Google Gmail API:** https://developers.google.com/gmail/api
- **Google OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2
- **Microsoft Graph API:** https://docs.microsoft.com/en-us/graph/
- **Microsoft Identity Platform:** https://docs.microsoft.com/en-us/azure/active-directory/develop/

### Visium CRM Support

For issues specific to Visium CRM email integration:
- **Support Portal:** https://help.manus.im
- **Documentation:** Check your CRM's built-in help documentation
- **Community Forum:** Connect with other Visium CRM users

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Manus AI

---

*This guide is maintained as part of the Visium CRM project. For updates or corrections, please contact your CRM administrator.*
