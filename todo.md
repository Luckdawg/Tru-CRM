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
