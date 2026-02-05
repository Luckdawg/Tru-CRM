# Tru-CRM Architecture

This document describes the high-level architecture, key backend modules, data flows, and design decisions for Tru-CRM.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Data Model & Entity Glossary](#data-model--entity-glossary)
3. [Backend Modules](#backend-modules)
4. [Data Flows](#data-flows)
5. [Day in the Life: User Workflows](#day-in-the-life-user-workflows)
6. [Technology Decisions](#technology-decisions)

---

## High-Level Architecture

Tru-CRM follows a modern monorepo architecture with clear separation between client, server, and shared code. The system is designed for type safety, maintainability, and real-time data synchronization.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   React    │  │  Tailwind  │  │   tRPC     │  │  Tanstack │ │
│  │ Components │  │    CSS     │  │   Client   │  │   Query   │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WebSocket
                           │ (Type-safe tRPC calls)
┌──────────────────────────▼──────────────────────────────────────┐
│                      Server (Node.js/Express)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │    tRPC    │  │   OAuth    │  │  Webhooks  │  │ Scheduler │ │
│  │   Router   │  │  Handlers  │  │  (Gmail/   │  │  (Cron)   │ │
│  │            │  │            │  │  Outlook)  │  │           │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Email Sync │  │   Digest   │  │  Webhook   │  │  Reports  │ │
│  │  Service   │  │  Service   │  │  Renewal   │  │  Builder  │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Drizzle ORM
                           │ (Type-safe queries)
┌──────────────────────────▼──────────────────────────────────────┐
│                       MySQL Database                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Accounts  │  │   Leads    │  │Opportunities│  │ Activities│ │
│  │  Contacts  │  │  Projects  │  │    Cases    │  │  Reports  │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │ Gmail API / Graph API
┌──────────────────────────┴──────────────────────────────────────┐
│                    External Services                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   Gmail    │  │  Outlook   │  │   Google   │                │
│  │    API     │  │ Graph API  │  │   Pub/Sub  │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Client Layer**
- Renders UI components using React 19 and shadcn/ui
- Manages client-side state with Tanstack Query
- Makes type-safe API calls via tRPC client
- Handles routing, forms, and user interactions

**Server Layer**
- Exposes tRPC procedures for CRUD operations
- Handles OAuth flows for Gmail and Outlook
- Processes webhook notifications from email providers
- Runs scheduled jobs (digest emails, webhook renewal)
- Generates reports and analytics

**Database Layer**
- Stores all CRM data in normalized MySQL tables
- Enforces data integrity with foreign keys and indexes
- Provides type-safe query interface via Drizzle ORM

**External Services**
- Gmail API for email sync and calendar integration
- Microsoft Graph API for Outlook integration
- Google Pub/Sub for real-time webhook notifications

---

## Data Model & Entity Glossary

Tru-CRM's data model is designed around the customer lifecycle, from lead capture through renewal tracking. Below is a glossary of core entities and their relationships.

### Core Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **users** | System users (sales reps, managers, CSMs) | `id`, `openId`, `name`, `email`, `role` |
| **accounts** | Organizations/companies (customers and prospects) | `id`, `accountName`, `industry`, `region`, `vertical`, `securityPosture`, `ownerId` |
| **contacts** | People at accounts | `id`, `firstName`, `lastName`, `email`, `role`, `accountId` |
| **leads** | Potential customers not yet qualified | `id`, `firstName`, `lastName`, `company`, `leadSource`, `score`, `status` |
| **opportunities** | Sales deals in progress | `id`, `opportunityName`, `accountId`, `stage`, `amount`, `closeDate`, `ownerId` |
| **lineItems** | Products/services on opportunities | `id`, `opportunityId`, `productId`, `quantity`, `unitPrice`, `totalPrice` |
| **products** | Service/product catalog | `id`, `productName`, `productCode`, `category`, `listPrice` |
| **activities** | Customer interactions (calls, emails, meetings) | `id`, `type`, `subject`, `relatedToType`, `relatedToId`, `emailMessageId` |
| **projects** | Post-sale implementations and onboarding | `id`, `projectName`, `accountId`, `status`, `healthStatus`, `ownerId` |
| **milestones** | Project deliverables and checkpoints | `id`, `projectId`, `title`, `dueDate`, `status` |
| **cases** | Support tickets | `id`, `caseNumber`, `accountId`, `status`, `priority`, `ownerId` |
| **emailConnections** | OAuth tokens for email sync | `id`, `userId`, `provider`, `accessToken`, `refreshToken`, `webhookSubscriptionId` |
| **forecastSnapshots** | Historical forecast data for accuracy tracking | `id`, `snapshotDate`, `periodType`, `forecastAmount`, `opportunityCount` |
| **winLossAnalysis** | Reasons for closed opportunities | `id`, `opportunityId`, `outcome`, `primaryReason`, `competitorName` |
| **savedReports** | Custom report templates | `id`, `reportName`, `reportType`, `queryConfig`, `filters`, `scheduleFrequency` |
| **userPreferences** | Dashboard widgets and digest settings | `id`, `userId`, `digestEnabled`, `digestFrequency`, `dashboardWidgets` |

### Entity Relationships (ERD Outline)

```
users (1) ──owns──> (N) accounts
users (1) ──owns──> (N) opportunities
users (1) ──owns──> (N) leads
users (1) ──owns──> (N) projects
users (1) ──owns──> (N) cases
users (1) ──logs──> (N) activities
users (1) ──has──> (1) userPreferences
users (1) ──has──> (N) emailConnections

accounts (1) ──has──> (N) contacts
accounts (1) ──has──> (N) opportunities
accounts (1) ──has──> (N) projects
accounts (1) ──has──> (N) cases
accounts (1) ──parent──> (1) accounts [hierarchy]

opportunities (1) ──has──> (N) lineItems
opportunities (1) ──references──> (1) contacts [economicBuyer]
opportunities (1) ──references──> (1) contacts [champion]
opportunities (1) ──has──> (1) winLossAnalysis

projects (1) ──has──> (N) milestones
projects (1) ──references──> (1) opportunities

lineItems (N) ──references──> (1) products

activities (N) ──relatesTo──> (1) accounts|contacts|leads|opportunities

forecastSnapshots (1) ──contains──> (N) forecastSnapshotOpportunities

savedReports (N) ──createdBy──> (1) users
reportExecutions (N) ──executedBy──> (1) users
```

### Data Integrity Rules

- **Cascade Deletes**: Deleting a user cascades to their preferences and email connections
- **Soft Deletes**: Accounts, opportunities, and projects are marked inactive rather than deleted
- **Audit Trails**: All entities have `createdAt` and `updatedAt` timestamps
- **Indexes**: Foreign keys, status fields, and date fields are indexed for query performance

---

## Backend Modules

The server is organized into focused modules, each handling a specific domain or cross-cutting concern.

### Core Modules

#### `server/_core/`
Framework-level code that provides foundational services:

- **`index.ts`** - Express server setup, middleware, and routing
- **`trpc.ts`** - tRPC router configuration, context builder, and procedure definitions
- **`context.ts`** - Request context builder (extracts user from session, provides database connection)
- **`oauth.ts`** - OAuth 2.0 flow handlers for Gmail and Outlook
- **`env.ts`** - Environment variable validation using Zod
- **`sdk.ts`** - Manus SDK integration for LLM, storage, and notifications

#### `server/db.ts`
Database query functions organized by entity. Each function returns raw Drizzle results without business logic:

- `createAccount()`, `getAccountById()`, `updateAccount()`, `deleteAccount()`
- `createOpportunity()`, `getOpportunityById()`, `updateOpportunity()`
- `createContact()`, `getContactsByAccount()`
- `createActivity()`, `getActivitiesByRelated()`
- `createProject()`, `getProjectsByAccount()`
- `getUserPreferences()`, `updateUserPreferences()`

#### `server/routers.ts`
tRPC procedures that expose API endpoints. Procedures use `publicProcedure` or `protectedProcedure` middleware and call `db.ts` functions:

- **auth**: `me`, `logout`
- **accounts**: `create`, `getById`, `list`, `update`, `delete`
- **contacts**: `create`, `getById`, `listByAccount`, `update`, `delete`
- **leads**: `create`, `getById`, `list`, `update`, `convert`
- **opportunities**: `create`, `getById`, `list`, `update`, `delete`
- **activities**: `create`, `listByRelated`
- **projects**: `create`, `getById`, `list`, `update`
- **cases**: `create`, `getById`, `list`, `update`
- **reports**: `execute`, `save`, `list`, `delete`
- **analytics**: `dashboard`, `pipeline`, `forecast`

### Email Integration Modules

#### `server/emailSync.ts`
Handles bidirectional email synchronization with Gmail and Outlook:

- **`GmailSync` class**: Fetches emails and calendar events using Gmail API
- **`OutlookSync` class**: Fetches emails using Microsoft Graph API
- **`createActivityFromEmail()`**: Parses email metadata and creates activity records
- **Smart matching**: Links emails to accounts/contacts/opportunities based on email addresses and domains

#### `server/webhooks.ts`
Webhook endpoints for real-time email notifications:

- **`POST /webhooks/gmail`**: Receives Google Pub/Sub notifications when new emails arrive
- **`POST /webhooks/outlook`**: Receives Microsoft Graph webhook notifications
- **Idempotency**: Uses `emailMessageId` to prevent duplicate activity creation
- **Error handling**: Returns 200 to prevent webhook retries, logs errors for manual review

#### `server/webhookRenewal.ts`
Maintains continuous email sync by renewing webhook subscriptions:

- **Gmail watch renewal**: Gmail watch expires after 7 days, must be renewed
- **Outlook subscription renewal**: Microsoft Graph subscriptions expire after 3 days
- **Scheduled job**: Runs daily to check and renew expiring subscriptions
- **Retry logic**: Handles OAuth token refresh and API failures

### Analytics & Reporting Modules

#### `server/digestService.ts`
Generates and sends email digests to users:

- **`generateAndSendDigest()`**: Creates digest content based on user preferences
- **At-risk deals**: Opportunities with low health scores or stale activity
- **Low-engagement accounts**: Accounts with few recent activities
- **Forecast summary**: Pipeline coverage and win rate trends
- **Configurable frequency**: Daily, weekly, or disabled per user

#### `server/csvExport.ts`
Exports report data to CSV format:

- **`exportToCsv()`**: Converts query results to CSV with headers
- **Schema versioning**: Includes version header for external tool compatibility
- **Column mapping**: Transforms database fields to human-readable names
- **Data formatting**: Handles dates, decimals, and null values

#### `server/scheduler.ts`
Cron job scheduler for recurring tasks:

- **Digest emails**: Sends digests based on user preferences (daily at 9am, weekly on Monday)
- **Webhook renewal**: Checks and renews expiring subscriptions (daily at midnight)
- **Forecast snapshots**: Captures pipeline state for historical tracking (weekly on Friday)
- **Health alerts**: Evaluates project health and sends notifications (daily at 8am)

### Domain Logic Modules

#### `server/forecast.test.ts` (and related logic)
Forecasting calculations and accuracy tracking:

- **Weighted pipeline**: `amount * probability / 100`
- **Forecast categories**: Commit, Best Case, Pipeline based on stage and probability
- **Accuracy metrics**: Compares forecast snapshots to actual closed deals
- **Slippage tracking**: Identifies opportunities that moved to later periods

#### `server/leadScoring.test.ts` (and related logic)
Lead scoring algorithm based on engagement and fit:

- **Engagement score**: Activity count, recency, and email opens (0-50 points)
- **Fit score**: Industry match, company size, region, and budget (0-50 points)
- **Total score**: 0-100, with thresholds for MQL (50+) and SQL (75+)
- **Decay factor**: Scores decrease over time without activity

#### `server/winLossAnalysis.test.ts` (and related logic)
Win/loss analysis and competitive intelligence:

- **Primary reasons**: Price, features, timing, competition, champion loss
- **Competitor tracking**: Captures which competitor won the deal
- **Lessons learned**: Freeform text for sales team insights
- **Reporting**: Aggregates win/loss reasons by quarter and competitor

---

## Data Flows

### Gmail OAuth + Webhook + Sync Flow

This is the most complex data flow in Tru-CRM, enabling automatic capture of customer emails.

```
1. User initiates OAuth flow
   ├─> Client: User clicks "Connect Gmail"
   ├─> Server: Redirects to Google OAuth consent screen
   └─> Google: User grants permissions

2. OAuth callback
   ├─> Google: Redirects back with authorization code
   ├─> Server: Exchanges code for access/refresh tokens
   ├─> Server: Stores tokens in emailConnections table
   └─> Server: Sets up Gmail watch (Pub/Sub subscription)

3. New email arrives in Gmail
   ├─> Gmail: Sends push notification to Pub/Sub topic
   ├─> Pub/Sub: Delivers notification to webhook endpoint
   └─> Server: Receives POST /webhooks/gmail

4. Webhook processing
   ├─> Server: Decodes Pub/Sub message
   ├─> Server: Extracts emailAddress and historyId
   ├─> Server: Looks up emailConnection by email
   ├─> Server: Fetches new emails using Gmail API
   └─> Server: Calls createActivityFromEmail()

5. Activity creation
   ├─> Server: Parses email headers (from, to, subject, date)
   ├─> Server: Extracts email body (text and HTML)
   ├─> Server: Matches email addresses to contacts/leads
   ├─> Server: Determines relatedToType and relatedToId
   ├─> Server: Inserts activity record with emailMessageId
   └─> Database: Stores activity

6. Client refresh
   ├─> Client: Polls for new activities (or uses WebSocket)
   ├─> Server: Returns activities via tRPC
   └─> Client: Updates activity timeline
```

**Key Design Decisions:**
- **Idempotency**: `emailMessageId` is unique, prevents duplicate activities if webhook is retried
- **Async processing**: Webhook returns 200 immediately, processes email in background
- **Error handling**: Failed syncs are logged but don't block webhook acknowledgment
- **Token refresh**: OAuth tokens are refreshed automatically when expired

### Analytics/Reporting Pipeline

```
1. User requests dashboard data
   ├─> Client: Calls trpc.analytics.dashboard.useQuery()
   └─> Server: Receives request

2. Server aggregates data
   ├─> Server: Queries opportunities by stage (pipeline)
   ├─> Server: Calculates weighted amounts (amount * probability)
   ├─> Server: Counts opportunities by close date (forecast)
   ├─> Server: Calculates win rate (closed won / total closed)
   ├─> Server: Sums ARR/MRR from closed won opportunities
   └─> Server: Returns aggregated data

3. Client renders charts
   ├─> Client: Receives typed response
   ├─> Client: Transforms data for Recharts
   └─> Client: Renders bar charts, line charts, and KPI cards

4. User saves custom report
   ├─> Client: Calls trpc.reports.save.useMutation()
   ├─> Server: Stores queryConfig, filters, and columns in savedReports
   └─> Database: Inserts savedReport record

5. Scheduled report execution
   ├─> Scheduler: Runs daily at configured time
   ├─> Scheduler: Queries savedReports with scheduleFrequency != 'None'
   ├─> Server: Executes report query
   ├─> Server: Exports to CSV
   ├─> Server: Sends via email (notifyOwner)
   └─> Database: Logs reportExecution record
```

### Digest Generation Flow

```
1. Scheduler triggers digest job
   ├─> Scheduler: Runs daily at 9am (or weekly on Monday)
   ├─> Scheduler: Queries userPreferences with digestEnabled = true
   └─> Scheduler: Calls generateAndSendDigest() for each user

2. Digest content generation
   ├─> Server: Queries at-risk opportunities (low health score, stale activity)
   ├─> Server: Queries low-engagement accounts (few recent activities)
   ├─> Server: Queries forecast summary (pipeline coverage, win rate)
   └─> Server: Formats content as Markdown

3. Digest delivery
   ├─> Server: Calls notifyOwner() with digest content
   ├─> Manus SDK: Sends notification to user
   └─> Database: Logs emailDigest record (status: Sent/Failed/Skipped)

4. User receives digest
   ├─> User: Receives email notification
   ├─> User: Clicks link to view details in CRM
   └─> Client: Opens opportunity or account detail page
```

---

## Day in the Life: User Workflows

### Workflow 1: Sales Rep Managing Opportunities

**Morning Routine (8:00 AM)**
1. **Check Dashboard**: Rep logs in and views dashboard with pipeline summary, at-risk deals, and upcoming close dates
2. **Review Digest Email**: Rep receives daily digest highlighting 3 at-risk opportunities and 2 low-engagement accounts
3. **Triage Activities**: Rep clicks through to opportunity details and reviews recent email activity automatically captured from Gmail

**Mid-Morning (10:00 AM)**
4. **Update Opportunity**: Rep had a call with economic buyer, updates MEDDIC fields (decision criteria, identified pain) and advances stage to "Security Review"
5. **Log Activity**: Rep manually logs call notes and outcome, links to opportunity
6. **Schedule Follow-up**: Rep sets reminder for next touchpoint in 3 days

**Afternoon (2:00 PM)**
7. **Respond to Email**: Rep sends email to champion, which is automatically captured as activity
8. **Check Analytics**: Rep views pipeline report to see stage conversion rates and identifies bottleneck at "PoC/Trial" stage
9. **Update Forecast**: Rep adjusts probability on 2 opportunities based on recent conversations

**End of Day (5:00 PM)**
10. **Review Next Steps**: Rep checks all opportunities with close dates in next 30 days, ensures next steps are documented
11. **Update Account Health**: Rep notices low engagement on key account, schedules check-in call for tomorrow

### Workflow 2: Customer Success Manager Monitoring Projects

**Weekly Planning (Monday 9:00 AM)**
1. **Review Projects Dashboard**: CSM views all active projects, sorted by health status (Critical, At Risk, Healthy)
2. **Check Health Alerts**: CSM receives notification that Project Alpha has low adoption (10 active users vs 50 expected)
3. **Drill into Project Details**: CSM opens Project Alpha detail page, reviews milestones and recent activities

**Mid-Week Check-in (Wednesday 2:00 PM)**
4. **Update Milestone Status**: CSM marks "Security Configuration" milestone as completed after customer confirmation
5. **Log Activity**: CSM logs meeting notes from weekly sync call with customer
6. **Adjust Health Status**: CSM changes health status from "At Risk" to "Healthy" after adoption improved

**End of Week (Friday 4:00 PM)**
7. **Review Engagement Metrics**: CSM views engagement report showing activity counts and sentiment trends across all accounts
8. **Identify Renewal Risks**: CSM flags 2 accounts with negative sentiment and low engagement for proactive outreach
9. **Generate Report**: CSM exports CSV of all projects with health status for executive review

---

## Technology Decisions

### Why tRPC?

**Type Safety**: tRPC provides end-to-end type safety from database to client without code generation. Changes to procedures automatically update client types.

**Developer Experience**: No need to maintain separate API documentation or client SDKs. Autocomplete and type checking work out of the box.

**Performance**: tRPC uses HTTP POST with JSON payloads, avoiding GraphQL overhead. Superjson handles Date, Map, Set serialization automatically.

### Why Drizzle ORM?

**Type Safety**: Drizzle generates TypeScript types from schema, ensuring queries are type-safe at compile time.

**Performance**: Drizzle generates optimized SQL queries without runtime overhead. No lazy loading or N+1 query issues.

**Migrations**: Drizzle Kit generates SQL migrations from schema changes, making database evolution explicit and reviewable.

### Why MySQL?

**Relational Data**: CRM data is highly relational (accounts → contacts → opportunities). MySQL enforces foreign key constraints and supports complex joins.

**Transactions**: ACID transactions ensure data consistency when creating opportunities with line items or converting leads to accounts.

**Scalability**: MySQL scales vertically and horizontally (read replicas, sharding) for growing datasets.

### Why Gmail API + Pub/Sub?

**Real-time Sync**: Pub/Sub webhooks provide instant notifications when new emails arrive, avoiding polling.

**Reliability**: Google handles webhook delivery retries and guarantees at-least-once delivery.

**OAuth 2.0**: Gmail API uses standard OAuth, allowing users to grant permissions without sharing passwords.

---

## Next Steps

- **[Testing Guide](./Testing.md)** - Learn how to run tests and add coverage
- **[API Reference](./API.md)** - Detailed tRPC procedure documentation
- **[Deployment Guide](./Deployment.md)** - Production deployment checklist
