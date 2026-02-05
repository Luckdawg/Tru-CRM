# Analytics & Reporting Guide

This document explains the analytics capabilities, forecasting methodology, lead scoring algorithm, and reporting features in Tru-CRM.

---

## Table of Contents

1. [Dashboard Analytics](#dashboard-analytics)
2. [Forecasting](#forecasting)
3. [Lead Scoring](#lead-scoring)
4. [Win/Loss Analysis](#winloss-analysis)
5. [Custom Reports](#custom-reports)
6. [Email Digests](#email-digests)

---

## Dashboard Analytics

### Overview

The dashboard provides real-time visibility into sales performance, pipeline health, and key metrics.

### Key Metrics

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| **Pipeline Value** | Sum of all open opportunity amounts | Total potential revenue |
| **Weighted Pipeline** | Sum of (amount × probability / 100) | Realistic revenue forecast |
| **Win Rate** | (Closed Won / Total Closed) × 100 | Sales effectiveness |
| **Average Deal Size** | Total won amount / Number of won deals | Deal sizing trends |
| **Sales Cycle Length** | Average days from creation to close | Process efficiency |
| **Conversion Rate** | (Opportunities / Leads) × 100 | Lead quality |

### Pipeline by Stage

Shows opportunity count and total value at each stage:

```typescript
interface PipelineStage {
  stage: string;
  count: number;
  totalAmount: number;
  weightedAmount: number; // amount * probability / 100
}
```

**Stages:**
1. Discovery
2. Solution Fit
3. PoC/Trial
4. Security Review
5. Commercial Discussion
6. Negotiation
7. Closed Won
8. Closed Lost

### Forecast View

Shows expected revenue by close date:

```typescript
interface ForecastPeriod {
  period: string; // "2024-Q1", "2024-Jan", etc.
  commitAmount: number; // High probability (90%+)
  bestCaseAmount: number; // Medium probability (50%+)
  pipelineAmount: number; // All opportunities
  opportunityCount: number;
}
```

### Activity Metrics

Tracks team engagement and productivity:

- **Activities per day**: Calls, emails, meetings logged
- **Response time**: Average time to respond to inbound emails
- **Email open rate**: Percentage of sent emails opened by recipients
- **Meeting conversion rate**: Meetings scheduled / emails sent

---

## Forecasting

### Methodology

Tru-CRM uses a **weighted pipeline** approach to forecasting, where each opportunity contributes to the forecast based on its probability of closing.

### Forecast Categories

| Category | Probability Range | Description |
|----------|-------------------|-------------|
| **Commit** | 90-100% | High confidence, likely to close this period |
| **Best Case** | 50-89% | Moderate confidence, may close this period |
| **Pipeline** | 0-49% | Low confidence, early stage opportunities |

### Calculation Formula

```typescript
// Weighted amount for a single opportunity
weightedAmount = amount * (probability / 100)

// Forecast for a period
commitForecast = sum(opportunities where probability >= 90)
bestCaseForecast = sum(opportunities where probability >= 50)
pipelineForecast = sum(all opportunities)
```

### Forecast Snapshots

Tru-CRM captures weekly forecast snapshots to track accuracy over time.

```typescript
interface ForecastSnapshot {
  id: number;
  snapshotDate: Date;
  periodType: 'Month' | 'Quarter' | 'Year';
  periodLabel: string; // "2024-Q1"
  forecastAmount: number;
  opportunityCount: number;
  createdBy: number;
}
```

**Snapshot Schedule:**
- Weekly on Friday at 5pm
- Captures current pipeline state for next month and quarter
- Used to calculate forecast accuracy

### Forecast Accuracy

Compares forecast snapshots to actual closed deals:

```typescript
interface ForecastAccuracy {
  period: string;
  forecastAmount: number;
  actualAmount: number;
  accuracy: number; // (actual / forecast) * 100
  variance: number; // actual - forecast
}
```

**Accuracy Metrics:**
- **Over-forecasting**: Forecast > Actual (optimistic)
- **Under-forecasting**: Forecast < Actual (conservative)
- **Target accuracy**: 90-110% (within 10% of actual)

### Slippage Tracking

Identifies opportunities that moved to later periods:

```typescript
interface SlippedOpportunity {
  opportunityId: number;
  opportunityName: string;
  originalCloseDate: Date;
  newCloseDate: Date;
  amount: number;
  reason: string; // "Budget delay", "Decision postponed", etc.
}
```

---

## Lead Scoring

### Overview

Tru-CRM automatically scores leads based on **engagement** and **fit** to prioritize sales efforts.

### Scoring Algorithm

**Total Score = Engagement Score (0-50) + Fit Score (0-50)**

### Engagement Score (0-50 points)

Measures how actively the lead is engaging with your company:

| Factor | Points | Calculation |
|--------|--------|-------------|
| **Activity Count** | 0-20 | 2 points per activity (max 20) |
| **Recent Activity** | 0-15 | 15 points if activity in last 7 days, 10 if last 30 days, 5 if last 90 days |
| **Email Opens** | 0-10 | 2 points per email opened (max 10) |
| **Website Visits** | 0-5 | 1 point per visit (max 5) |

### Fit Score (0-50 points)

Measures how well the lead matches your ideal customer profile:

| Factor | Points | Criteria |
|--------|--------|----------|
| **Industry Match** | 0-15 | 15 if target industry, 10 if adjacent, 0 otherwise |
| **Company Size** | 0-15 | 15 if 500-5000 employees, 10 if 100-500 or 5000+, 5 if < 100 |
| **Region** | 0-10 | 10 if target region, 5 if adjacent, 0 otherwise |
| **Budget Indicator** | 0-10 | 10 if budget confirmed, 5 if budget likely, 0 otherwise |

### Lead Qualification Thresholds

| Score Range | Status | Action |
|-------------|--------|--------|
| **75-100** | SQL (Sales Qualified Lead) | Assign to sales rep immediately |
| **50-74** | MQL (Marketing Qualified Lead) | Nurture with targeted content |
| **25-49** | Engaged | Continue marketing automation |
| **0-24** | Cold | Re-engagement campaign |

### Score Decay

Scores decrease over time without activity to reflect declining interest:

- **30 days**: -10% score
- **60 days**: -25% score
- **90 days**: -50% score
- **180 days**: -75% score

### Implementation

```typescript
function calculateLeadScore(lead: Lead, activities: Activity[]): number {
  // Engagement score
  const activityCount = Math.min(activities.length, 10) * 2;
  const daysSinceLastActivity = getDaysSince(lead.lastActivityDate);
  const recencyScore = daysSinceLastActivity <= 7 ? 15 : 
                       daysSinceLastActivity <= 30 ? 10 :
                       daysSinceLastActivity <= 90 ? 5 : 0;
  const emailOpens = Math.min(lead.emailOpens || 0, 5) * 2;
  const websiteVisits = Math.min(lead.websiteVisits || 0, 5);
  
  const engagementScore = activityCount + recencyScore + emailOpens + websiteVisits;

  // Fit score
  const industryScore = isTargetIndustry(lead.industry) ? 15 : 
                        isAdjacentIndustry(lead.industry) ? 10 : 0;
  const sizeScore = lead.companySize >= 500 && lead.companySize <= 5000 ? 15 :
                    lead.companySize >= 100 || lead.companySize > 5000 ? 10 : 5;
  const regionScore = isTargetRegion(lead.region) ? 10 : 
                      isAdjacentRegion(lead.region) ? 5 : 0;
  const budgetScore = lead.budgetConfirmed ? 10 : lead.budgetLikely ? 5 : 0;
  
  const fitScore = industryScore + sizeScore + regionScore + budgetScore;

  // Apply decay
  const decayFactor = getDecayFactor(daysSinceLastActivity);
  
  return Math.round((engagementScore + fitScore) * decayFactor);
}
```

---

## Win/Loss Analysis

### Purpose

Captures reasons for closed opportunities to improve sales effectiveness and product positioning.

### Data Captured

```typescript
interface WinLossAnalysis {
  opportunityId: number;
  outcome: 'Won' | 'Lost';
  primaryReason: string;
  secondaryReasons: string[];
  competitorName?: string;
  competitorProduct?: string;
  lessonsLearned: string;
  analyzedBy: number;
  analyzedAt: Date;
}
```

### Win Reasons

Common reasons for winning deals:

1. **Product Fit** - Best match for customer requirements
2. **Price** - Most competitive pricing
3. **Relationship** - Strong existing relationship
4. **Features** - Unique capabilities not available elsewhere
5. **Support** - Superior customer support and services
6. **Timeline** - Fastest implementation timeline
7. **Integration** - Best integration with existing systems

### Loss Reasons

Common reasons for losing deals:

1. **Price** - Competitor offered lower price
2. **Features** - Missing required capabilities
3. **Timing** - Budget or project delayed
4. **Competition** - Lost to specific competitor
5. **Champion Loss** - Key stakeholder left or changed role
6. **No Decision** - Customer decided not to proceed
7. **Technical Fit** - Solution didn't meet technical requirements

### Competitive Intelligence

Track which competitors are winning deals:

```typescript
interface CompetitorAnalysis {
  competitorName: string;
  dealsLost: number;
  totalValue: number;
  commonReasons: string[];
  avgDealSize: number;
}
```

### Reporting

**Win/Loss by Quarter:**
- Win rate trend over time
- Most common win/loss reasons
- Competitor win rate

**Competitive Matrix:**
- Head-to-head win rate vs each competitor
- Average deal size when competing
- Common objections and responses

---

## Custom Reports

### Report Builder

Tru-CRM provides a flexible report builder for creating custom reports.

### Report Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Pipeline Report** | Opportunities by stage, owner, or date | Sales pipeline review |
| **Activity Report** | Activities by type, user, or account | Team productivity tracking |
| **Forecast Report** | Revenue forecast by period | Executive reporting |
| **Win/Loss Report** | Closed opportunities with reasons | Sales effectiveness analysis |
| **Account Health Report** | Engagement and health scores | Customer success monitoring |
| **Lead Report** | Leads by source, score, or status | Marketing attribution |

### Report Configuration

```typescript
interface SavedReport {
  id: number;
  reportName: string;
  reportType: string;
  queryConfig: {
    entity: 'opportunities' | 'activities' | 'accounts' | 'leads';
    fields: string[];
    filters: ReportFilter[];
    groupBy?: string[];
    orderBy?: string;
  };
  scheduleFrequency: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  recipients: string[];
  format: 'CSV' | 'PDF' | 'Excel';
}
```

### Filters

Available filter operators:

- **Equals**: `field = value`
- **Not Equals**: `field != value`
- **Greater Than**: `field > value`
- **Less Than**: `field < value`
- **Contains**: `field LIKE %value%`
- **In**: `field IN (value1, value2, ...)`
- **Between**: `field BETWEEN value1 AND value2`
- **Is Null**: `field IS NULL`
- **Is Not Null**: `field IS NOT NULL`

### Scheduled Reports

Reports can be scheduled to run automatically:

- **Daily**: Runs at 8am, sent via email
- **Weekly**: Runs on Monday at 8am
- **Monthly**: Runs on 1st of month at 8am

### Export Formats

**CSV:**
- Plain text, comma-separated values
- Compatible with Excel, Google Sheets
- Best for data analysis

**PDF:**
- Formatted document with charts
- Best for executive presentations
- Includes company logo and branding

**Excel:**
- Native Excel format (.xlsx)
- Includes formatting and formulas
- Best for financial analysis

---

## Email Digests

### Overview

Automated email digests provide daily or weekly summaries of key metrics and at-risk items.

### Digest Types

#### 1. Sales Digest

**Frequency**: Daily at 9am or Weekly on Monday

**Content:**
- At-risk opportunities (low health score, stale activity)
- Opportunities closing this week
- New leads assigned to you
- Overdue activities

#### 2. Customer Success Digest

**Frequency**: Daily at 9am or Weekly on Monday

**Content:**
- Projects with critical health status
- Low-engagement accounts
- Upcoming renewals (next 30 days)
- Open support cases

#### 3. Executive Digest

**Frequency**: Weekly on Monday at 8am

**Content:**
- Pipeline summary (total value, weighted value)
- Win rate and closed deals
- Forecast vs actual
- Top performers

### Digest Configuration

Users can configure digest preferences:

```typescript
interface DigestPreferences {
  digestEnabled: boolean;
  digestFrequency: 'Daily' | 'Weekly' | 'None';
  includeAtRiskDeals: boolean;
  includeLowEngagement: boolean;
  includeUpcomingRenewals: boolean;
  includeOverdueActivities: boolean;
  maxItemsPerSection: number; // Default: 5
}
```

### Digest Generation

Digests are generated by the `digestService.ts` module:

1. Query database for relevant items based on user preferences
2. Format content as Markdown
3. Send via notification API
4. Log digest execution (sent, failed, skipped)

### Sample Digest

```markdown
# Sales Digest for John Doe - January 15, 2024

## At-Risk Opportunities (3)

- **Acme Corp - Enterprise Deal** (Security Review)
  - Stage: Security Review | Amount: $250,000
  - Health Score: 45/100 | Days since activity: 14
  - Close Date: February 1, 2024

- **TechStart Inc - Expansion** (Negotiation)
  - Stage: Negotiation | Amount: $150,000
  - Health Score: 55/100 | Days since activity: 7
  - Close Date: January 31, 2024

## Low-Engagement Accounts (2)

- **GlobalCorp**
  - Engagement Score: 30/100 (Low)
  - Activities: 2 | Days since last: 45
  - Industry: Manufacturing | Region: North America

---
This is an automated digest. To manage preferences, visit your CRM settings.
```

---

## Best Practices

### 1. Regular Forecast Reviews

- **Weekly**: Review pipeline with sales team
- **Monthly**: Compare forecast to actual closed deals
- **Quarterly**: Analyze forecast accuracy and adjust methodology

### 2. Lead Scoring Calibration

- **Monthly**: Review lead scores vs actual conversions
- **Quarterly**: Adjust scoring weights based on conversion data
- **Annually**: Update ideal customer profile based on best customers

### 3. Win/Loss Analysis

- **Immediately**: Capture win/loss analysis when opportunity closes
- **Monthly**: Review trends and share insights with team
- **Quarterly**: Present competitive intelligence to product team

### 4. Custom Reports

- **Save frequently used reports** for quick access
- **Schedule reports** for recurring needs (weekly pipeline review)
- **Export to CSV** for deeper analysis in Excel or BI tools

### 5. Email Digests

- **Enable digests** to stay informed without checking dashboard daily
- **Customize content** to focus on your priorities
- **Adjust frequency** based on your workflow (daily for active reps, weekly for managers)

---

## Next Steps

- **[Architecture Guide](./Architecture.md)** - Understand system design and data flows
- **[Testing Guide](./Testing.md)** - Learn how to test analytics logic
- **[API Reference](./API.md)** - Detailed tRPC procedure documentation
