import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "sales_rep", "sales_manager", "marketing", "customer_success", "executive", "partner"]).default("sales_rep").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Accounts - Organizations/Companies
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  industry: mysqlEnum("industry", [
    "Utilities", 
    "Manufacturing", 
    "Public Sector", 
    "Healthcare", 
    "Financial Services", 
    "Telecommunications",
    "Energy",
    "Transportation",
    "Other"
  ]),
  size: int("size"), // number of employees
  region: mysqlEnum("region", [
    "North America",
    "South America", 
    "Europe",
    "Asia Pacific",
    "Middle East",
    "Africa"
  ]),
  vertical: mysqlEnum("vertical", [
    "Enterprise",
    "Mid-Market",
    "SMB",
    "Government",
    "Defense"
  ]),
  securityPosture: mysqlEnum("securityPosture", [
    "Immature",
    "Developing",
    "Mature",
    "Advanced"
  ]),
  installedTechnologies: text("installedTechnologies"), // JSON array
  parentAccountId: int("parentAccountId"), // for account hierarchies
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  billingAddress: text("billingAddress"),
  shippingAddress: text("shippingAddress"),
  description: text("description"),
  ownerId: int("ownerId").notNull(), // assigned sales rep
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("owner_idx").on(table.ownerId),
  parentIdx: index("parent_idx").on(table.parentAccountId),
}));

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Contacts - People at accounts
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", [
    "CISO",
    "CIO",
    "CTO",
    "Security Architect",
    "OT Engineer",
    "IT Manager",
    "Procurement",
    "Executive",
    "Partner Rep",
    "Other"
  ]),
  accountId: int("accountId").notNull(),
  title: varchar("title", { length: 200 }),
  department: varchar("department", { length: 100 }),
  isPrimary: boolean("isPrimary").default(false),
  linkedInUrl: varchar("linkedInUrl", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
}));

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Leads - Potential customers
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }).notNull(),
  title: varchar("title", { length: 200 }),
  leadSource: mysqlEnum("leadSource", [
    "Website",
    "Trade Show",
    "Partner Referral",
    "Cold Outreach",
    "Webinar",
    "Content Download",
    "Social Media",
    "Other"
  ]).notNull(),
  campaignId: int("campaignId"),
  score: int("score").default(0),
  segment: mysqlEnum("segment", [
    "Enterprise",
    "Mid-Market",
    "SMB"
  ]),
  status: mysqlEnum("status", [
    "New",
    "Working",
    "Qualified",
    "Disqualified",
    "Converted"
  ]).default("New").notNull(),
  industry: varchar("industry", { length: 100 }),
  region: varchar("region", { length: 100 }),
  estimatedBudget: decimal("estimatedBudget", { precision: 15, scale: 2 }),
  timeline: varchar("timeline", { length: 100 }),
  painPoints: text("painPoints"),
  assignedTo: int("assignedTo"), // user id
  disqualificationReason: text("disqualificationReason"),
  convertedAccountId: int("convertedAccountId"),
  convertedContactId: int("convertedContactId"),
  convertedOpportunityId: int("convertedOpportunityId"),
  convertedAt: timestamp("convertedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assignedIdx: index("assigned_idx").on(table.assignedTo),
  statusIdx: index("status_idx").on(table.status),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Products - Service/product catalog
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productName: varchar("productName", { length: 255 }).notNull(),
  productCode: varchar("productCode", { length: 100 }).unique(),
  description: text("description"),
  category: mysqlEnum("category", [
    "Platform License",
    "Professional Services",
    "Training",
    "Support",
    "Custom Development"
  ]),
  listPrice: decimal("listPrice", { precision: 15, scale: 2 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Opportunities - Sales deals
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  opportunityName: varchar("opportunityName", { length: 255 }).notNull(),
  accountId: int("accountId"),
  stage: mysqlEnum("stage", [
    "Discovery",
    "Solution Fit",
    "PoC/Trial",
    "Security Review",
    "Procurement",
    "Verbal Commit",
    "Closed Won",
    "Closed Lost"
  ]).default("Discovery").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  closeDate: timestamp("closeDate").notNull(),
  probability: int("probability").default(10), // percentage
  type: mysqlEnum("type", [
    "New Business",
    "Expansion",
    "Renewal"
  ]).default("New Business"),
  
  // MEDDIC fields
  metrics: text("metrics"), // business metrics customer wants to improve
  economicBuyerId: int("economicBuyerId"), // contact id
  decisionProcess: text("decisionProcess"),
  decisionCriteria: text("decisionCriteria"),
  identifiedPain: text("identifiedPain"),
  championId: int("championId"), // contact id
  competition: text("competition"), // JSON array of competitors
  
  nextSteps: text("nextSteps"),
  lossReason: text("lossReason"),
  ownerId: int("ownerId").notNull(), // assigned sales rep
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
  ownerIdx: index("owner_idx").on(table.ownerId),
  stageIdx: index("stage_idx").on(table.stage),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * Line Items - Products/services on opportunities
 */
export const lineItems = mysqlTable("lineItems", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"), // percentage
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  opportunityIdx: index("opportunity_idx").on(table.opportunityId),
}));

export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = typeof lineItems.$inferInsert;

/**
 * Activities - Interactions with customers
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Call",
    "Email",
    "Meeting",
    "Demo",
    "PoC Milestone",
    "Task",
    "Note"
  ]).notNull(),
  activityDate: timestamp("activityDate").notNull(),
  duration: int("duration"), // minutes
  relatedToType: mysqlEnum("relatedToType", [
    "Account",
    "Contact",
    "Lead",
    "Opportunity"
  ]).notNull(),
  relatedToId: int("relatedToId").notNull(),
  notes: text("notes"),
  outcome: text("outcome"),
  ownerId: int("ownerId").notNull(), // user who logged the activity
  // Email integration fields
  emailMessageId: varchar("emailMessageId", { length: 255 }), // provider's message ID
  emailThreadId: varchar("emailThreadId", { length: 255 }), // provider's thread ID
  emailProvider: mysqlEnum("emailProvider", ["Gmail", "Outlook"]),
  emailFrom: varchar("emailFrom", { length: 320 }), // sender email
  emailTo: text("emailTo"), // JSON array of recipients
  emailBody: text("emailBody"), // email content
  emailHtml: text("emailHtml"), // HTML version
  emailAttachments: text("emailAttachments"), // JSON array of attachment metadata
  isInbound: int("isInbound").default(0), // 0=outbound, 1=inbound
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  relatedIdx: index("related_idx").on(table.relatedToType, table.relatedToId),
  ownerIdx: index("owner_idx").on(table.ownerId),
  emailMessageIdx: index("email_message_idx").on(table.emailMessageId),
}));

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Projects - Post-sale onboarding/implementation
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  accountId: int("accountId").notNull(),
  opportunityId: int("opportunityId"),
  status: mysqlEnum("status", [
    "Planning",
    "In Progress",
    "On Hold",
    "Completed",
    "Cancelled"
  ]).default("Planning").notNull(),
  goLiveDate: timestamp("goLiveDate"),
  actualGoLiveDate: timestamp("actualGoLiveDate"),
  healthStatus: mysqlEnum("healthStatus", [
    "Healthy",
    "At Risk",
    "Critical"
  ]).default("Healthy"),
  adoptionLevel: mysqlEnum("adoptionLevel", [
    "Low",
    "Medium",
    "High"
  ]),
  activeUsers: int("activeUsers"),
  customerSentiment: mysqlEnum("customerSentiment", [
    "Positive",
    "Neutral",
    "Negative"
  ]),
  notes: text("notes"),
  ownerId: int("ownerId").notNull(), // CSM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Milestones - Project milestones and deliverables
 */
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  status: mysqlEnum("status", [
    "Not Started",
    "In Progress",
    "Completed",
    "Blocked"
  ]).default("Not Started").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
}));

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

/**
 * Win/Loss Analysis - Capture reasons for closed opportunities
 */
export const winLossAnalysis = mysqlTable("winLossAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull().unique(),
  outcome: mysqlEnum("outcome", ["Won", "Lost"]).notNull(),
  primaryReason: varchar("primaryReason", { length: 100 }).notNull(),
  competitorName: varchar("competitorName", { length: 255 }),
  dealSize: decimal("dealSize", { precision: 15, scale: 2 }),
  customerFeedback: text("customerFeedback"),
  lessonsLearned: text("lessonsLearned"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  opportunityIdx: index("opportunity_idx").on(table.opportunityId),
}));

export type WinLossAnalysis = typeof winLossAnalysis.$inferSelect;
export type InsertWinLossAnalysis = typeof winLossAnalysis.$inferInsert;

/**
 * Cases - Support tickets
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 50 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  accountId: int("accountId").notNull(),
  contactId: int("contactId"),
  status: mysqlEnum("status", [
    "Open",
    "In Progress",
    "Waiting on Customer",
    "Resolved",
    "Closed"
  ]).default("Open").notNull(),
  priority: mysqlEnum("priority", [
    "Low",
    "Medium",
    "High",
    "Critical"
  ]).default("Medium").notNull(),
  type: mysqlEnum("type", [
    "Technical Issue",
    "Feature Request",
    "Question",
    "Bug Report"
  ]),
  description: text("description"),
  resolution: text("resolution"),
  ownerId: int("ownerId").notNull(), // support rep
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
  ownerIdx: index("owner_idx").on(table.ownerId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * Email Provider Connections - OAuth tokens for email sync
 */
export const emailConnections = mysqlTable("emailConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["Gmail", "Outlook"]).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiry: timestamp("tokenExpiry"),
  scope: text("scope"), // granted permissions
  webhookSubscriptionId: varchar("webhookSubscriptionId", { length: 255 }), // for Outlook Graph webhooks
  webhookExpiry: timestamp("webhookExpiry"), // when webhook subscription expires
  isActive: int("isActive").default(1).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  emailIdx: index("email_idx").on(table.email),
}));

export type EmailConnection = typeof emailConnections.$inferSelect;
export type InsertEmailConnection = typeof emailConnections.$inferInsert;

/**
 * Forecast Snapshots - Historical forecast data for accuracy tracking
 */
export const forecastSnapshots = mysqlTable("forecastSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: timestamp("snapshotDate").notNull(),
  periodType: mysqlEnum("periodType", ["Month", "Quarter", "Year"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  forecastAmount: decimal("forecastAmount", { precision: 15, scale: 2 }).notNull(),
  weightedAmount: decimal("weightedAmount", { precision: 15, scale: 2 }).notNull(),
  opportunityCount: int("opportunityCount").notNull(),
  ownerId: int("ownerId"), // null = company-wide
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  periodIdx: index("period_idx").on(table.periodStart, table.periodEnd),
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export type ForecastSnapshot = typeof forecastSnapshots.$inferSelect;
export type InsertForecastSnapshot = typeof forecastSnapshots.$inferInsert;

/**
 * Forecast Snapshot Opportunities - Individual opportunities in a snapshot
 */
export const forecastSnapshotOpportunities = mysqlTable("forecastSnapshotOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  snapshotId: int("snapshotId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  opportunityName: varchar("opportunityName", { length: 255 }).notNull(),
  stage: varchar("stage", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  probability: int("probability").notNull(),
  weightedAmount: decimal("weightedAmount", { precision: 15, scale: 2 }).notNull(),
  closeDate: timestamp("closeDate").notNull(),
  accountName: varchar("accountName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  snapshotIdx: index("snapshot_idx").on(table.snapshotId),
  opportunityIdx: index("opportunity_idx").on(table.opportunityId),
}));

export type ForecastSnapshotOpportunity = typeof forecastSnapshotOpportunities.$inferSelect;
export type InsertForecastSnapshotOpportunity = typeof forecastSnapshotOpportunities.$inferInsert;

/**
 * Saved Reports - Custom report templates
 */
export const savedReports = mysqlTable("savedReports", {
  id: int("id").autoincrement().primaryKey(),
  reportName: varchar("reportName", { length: 255 }).notNull(),
  reportType: mysqlEnum("reportType", ["PreBuilt", "Custom"]).notNull(),
  category: varchar("category", { length: 100 }), // "Sales", "Forecast", "Engagement", etc.
  description: text("description"),
  queryConfig: json("queryConfig"), // JSON configuration for custom reports
  columns: json("columns"), // Selected columns to display
  filters: json("filters"), // Filter conditions
  sorting: json("sorting"), // Sort configuration
  grouping: json("grouping"), // Group by configuration
  isPublic: boolean("isPublic").default(false), // team-wide vs private
  isFavorite: boolean("isFavorite").default(false),
  scheduleFrequency: mysqlEnum("scheduleFrequency", ["None", "Daily", "Weekly", "Monthly"]),
  scheduleDay: int("scheduleDay"), // day of week (1-7) or day of month (1-31)
  scheduleTime: varchar("scheduleTime", { length: 10 }), // "09:00"
  lastRunAt: timestamp("lastRunAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdx: index("created_by_idx").on(table.createdBy),
  typeIdx: index("type_idx").on(table.reportType),
}));

export type SavedReport = typeof savedReports.$inferSelect;
export type InsertSavedReport = typeof savedReports.$inferInsert;

/**
 * Report Execution History - Track when reports were run
 */
export const reportExecutions = mysqlTable("reportExecutions", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  executedBy: int("executedBy").notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  rowCount: int("rowCount"),
  executionTimeMs: int("executionTimeMs"),
  parameters: json("parameters"), // Runtime parameters
  status: mysqlEnum("status", ["Success", "Failed", "Timeout"]).notNull(),
  errorMessage: text("errorMessage"),
}, (table) => ({
  reportIdx: index("report_idx").on(table.reportId),
  executedByIdx: index("executed_by_idx").on(table.executedBy),
}));

export type ReportExecution = typeof reportExecutions.$inferSelect;
export type InsertReportExecution = typeof reportExecutions.$inferInsert;

/**
 * User Preferences - Dashboard widgets and digest settings
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Dashboard widget preferences
  dashboardWidgets: json("dashboardWidgets"), // Array of enabled widget IDs and positions
  
  // Email digest preferences
  digestEnabled: boolean("digestEnabled").default(true).notNull(),
  digestFrequency: mysqlEnum("digestFrequency", ["None", "Daily", "Weekly"]).default("Weekly").notNull(),
  digestDay: int("digestDay"), // 0-6 for weekly (0=Sunday), null for daily
  digestTime: varchar("digestTime", { length: 5 }).default("09:00"), // HH:MM format
  
  // Digest content preferences
  includeAtRiskDeals: boolean("includeAtRiskDeals").default(true).notNull(),
  includeLowEngagement: boolean("includeLowEngagement").default(true).notNull(),
  includeForecastSummary: boolean("includeForecastSummary").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Email Digest Log - Track sent digests
 */
export const emailDigests = mysqlTable("emailDigests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  digestType: mysqlEnum("digestType", ["AtRiskDeals", "LowEngagement", "Combined"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  itemCount: int("itemCount").notNull(), // Number of items in digest
  status: mysqlEnum("status", ["Sent", "Failed", "Skipped"]).notNull(),
  errorMessage: text("errorMessage"),
});

/**
 * Saved Filter Presets - Reusable report filters
 */
export const filterPresets = mysqlTable("filterPresets", {
  id: int("id").autoincrement().primaryKey(),
  presetName: varchar("presetName", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // e.g., "Opportunities", "Accounts"
  filters: json("filters").notNull(), // Array of filter objects
  isSystem: boolean("isSystem").default(false).notNull(), // System presets can't be deleted
  isPublic: boolean("isPublic").default(false).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
