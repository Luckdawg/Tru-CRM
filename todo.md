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
