# Visium CRM TODO

## Database Schema
- [x] Design accounts table with industry, size, region, vertical, security posture
- [x] Design contacts table with roles and account relationships
- [x] Design leads table with source, campaign, score, segment, lifecycle status
- [x] Design opportunities table with MEDDIC fields and sales stages
- [x] Design activities table for calls, emails, meetings, demos
- [x] Design projects table for onboarding and post-sale tracking
- [x] Design cases table for lightweight support tracking
- [x] Design line items table for opportunity products
- [x] Design products table for catalog
- [x] Add account hierarchy support (parent-child relationships)

## Backend API (tRPC Procedures)
- [x] Account CRUD procedures with hierarchy support
- [x] Contact CRUD procedures with account lookup
- [x] Lead CRUD procedures with scoring and routing
- [ ] Lead conversion procedure (lead to account/contact/opportunity)
- [x] Opportunity CRUD procedures with MEDDIC fields
- [x] Line items management for opportunities
- [x] Activity logging procedures
- [x] Project/onboarding tracking procedures
- [x] Case/support ticket procedures
- [x] Dashboard data procedures (pipeline, ARR/MRR, win rates)
- [ ] Sales management reporting procedures
- [ ] Lead assignment automation

## Frontend UI - Layout & Navigation
- [x] Implement Visium branding (colors, logo, typography)
- [x] Create main navigation structure
- [x] Build dashboard layout with sidebar
- [ ] Implement global search functionality
- [ ] Add user profile and logout

## Frontend UI - Core Modules
- [x] Accounts list view with filtering
- [ ] Account detail page with hierarchy visualization
- [x] Account creation and editing forms
- [ ] Contacts list view with account filtering
- [ ] Contact detail page
- [ ] Contact creation and editing forms
- [ ] Leads list view with status pipeline
- [ ] Lead detail page with scoring display
- [ ] Lead creation and editing forms
- [ ] Lead conversion workflow UI

## Frontend UI - Opportunity Pipeline
- [ ] Opportunities list view with stage filtering
- [ ] Opportunity kanban board view
- [ ] Opportunity detail page with MEDDIC fields
- [ ] Opportunity creation and editing forms
- [ ] Line items management UI
- [ ] Deal stage progression workflow
- [ ] Competitive tracking display

## Frontend UI - Activities & Communication
- [ ] Activity timeline component
- [ ] Activity logging form (calls, emails, meetings)
- [ ] Task management UI
- [ ] Activity filtering and search

## Frontend UI - Post-Sale & Support
- [ ] Projects list view
- [ ] Project detail page with milestones
- [ ] Account health indicators display
- [ ] Cases list view
- [ ] Case detail page
- [ ] Case creation form

## Frontend UI - Dashboards & Reports
- [ ] Executive dashboard with ARR/MRR metrics
- [ ] Pipeline by stage visualization
- [ ] Win rate charts
- [ ] Sales velocity metrics
- [ ] Bookings forecast
- [ ] Sales management dashboard
- [ ] Pipeline by rep view
- [ ] Activity metrics by rep
- [ ] Conversion rates by stage
- [ ] Performance vs quota tracking
- [ ] Marketing dashboard (lead sources, MQL to SQL)
- [ ] Customer success dashboard (renewals, expansions)

## Automation & Business Rules
- [ ] Lead assignment rules (territory, industry, partner)
- [ ] SLA-based alerts for follow-ups
- [ ] Automatic task creation on stage changes
- [ ] Data validation rules for MEDDIC fields
- [ ] Renewal opportunity auto-creation

## Testing
- [ ] Unit tests for account procedures
- [ ] Unit tests for lead procedures
- [ ] Unit tests for opportunity procedures
- [ ] Unit tests for lead conversion logic
- [ ] Unit tests for automation rules

## Role-Based Access Control
- [ ] Implement role checking in procedures
- [ ] Sales rep data scope (own records)
- [ ] Sales manager data scope (team records)
- [ ] Marketing role permissions
- [ ] Customer success role permissions
- [ ] Executive full access
- [ ] Partner user limited access

## New Requirements - Phase 2

### Complete Remaining UI Pages
- [x] Build Leads list page with filtering and search
- [ ] Build Lead detail page with conversion functionality
- [x] Build Contacts list page with account filtering
- [ ] Build Contact detail page with activity history
- [x] Build Opportunities list page with stage filtering
- [x] Build Opportunity detail page with MEDDIC form
- [x] Build Projects list page with status tracking
- [ ] Build Project detail page with milestones
- [x] Build Support Cases list page with priority filtering
- [ ] Build Case detail page with resolution tracking

### MEDDIC Methodology Implementation
- [x] Add MEDDIC fields to opportunity detail form
- [x] Create Metrics tracking section
- [x] Add Economic Buyer selection
- [x] Implement Decision Criteria capture
- [x] Add Decision Process documentation
- [x] Create Identify Pain section
- [x] Add Champion identification and tracking
- [x] Build MEDDIC qualification checklist

### Advanced Features
- [x] Implement Kanban board for opportunity pipeline
- [x] Add drag-and-drop stage transitions
- [ ] Build activity timeline component
- [x] Create lead scoring automation rules
- [x] Build sales analytics dashboard with charts
- [x] Add pipeline forecast visualization
- [x] Implement win rate calculations
- [x] Add sales velocity metrics
- [x] Create ARR/MRR tracking
- [ ] Build quota attainment tracking

### Testing
- [ ] Write tests for lead management
- [ ] Write tests for opportunity MEDDIC tracking
- [ ] Write tests for lead scoring automation
- [ ] Write tests for pipeline analytics
- [ ] Verify all CRUD operations work correctly


## Email Integration - New Feature

### Backend Infrastructure
- [x] Add email provider configuration table (Gmail, Outlook)
- [ ] Implement OAuth flow for Gmail API
- [ ] Implement OAuth flow for Microsoft Graph API
- [x] Create email sync service for fetching messages
- [x] Create calendar sync service for events
- [ ] Add webhook handlers for real-time email notifications
- [x] Store email credentials securely in database

### Activity Logging
- [x] Extend activities table to support email type
- [x] Add email metadata fields (messageId, threadId, provider)
- [x] Create procedure to match emails to CRM records (by email address)
- [x] Implement automatic activity creation from emails
- [x] Add calendar event to activity conversion
- [x] Build email thread tracking

### Frontend UI
- [x] Create email provider connection page
- [ ] Build OAuth consent flow UI
- [x] Add activity timeline component with email display
- [x] Show email preview in activity cards
- [ ] Add manual email compose and send feature
- [x] Display calendar events in activity timeline
- [ ] Add filters for activity types (email, call, meeting)

### Testing
- [x] Write tests for email sync procedures
- [ ] Test OAuth flows
- [x] Test activity matching logic
- [x] Test calendar event sync


## OAuth Implementation - New Tasks

### Gmail OAuth Flow
- [x] Create Gmail OAuth initiation endpoint
- [x] Implement Gmail OAuth callback handler
- [x] Add token storage and refresh logic for Gmail
- [x] Handle OAuth errors and edge cases

### Outlook OAuth Flow
- [x] Create Outlook OAuth initiation endpoint
- [x] Implement Outlook OAuth callback handler
- [x] Add token storage and refresh logic for Outlook
- [x] Handle OAuth errors and edge cases

### Frontend Integration
- [x] Update Email Settings page with working OAuth buttons
- [x] Add OAuth redirect handling
- [x] Show connection status and errors
- [ ] Test complete OAuth flow end-to-end


## Real-Time Email Sync - Webhook Implementation

### Gmail Pub/Sub Webhooks
- [ ] Set up Gmail Pub/Sub topic and subscription
- [x] Implement webhook endpoint for Gmail push notifications
- [x] Add signature verification for Gmail webhooks
- [ ] Handle watch renewal (7-day expiration)
- [x] Process incoming email notifications in real-time
- [x] Add error handling and retry logic

### Microsoft Graph Webhooks
- [x] Implement webhook endpoint for Microsoft Graph notifications
- [x] Add signature validation for Graph webhooks
- [ ] Handle subscription renewal (3-day expiration)
- [x] Process incoming email notifications in real-time
- [x] Add error handling and retry logic

### OAuth Setup Guide
- [x] Create comprehensive guide for Google Cloud Console setup
- [x] Document Gmail API enablement steps
- [x] Add screenshots for OAuth 2.0 Client ID creation
- [x] Document redirect URI configuration
- [x] Create guide for Azure Portal app registration
- [x] Document Microsoft Graph API permissions
- [x] Add screenshots for client secret creation
- [x] Include environment variable configuration instructions
- [x] Add troubleshooting section


## Scheduled Webhook Renewal - New Tasks

### Gmail Watch Renewal
- [x] Implement Gmail watch renewal function using googleapis
- [x] Add logic to check watch expiration dates
- [x] Create scheduled job to renew watches 1 day before expiration
- [x] Handle renewal failures and retry logic
- [x] Log renewal activity for monitoring

### Outlook Subscription Renewal
- [x] Implement Outlook webhook subscription renewal using Microsoft Graph
- [x] Add logic to check subscription expiration dates
- [x] Create scheduled job to renew subscriptions 1 day before expiration
- [x] Handle renewal failures and retry logic
- [x] Log renewal activity for monitoring

### Job Scheduler
- [x] Install and configure node-cron for scheduled tasks
- [x] Create job runner that executes daily
- [x] Add monitoring and alerting for failed renewals
- [x] Implement graceful shutdown handling
- [x] Add manual renewal endpoint for testing


## Bug Fixes - Current

- [x] Fix lead creation form - leadSource field using invalid enum values (needs to match database schema)
- [x] Create lead detail page with edit functionality (clicking on lead shows blank screen)
- [x] Fix OpportunityDetail page - React error #321 when trying to save changes
- [x] Make Sales Dashboard metrics clickable to navigate to underlying detail pages
- [x] Populate Active Accounts metric with real data from database
- [x] Calculate Win Rate metric from closed opportunities
- [x] Calculate Average Deal Size metric from current quarter data
- [x] Add URL filtering support when navigating from dashboard metrics
- [x] Add edit and delete functionality to opportunity detail page
- [x] Create Reports page with bar charts and graphs for opportunities, close dates, and dashboard data
- [x] Add Create Project button and form to Projects page


## New Features - Phase 3

### Detail Pages
- [x] Create Account detail page with edit form
- [x] Create Contact detail page with edit form
- [x] Create Opportunity detail page with edit form (already exists)
- [x] Add proper routing for all detail pages

### Lead Conversion Workflow
- [x] Add "Convert to Opportunity" button on lead detail page
- [x] Implement backend conversion procedure
- [x] Create account from lead company
- [x] Create contact from lead information
- [x] Create opportunity linked to account
- [x] Update lead status to "Converted"
- [ ] Show success message with links to new records

### CSV Import/Export
- [ ] Add CSV export button to Leads list page
- [ ] Add CSV export button to Contacts list page
- [ ] Implement CSV generation for leads
- [ ] Implement CSV generation for contacts
- [ ] Add CSV import button with file upload
- [ ] Implement CSV parsing and validation
- [ ] Handle duplicate detection during import
- [ ] Show import summary (success/errors)
- [x] Add date range filters to Reports page (Last 30 Days, Quarter, Year, Custom)
- [x] Create PDF export functionality for Reports page
- [x] Build forecast projections chart based on pipeline and historical data
- [x] Fix React error #321 when creating accounts
- [x] Fix lead creation error - implemented controlled state for select fields
- [x] Fix account creation - implemented controlled state for select fields
- [x] Debug module loading error preventing form submissions from working - refactored to use onClick handlers
- [x] Fix TypeScript errors in Reports.tsx (4 implicit 'any' type errors)
- [x] Simplify form submission approach to avoid Dialog interference
- [x] Fix Create Opportunity button on Opportunities page - dialog opens successfully
- [ ] Fix opportunity creation submission - TypeScript build errors (121 errors) preventing JavaScript execution
- [ ] Resolve tRPC type generation issue - 'reports' router not recognized despite being defined
- [ ] Fix all create form submissions across CRM (leads, accounts, contacts, opportunities) - blocked by build errors
