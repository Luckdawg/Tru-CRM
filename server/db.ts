import { eq, and, or, desc, asc, sql, like, not, gte, lte, inArray, notInArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  accounts, 
  contacts, 
  leads, 
  opportunities, 
  activities,
  forecastSnapshots,
  forecastSnapshotOpportunities,
  savedReports,
  reportExecutions,
  userPreferences,
  emailDigests,
  filterPresets,
  projects,
  milestones,
  winLossAnalysis,
  cases,
  products,
  lineItems,
  emailConnections,
  InsertAccount,
  InsertContact,
  InsertLead,
  InsertOpportunity,
  InsertActivity,
  InsertProject,
  InsertMilestone,
  InsertWinLossAnalysis,
  InsertCase,
  InsertProduct,
  InsertLineItem,
  InsertEmailConnection
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(asc(users.name));
}

// ============ ACCOUNT FUNCTIONS ============

export async function createAccount(account: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(accounts).values(account);
  const insertId = Number(result[0].insertId);
  return await getAccountById(insertId);
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllAccounts(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(accounts).where(eq(accounts.ownerId, ownerId)).orderBy(desc(accounts.createdAt));
  }
  return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
}

export async function updateAccount(id: number, data: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(accounts).where(eq(accounts.id, id));
}

export async function searchAccounts(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(accounts)
    .where(
      or(
        like(accounts.accountName, `%${searchTerm}%`),
        like(accounts.website, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(accounts.createdAt));
}

export async function getChildAccounts(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(accounts)
    .where(eq(accounts.parentAccountId, parentId))
    .orderBy(asc(accounts.accountName));
}

// ============ CONTACT FUNCTIONS ============

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(contacts).values(contact);
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result[0] || null;
}

export async function getContactsByAccount(accountId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(contacts)
    .where(eq(contacts.accountId, accountId))
    .orderBy(desc(contacts.isPrimary), asc(contacts.lastName));
}

export async function getAllContacts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(contacts).where(eq(contacts.id, id));
}

export async function searchContacts(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(contacts)
    .where(
      or(
        like(contacts.firstName, `%${searchTerm}%`),
        like(contacts.lastName, `%${searchTerm}%`),
        like(contacts.email, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(contacts.createdAt));
}

// ============ LEAD FUNCTIONS ============

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(leads).values(lead);
  const insertId = Number(result[0].insertId);
  return await getLeadById(insertId);
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllLeads(assignedTo?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (assignedTo) {
    return await db.select().from(leads)
      .where(eq(leads.assignedTo, assignedTo))
      .orderBy(desc(leads.createdAt));
  }
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(leads)
    .where(eq(leads.status, status as any))
    .orderBy(desc(leads.score), desc(leads.createdAt));
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(leads).where(eq(leads.id, id));
}

export async function searchLeads(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(leads)
    .where(
      or(
        like(leads.firstName, `%${searchTerm}%`),
        like(leads.lastName, `%${searchTerm}%`),
        like(leads.email, `%${searchTerm}%`),
        like(leads.company, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(leads.createdAt));
}

// ============ PRODUCT FUNCTIONS ============

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(products).values(product);
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.productName));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

// ============ OPPORTUNITY FUNCTIONS ============

export async function createOpportunity(opportunity: InsertOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(opportunities).values(opportunity);
}

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllOpportunities(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(opportunities)
      .where(eq(opportunities.ownerId, ownerId))
      .orderBy(desc(opportunities.createdAt));
  }
  return await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
}

export async function getOpportunitiesByStage(stage: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities)
    .where(eq(opportunities.stage, stage as any))
    .orderBy(desc(opportunities.amount));
}

export async function getOpportunitiesByAccount(accountId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities)
    .where(eq(opportunities.accountId, accountId))
    .orderBy(desc(opportunities.createdAt));
}

export async function updateOpportunity(id: number, data: Partial<InsertOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(opportunities).set(data).where(eq(opportunities.id, id));
}

export async function deleteOpportunity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(opportunities).where(eq(opportunities.id, id));
}

// ============ LINE ITEM FUNCTIONS ============

export async function createLineItem(lineItem: InsertLineItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(lineItems).values(lineItem);
}

export async function getLineItemsByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(lineItems)
    .where(eq(lineItems.opportunityId, opportunityId))
    .orderBy(asc(lineItems.id));
}

export async function updateLineItem(id: number, data: Partial<InsertLineItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(lineItems).set(data).where(eq(lineItems.id, id));
}

export async function deleteLineItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(lineItems).where(eq(lineItems.id, id));
}

// ============ ACTIVITY FUNCTIONS ============

export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(activities).values(activity);
}

export async function getActivitiesByRelated(relatedToType: string, relatedToId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activities)
    .where(
      and(
        eq(activities.relatedToType, relatedToType as any),
        eq(activities.relatedToId, relatedToId)
      )
    )
    .orderBy(desc(activities.activityDate));
}

export async function getAllActivities(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(activities)
      .where(eq(activities.ownerId, ownerId))
      .orderBy(desc(activities.activityDate));
  }
  return await db.select().from(activities).orderBy(desc(activities.activityDate));
}

// ============ PROJECT FUNCTIONS ============

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project);
  const insertId = Number(result[0].insertId);
  return await getProjectById(insertId);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0] || null;
}

export async function getProjectsByAccount(accountId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects)
    .where(eq(projects.accountId, accountId))
    .orderBy(desc(projects.createdAt));
}

export async function getAllProjects(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(projects)
      .where(eq(projects.ownerId, ownerId))
      .orderBy(desc(projects.createdAt));
  }
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const project = await getProjectById(id);
  await db.delete(projects).where(eq(projects.id, id));
  return project;
}

// ============ MILESTONE FUNCTIONS ============

export async function getMilestonesByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.displayOrder), asc(milestones.dueDate));
}

export async function getMilestoneById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(milestones).where(eq(milestones.id, id));
  return result[0] || null;
}

export async function createMilestone(milestoneData: InsertMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(milestones).values(milestoneData);
}

export async function updateMilestone(id: number, data: Partial<InsertMilestone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(milestones).set(data).where(eq(milestones.id, id));
  return await getMilestoneById(id);
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const milestone = await getMilestoneById(id);
  await db.delete(milestones).where(eq(milestones.id, id));
  return milestone;
}

export async function toggleMilestoneComplete(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const milestone = await getMilestoneById(id);
  if (!milestone) throw new Error("Milestone not found");
  
  const isCompleted = milestone.status === "Completed";
  const newStatus = isCompleted ? "In Progress" : "Completed";
  const completedDate = isCompleted ? null : new Date();
  
  await db.update(milestones)
    .set({ 
      status: newStatus,
      completedDate: completedDate
    })
    .where(eq(milestones.id, id));
  
  return await getMilestoneById(id);
}

// ============ WIN/LOSS ANALYSIS FUNCTIONS ============

export async function createWinLossAnalysis(analysisData: InsertWinLossAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(winLossAnalysis).values(analysisData);
  return await getWinLossAnalysisByOpportunity(analysisData.opportunityId);
}

export async function getWinLossAnalysisByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [analysis] = await db.select()
    .from(winLossAnalysis)
    .where(eq(winLossAnalysis.opportunityId, opportunityId));
  return analysis;
}

export async function updateWinLossAnalysis(opportunityId: number, data: Partial<InsertWinLossAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(winLossAnalysis)
    .set(data)
    .where(eq(winLossAnalysis.opportunityId, opportunityId));
  
  return await getWinLossAnalysisByOpportunity(opportunityId);
}

export async function deleteWinLossAnalysis(opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(winLossAnalysis)
    .where(eq(winLossAnalysis.opportunityId, opportunityId));
}

// ============ CASE FUNCTIONS ============

export async function createCase(caseData: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(cases).values(caseData);
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result[0] || null;
}

export async function getCasesByAccount(accountId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cases)
    .where(eq(cases.accountId, accountId))
    .orderBy(desc(cases.createdAt));
}

export async function getAllCases(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(cases)
      .where(eq(cases.ownerId, ownerId))
      .orderBy(desc(cases.createdAt));
  }
  return await db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function updateCase(id: number, data: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(cases).set(data).where(eq(cases.id, id));
}

// ============ DASHBOARD & ANALYTICS FUNCTIONS ============

export async function getPipelineByStage() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    stage: opportunities.stage,
    count: sql<number>`count(*)`,
    totalValue: sql<number>`sum(${opportunities.amount})`,
  })
  .from(opportunities)
  .where(
    and(
      sql`${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost')`
    )
  )
  .groupBy(opportunities.stage);
}

export async function getWonOpportunities() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities)
    .where(eq(opportunities.stage, 'Closed Won'))
    .orderBy(desc(opportunities.closedAt));
}

export async function getLostOpportunities() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities)
    .where(eq(opportunities.stage, 'Closed Lost'))
    .orderBy(desc(opportunities.closedAt));
}

export async function getActiveAccountsCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({
    count: sql<number>`count(*)`
  })
  .from(accounts);
  
  return result[0]?.count || 0;
}

export async function getWinRate(days: number = 90) {
  const db = await getDb();
  if (!db) return null;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const result = await db.select({
    totalClosed: sql<number>`count(*)`,
    totalWon: sql<number>`sum(case when ${opportunities.stage} = 'Closed Won' then 1 else 0 end)`
  })
  .from(opportunities)
  .where(
    and(
      sql`${opportunities.stage} IN ('Closed Won', 'Closed Lost')`,
      sql`${opportunities.closedAt} >= ${cutoffDate}`
    )
  );
  
  const totalClosed = result[0]?.totalClosed || 0;
  const totalWon = result[0]?.totalWon || 0;
  
  if (totalClosed === 0) return null;
  
  return Math.round((totalWon / totalClosed) * 100);
}

export async function getAverageDealSize() {
  const db = await getDb();
  if (!db) return null;
  
  // Get current quarter start date
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterStartMonth = currentQuarter * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  
  const result = await db.select({
    avgAmount: sql<number>`avg(${opportunities.amount})`
  })
  .from(opportunities)
  .where(
    and(
      eq(opportunities.stage, 'Closed Won'),
      sql`${opportunities.closedAt} >= ${quarterStart}`
    )
  );
  
  return result[0]?.avgAmount || null;
}


// ============ EMAIL CONNECTION FUNCTIONS ============

export async function createEmailConnection(connection: InsertEmailConnection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailConnections).values(connection);
  const insertId = Number(result[0].insertId);
  return await getEmailConnectionById(insertId);
}

export async function getEmailConnectionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailConnections).where(eq(emailConnections.id, id)).limit(1);
  return result[0] || null;
}

export async function getEmailConnectionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailConnections)
    .where(and(eq(emailConnections.userId, userId), eq(emailConnections.isActive, 1)));
}

export async function updateEmailConnection(id: number, data: Partial<InsertEmailConnection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailConnections).set({ ...data, updatedAt: new Date() }).where(eq(emailConnections.id, id));
  return await getEmailConnectionById(id);
}

export async function deleteEmailConnection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailConnections).set({ isActive: 0 }).where(eq(emailConnections.id, id));
  return true;
}

// ============ ACTIVITY FUNCTIONS (Extended) ============

export async function getRecentActivities(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activities)
    .where(eq(activities.ownerId, userId))
    .orderBy(desc(activities.activityDate))
    .limit(limit);
}

// ============ REPORTS FUNCTIONS ============

export async function getOpportunitiesByCloseDate() {
  const db = await getDb();
  if (!db) return [];
  
  // Group opportunities by month of close date
  return await db.select({
    month: sql<string>`DATE_FORMAT(${opportunities.closeDate}, '%Y-%m')`.as('month'),
    count: sql<number>`count(*)`,
    totalValue: sql<number>`sum(${opportunities.amount})`,
  })
  .from(opportunities)
  .where(
    sql`${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost')`
  )
  .groupBy(sql`month`)
  .orderBy(sql`month`);
}

export async function getRevenueByMonth() {
  const db = await getDb();
  if (!db) return [];
  
  // Get closed won opportunities grouped by month
  return await db.select({
    month: sql<string>`DATE_FORMAT(${opportunities.closedAt}, '%Y-%m')`.as('month'),
    revenue: sql<number>`sum(${opportunities.amount})`,
    count: sql<number>`count(*)`,
  })
  .from(opportunities)
  .where(eq(opportunities.stage, 'Closed Won'))
  .groupBy(sql`month`)
  .orderBy(sql`month`);
}

export async function getOpportunitiesByType() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    type: opportunities.type,
    count: sql<number>`count(*)`,
    totalValue: sql<number>`sum(${opportunities.amount})`,
  })
  .from(opportunities)
  .where(
    sql`${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost')`
  )
  .groupBy(opportunities.type);
}

export async function getLeadsBySource() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    source: leads.leadSource,
    count: sql<number>`count(*)`,
  })
  .from(leads)
  .groupBy(leads.leadSource);
}

export async function getForecastProjection() {
  const db = await getDb();
  if (!db) return null;
  
  // Get historical win rate (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const historicalResult = await db.select({
    totalClosed: sql<number>`count(*)`,
    totalWon: sql<number>`sum(case when ${opportunities.stage} = 'Closed Won' then 1 else 0 end)`,
    avgDealSize: sql<number>`avg(case when ${opportunities.stage} = 'Closed Won' then ${opportunities.amount} else null end)`,
  })
  .from(opportunities)
  .where(
    and(
      sql`${opportunities.stage} IN ('Closed Won', 'Closed Lost')`,
      sql`${opportunities.closedAt} >= ${ninetyDaysAgo}`
    )
  );
  
  const totalClosed = historicalResult[0]?.totalClosed || 0;
  const totalWon = historicalResult[0]?.totalWon || 0;
  const avgDealSize = historicalResult[0]?.avgDealSize || 0;
  
  // Calculate win rate
  const winRate = totalClosed > 0 ? totalWon / totalClosed : 0.3; // Default to 30% if no data
  
  // Get current pipeline grouped by expected close month
  const pipelineResult = await db.select({
    month: sql<string>`DATE_FORMAT(${opportunities.closeDate}, '%Y-%m')`.as('month'),
    count: sql<number>`count(*)`,
    totalValue: sql<number>`sum(${opportunities.amount})`,
  })
  .from(opportunities)
  .where(
    and(
      sql`${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost')`,
      sql`${opportunities.closeDate} >= CURDATE()`
    )
  )
  .groupBy(sql`month`)
  .orderBy(sql`month`)
  .limit(6); // Next 6 months
  
  return {
    winRate,
    avgDealSize,
    pipeline: pipelineResult.map(item => ({
      month: item.month,
      opportunityCount: Number(item.count),
      pipelineValue: Number(item.totalValue),
      forecastedRevenue: Number(item.totalValue) * winRate,
    })),
  };
}

// ============ CSV EXPORT FUNCTIONS ============

/**
 * Get accounts with enriched data for CSV export
 */
export async function getAccountsForExport(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(accounts)
      .where(eq(accounts.ownerId, ownerId))
      .orderBy(desc(accounts.createdAt));
  }
  return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
}

/**
 * Get contacts with account names for CSV export
 */
export async function getContactsForExport(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const query = db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      role: contacts.role,
      title: contacts.title,
      accountId: contacts.accountId,
      accountName: accounts.accountName,
      isPrimary: contacts.isPrimary,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
    })
    .from(contacts)
    .leftJoin(accounts, eq(contacts.accountId, accounts.id));
  
  if (ownerId) {
    return await query.where(eq(accounts.ownerId, ownerId)).orderBy(desc(contacts.createdAt));
  }
  return await query.orderBy(desc(contacts.createdAt));
}

/**
 * Get opportunities with account names for CSV export
 */
export async function getOpportunitiesForExport(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const query = db
    .select({
      id: opportunities.id,
      opportunityName: opportunities.opportunityName,
      accountId: opportunities.accountId,
      accountName: accounts.accountName,
      stage: opportunities.stage,
      amount: opportunities.amount,
      probability: opportunities.probability,
      type: opportunities.type,
      closeDate: opportunities.closeDate,
      nextSteps: opportunities.nextSteps,
      metrics: opportunities.metrics,
      economicBuyerId: opportunities.economicBuyerId,
      decisionCriteria: opportunities.decisionCriteria,
      decisionProcess: opportunities.decisionProcess,
      identifiedPain: opportunities.identifiedPain,
      championId: opportunities.championId,
      ownerId: opportunities.ownerId,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
    })
    .from(opportunities)
    .leftJoin(accounts, eq(opportunities.accountId, accounts.id));
  
  if (ownerId) {
    return await query.where(eq(opportunities.ownerId, ownerId)).orderBy(desc(opportunities.createdAt));
  }
  return await query.orderBy(desc(opportunities.createdAt));
}

/**
 * Get projects with account names for CSV export
 */
export async function getProjectsForExport(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const query = db
    .select({
      id: projects.id,
      projectName: projects.projectName,
      accountId: projects.accountId,
      accountName: accounts.accountName,
      status: projects.status,
      healthStatus: projects.healthStatus,
      adoptionLevel: projects.adoptionLevel,
      activeUsers: projects.activeUsers,
      customerSentiment: projects.customerSentiment,
      goLiveDate: projects.goLiveDate,
      actualGoLiveDate: projects.actualGoLiveDate,
      notes: projects.notes,
      ownerId: projects.ownerId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(accounts, eq(projects.accountId, accounts.id));
  
  if (ownerId) {
    return await query.where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.createdAt));
  }
  return await query.orderBy(desc(projects.createdAt));
}

/**
 * Get cases with account names for CSV export
 */
export async function getCasesForExport(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const query = db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      accountId: cases.accountId,
      accountName: accounts.accountName,
      subject: cases.subject,
      priority: cases.priority,
      type: cases.type,
      status: cases.status,
      description: cases.description,
      resolution: cases.resolution,
      resolvedAt: cases.resolvedAt,
      ownerId: cases.ownerId,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
    })
    .from(cases)
    .leftJoin(accounts, eq(cases.accountId, accounts.id));
  
  if (ownerId) {
    return await query.where(eq(cases.ownerId, ownerId)).orderBy(desc(cases.createdAt));
  }
  return await query.orderBy(desc(cases.createdAt));
}

/**
 * Get leads for CSV export
 */
export async function getLeadsForExport(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(leads)
      .where(eq(leads.assignedTo, ownerId))
      .orderBy(desc(leads.createdAt));
  }
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

/**
 * ========================================
 * SALES ANALYTICS & FORECASTING
 * ========================================
 */

/**
 * Get sales cycle metrics (win rate, avg deal size, cycle length)
 */
export async function getSalesCycleMetrics(ownerId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  let query = db.select({
    id: opportunities.id,
    amount: opportunities.amount,
    stage: opportunities.stage,
    createdAt: opportunities.createdAt,
    closedAt: opportunities.closedAt,
    ownerId: opportunities.ownerId,
  }).from(opportunities);

  const conditions = [];
  if (ownerId) {
    conditions.push(eq(opportunities.ownerId, ownerId));
  }
  if (startDate) {
    conditions.push(gte(opportunities.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(opportunities.createdAt, endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const opps = await query;

  // Calculate metrics
  const closedWon = opps.filter(o => o.stage === 'Closed Won');
  const closedLost = opps.filter(o => o.stage === 'Closed Lost');
  const totalClosed = closedWon.length + closedLost.length;
  
  const winRate = totalClosed > 0 ? (closedWon.length / totalClosed) * 100 : 0;
  
  const avgDealSize = closedWon.length > 0
    ? closedWon.reduce((sum, o) => sum + parseFloat(o.amount as any), 0) / closedWon.length
    : 0;

  // Calculate average sales cycle length (days from creation to close)
  const cyclesWithDates = closedWon.filter(o => o.closedAt);
  const avgCycleLength = cyclesWithDates.length > 0
    ? cyclesWithDates.reduce((sum, o) => {
        const days = Math.floor((o.closedAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / cyclesWithDates.length
    : 0;

  return {
    winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
    avgDealSize: Math.round(avgDealSize * 100) / 100,
    avgCycleLength: Math.round(avgCycleLength),
    totalOpportunities: opps.length,
    closedWon: closedWon.length,
    closedLost: closedLost.length,
    openOpportunities: opps.length - totalClosed,
  };
}

/**
 * Get weighted pipeline forecast
 */
export async function getWeightedPipelineForecast(ownerId?: number) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [
    not(eq(opportunities.stage, 'Closed Won')),
    not(eq(opportunities.stage, 'Closed Lost'))
  ];

  if (ownerId) {
    conditions.push(eq(opportunities.ownerId, ownerId));
  }

  const openOpps = await db.select({
    id: opportunities.id,
    opportunityName: opportunities.opportunityName,
    stage: opportunities.stage,
    amount: opportunities.amount,
    probability: opportunities.probability,
    closeDate: opportunities.closeDate,
    ownerId: opportunities.ownerId,
  }).from(opportunities)
    .where(and(...conditions));

  // Calculate weighted amounts by stage
  const byStage = openOpps.reduce((acc, opp) => {
    const stage = opp.stage;
    const amount = parseFloat(opp.amount as any);
    const probability = opp.probability || 0;
    const weightedAmount = (amount * probability) / 100;

    if (!acc[stage]) {
      acc[stage] = {
        stage,
        count: 0,
        totalAmount: 0,
        weightedAmount: 0,
      };
    }

    acc[stage].count++;
    acc[stage].totalAmount += amount;
    acc[stage].weightedAmount += weightedAmount;

    return acc;
  }, {} as Record<string, { stage: string; count: number; totalAmount: number; weightedAmount: number }>);

  const stageData = Object.values(byStage);

  // Calculate totals
  const totalPipeline = openOpps.reduce((sum, o) => sum + parseFloat(o.amount as any), 0);
  const totalWeighted = openOpps.reduce((sum, o) => {
    const amount = parseFloat(o.amount as any);
    const probability = o.probability || 0;
    return sum + (amount * probability / 100);
  }, 0);

  return {
    totalPipeline: Math.round(totalPipeline * 100) / 100,
    totalWeighted: Math.round(totalWeighted * 100) / 100,
    byStage: stageData.map(s => ({
      ...s,
      totalAmount: Math.round(s.totalAmount * 100) / 100,
      weightedAmount: Math.round(s.weightedAmount * 100) / 100,
    })),
    opportunityCount: openOpps.length,
  };
}

/**
 * Get deal health scores for opportunities
 */
export async function getDealHealthScores(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    not(eq(opportunities.stage, 'Closed Won')),
    not(eq(opportunities.stage, 'Closed Lost'))
  ];

  if (ownerId) {
    conditions.push(eq(opportunities.ownerId, ownerId));
  }

  const opps = await db.select({
    id: opportunities.id,
    opportunityName: opportunities.opportunityName,
    stage: opportunities.stage,
    amount: opportunities.amount,
    probability: opportunities.probability,
    closeDate: opportunities.closeDate,
    metrics: opportunities.metrics,
    economicBuyerId: opportunities.economicBuyerId,
    decisionCriteria: opportunities.decisionCriteria,
    decisionProcess: opportunities.decisionProcess,
    identifiedPain: opportunities.identifiedPain,
    championId: opportunities.championId,
    competition: opportunities.competition,
    nextSteps: opportunities.nextSteps,
    createdAt: opportunities.createdAt,
    updatedAt: opportunities.updatedAt,
  }).from(opportunities)
    .where(and(...conditions));

  // Calculate health score for each opportunity
  return opps.map(opp => {
    let score = 0;
    const factors: string[] = [];

    // MEDDIC completeness (40 points max)
    if (opp.metrics) { score += 7; factors.push('Metrics defined'); }
    if (opp.economicBuyerId) { score += 7; factors.push('Economic buyer identified'); }
    if (opp.decisionCriteria) { score += 7; factors.push('Decision criteria known'); }
    if (opp.decisionProcess) { score += 6; factors.push('Decision process mapped'); }
    if (opp.identifiedPain) { score += 7; factors.push('Pain identified'); }
    if (opp.championId) { score += 6; factors.push('Champion engaged'); }

    // Activity recency (20 points max)
    const daysSinceUpdate = Math.floor((Date.now() - opp.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 7) {
      score += 20;
      factors.push('Recently updated');
    } else if (daysSinceUpdate <= 14) {
      score += 15;
      factors.push('Updated within 2 weeks');
    } else if (daysSinceUpdate <= 30) {
      score += 10;
      factors.push('Updated within month');
    } else {
      factors.push('⚠️ Stale (no recent activity)');
    }

    // Close date proximity (20 points max)
    const daysToClose = Math.floor((opp.closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToClose < 0) {
      factors.push('⚠️ Past due');
    } else if (daysToClose <= 30) {
      score += 20;
      factors.push('Closing soon');
    } else if (daysToClose <= 60) {
      score += 15;
      factors.push('Closing this quarter');
    } else if (daysToClose <= 90) {
      score += 10;
      factors.push('Closing next quarter');
    }

    // Next steps defined (10 points)
    if (opp.nextSteps) {
      score += 10;
      factors.push('Next steps defined');
    } else {
      factors.push('⚠️ No next steps');
    }

    // Competition awareness (10 points)
    if (opp.competition) {
      score += 10;
      factors.push('Competition tracked');
    }

    // Determine health status
    let healthStatus: 'Healthy' | 'At Risk' | 'Critical';
    if (score >= 70) {
      healthStatus = 'Healthy';
    } else if (score >= 40) {
      healthStatus = 'At Risk';
    } else {
      healthStatus = 'Critical';
    }

    return {
      opportunityId: opp.id,
      opportunityName: opp.opportunityName,
      stage: opp.stage,
      amount: opp.amount,
      healthScore: score,
      healthStatus,
      factors,
      daysToClose,
      daysSinceUpdate,
    };
  });
}

/**
 * ========================================
 * ACTIVITY TIMELINE & ENGAGEMENT TRACKING
 * ========================================
 */

/**
 * Get unified activity timeline for an entity
 */
export async function getActivityTimeline(params: {
  accountId?: number;
  contactId?: number;
  opportunityId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { accountId, contactId, opportunityId, limit = 50 } = params;

  const conditions = [];
  if (accountId) {
    conditions.push(and(
      eq(activities.relatedToType, 'Account'),
      eq(activities.relatedToId, accountId)
    ));
  }
  if (contactId) {
    conditions.push(and(
      eq(activities.relatedToType, 'Contact'),
      eq(activities.relatedToId, contactId)
    ));
  }
  if (opportunityId) {
    conditions.push(and(
      eq(activities.relatedToType, 'Opportunity'),
      eq(activities.relatedToId, opportunityId)
    ));
  }

  if (conditions.length === 0) {
    return [];
  }

  const timeline = await db.select({
    id: activities.id,
    type: activities.type,
    subject: activities.subject,
    notes: activities.notes,
    activityDate: activities.activityDate,
    duration: activities.duration,
    relatedToType: activities.relatedToType,
    relatedToId: activities.relatedToId,
    ownerId: activities.ownerId,
    createdAt: activities.createdAt,
  })
    .from(activities)
    .where(or(...conditions))
    .orderBy(desc(activities.activityDate))
    .limit(limit);

  return timeline;
}

/**
 * Get engagement score for an account
 */
export async function getAccountEngagementScore(accountId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all activities for the account in the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentActivities = await db.select()
    .from(activities)
    .where(and(
      eq(activities.relatedToType, 'Account'),
      eq(activities.relatedToId, accountId),
      gte(activities.activityDate, ninetyDaysAgo)
    ));

  // Calculate engagement score
  let score = 0;
  const factors: string[] = [];

  // Activity frequency (40 points max)
  const activityCount = recentActivities.length;
  if (activityCount >= 20) {
    score += 40;
    factors.push('Very active (20+ activities)');
  } else if (activityCount >= 10) {
    score += 30;
    factors.push('Active (10-19 activities)');
  } else if (activityCount >= 5) {
    score += 20;
    factors.push('Moderate (5-9 activities)');
  } else if (activityCount > 0) {
    score += 10;
    factors.push('Low activity (1-4 activities)');
  } else {
    factors.push('⚠️ No recent activity');
  }

  // Activity diversity (20 points max)
  const activityTypes = new Set(recentActivities.map(a => a.type));
  const diversityScore = Math.min(activityTypes.size * 5, 20);
  score += diversityScore;
  if (activityTypes.size >= 4) {
    factors.push('High diversity (4+ activity types)');
  } else if (activityTypes.size >= 2) {
    factors.push('Moderate diversity (2-3 types)');
  }

  // Recency (20 points max)
  if (recentActivities.length > 0) {
    const mostRecent = recentActivities[0];
    const daysSince = Math.floor((Date.now() - mostRecent.activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 7) {
      score += 20;
      factors.push('Recent activity (within 7 days)');
    } else if (daysSince <= 14) {
      score += 15;
      factors.push('Activity within 2 weeks');
    } else if (daysSince <= 30) {
      score += 10;
      factors.push('Activity within month');
    } else {
      factors.push('⚠️ Stale (30+ days since activity)');
    }
  }

  // Meeting frequency (20 points max)
  const meetings = recentActivities.filter(a => a.type === 'Meeting');
  if (meetings.length >= 5) {
    score += 20;
    factors.push('Frequent meetings (5+)');
  } else if (meetings.length >= 3) {
    score += 15;
    factors.push('Regular meetings (3-4)');
  } else if (meetings.length >= 1) {
    score += 10;
    factors.push('Some meetings (1-2)');
  } else {
    factors.push('⚠️ No meetings');
  }

  // Determine engagement level
  let engagementLevel: 'High' | 'Medium' | 'Low';
  if (score >= 70) {
    engagementLevel = 'High';
  } else if (score >= 40) {
    engagementLevel = 'Medium';
  } else {
    engagementLevel = 'Low';
  }

  // Calculate days since last activity
  const daysSinceLastActivity = recentActivities.length > 0 
    ? Math.floor((Date.now() - recentActivities[0].activityDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    accountId,
    engagementScore: score,
    engagementLevel,
    factors,
    activityCount,
    activityTypes: activityTypes ? Array.from(activityTypes) : [],
    lastActivityDate: recentActivities.length > 0 ? recentActivities[0].activityDate : null,
    daysSinceLastActivity,
  };
}

/**
 * Get engagement scores for all accounts
 */
export async function getAllAccountEngagementScores(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];

  let accountsQuery = db.select({
    id: accounts.id,
    accountName: accounts.accountName,
    ownerId: accounts.ownerId,
  }).from(accounts);

  if (ownerId) {
    accountsQuery = accountsQuery.where(eq(accounts.ownerId, ownerId)) as any;
  }

  const accountsList = await accountsQuery;

  // Get engagement scores for each account
  const scores = await Promise.all(
    accountsList.map(async (account) => {
      const engagementData = await getAccountEngagementScore(account.id);
      return {
        ...account,
        ...engagementData,
      };
    })
  );

  // Sort by engagement score descending
  return scores.sort((a, b) => (b?.engagementScore || 0) - (a?.engagementScore || 0));
}

/**
 * ========================================
 * FORECAST TRACKING & ACCURACY
 * ========================================
 */

/**
 * Create a forecast snapshot for a given period
 */
export async function createForecastSnapshot(params: {
  periodType: 'Month' | 'Quarter' | 'Year';
  periodStart: Date;
  periodEnd: Date;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const { periodType, periodStart, periodEnd, ownerId } = params;

  // Get all open opportunities in the period
  const conditions = [
    gte(opportunities.closeDate, periodStart),
    lte(opportunities.closeDate, periodEnd),
    notInArray(opportunities.stage, ['Closed Won', 'Closed Lost'])
  ];

  if (ownerId) {
    conditions.push(eq(opportunities.ownerId, ownerId));
  }

  const opps = await db.select({
    id: opportunities.id,
    opportunityName: opportunities.opportunityName,
    stage: opportunities.stage,
    amount: opportunities.amount,
    probability: opportunities.probability,
    closeDate: opportunities.closeDate,
    accountId: opportunities.accountId,
  })
    .from(opportunities)
    .where(and(...conditions));

  // Calculate totals
  let forecastAmount = 0;
  let weightedAmount = 0;

  for (const opp of opps) {
    const amount = parseFloat(opp.amount?.toString() || '0');
    const probability = opp.probability || 0;
    forecastAmount += amount;
    weightedAmount += (amount * probability) / 100;
  }

  // Create snapshot
  const [snapshot] = await db.insert(forecastSnapshots).values({
    snapshotDate: new Date(),
    periodType,
    periodStart,
    periodEnd,
    forecastAmount: forecastAmount.toString(),
    weightedAmount: weightedAmount.toString(),
    opportunityCount: opps.length,
    ownerId: ownerId || null,
  });

  const snapshotId = snapshot.insertId;

  // Get account names for opportunities
  const accountIds = opps.map(o => o.accountId).filter((id): id is number => id !== null);
  const accountsData = accountIds.length > 0
    ? await db.select({ id: accounts.id, accountName: accounts.accountName })
        .from(accounts)
        .where(inArray(accounts.id, accountIds))
    : [];

  const accountMap = new Map(accountsData.map(a => [a.id, a.accountName]));

  // Store individual opportunities
  if (opps.length > 0) {
    await db.insert(forecastSnapshotOpportunities).values(
      opps.map(opp => ({
        snapshotId: Number(snapshotId),
        opportunityId: opp.id,
        opportunityName: opp.opportunityName,
        stage: opp.stage,
        amount: opp.amount?.toString() || '0',
        probability: opp.probability || 0,
        weightedAmount: ((parseFloat(opp.amount?.toString() || '0') * (opp.probability || 0)) / 100).toString(),
        closeDate: opp.closeDate,
        accountName: opp.accountId ? (accountMap.get(opp.accountId) || null) : null,
      }))
    );
  }

  return snapshotId;
}

/**
 * Get forecast accuracy comparison
 */
export async function getForecastAccuracy(params: {
  periodType: 'Month' | 'Quarter' | 'Year';
  periodStart: Date;
  periodEnd: Date;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const { periodType, periodStart, periodEnd, ownerId } = params;

  // Get the most recent snapshot for this period
  const snapshotConditions = [
    eq(forecastSnapshots.periodType, periodType),
    eq(forecastSnapshots.periodStart, periodStart),
    eq(forecastSnapshots.periodEnd, periodEnd)
  ];

  if (ownerId) {
    snapshotConditions.push(eq(forecastSnapshots.ownerId, ownerId));
  } else {
    snapshotConditions.push(isNull(forecastSnapshots.ownerId));
  }

  const snapshots = await db.select()
    .from(forecastSnapshots)
    .where(and(...snapshotConditions))
    .orderBy(desc(forecastSnapshots.snapshotDate))
    .limit(1);
  if (snapshots.length === 0) {
    return null;
  }

  const snapshot = snapshots[0];

  // Get actual closed won deals in the period
  const actualsConditions = [
    gte(opportunities.closeDate, periodStart),
    lte(opportunities.closeDate, periodEnd),
    eq(opportunities.stage, 'Closed Won')
  ];

  if (ownerId) {
    actualsConditions.push(eq(opportunities.ownerId, ownerId));
  }

  const actualDeals = await db.select({
    id: opportunities.id,
    opportunityName: opportunities.opportunityName,
    amount: opportunities.amount,
    stage: opportunities.stage,
    closeDate: opportunities.closeDate,
  })
    .from(opportunities)
    .where(and(...actualsConditions));

  const actualAmount = actualDeals.reduce((sum, deal) => 
    sum + parseFloat(deal.amount?.toString() || '0'), 0
  );

  const forecastedAmount = parseFloat(snapshot.forecastAmount?.toString() || '0');
  const weightedForecast = parseFloat(snapshot.weightedAmount?.toString() || '0');

  // Calculate accuracy
  const forecastAccuracy = forecastedAmount > 0 
    ? (actualAmount / forecastedAmount) * 100 
    : 0;

  const weightedAccuracy = weightedForecast > 0
    ? (actualAmount / weightedForecast) * 100
    : 0;

  // Get snapshot opportunities for stage analysis
  const snapshotOpps = await db.select()
    .from(forecastSnapshotOpportunities)
    .where(eq(forecastSnapshotOpportunities.snapshotId, snapshot.id));

  // Calculate accuracy by stage
  const stageAccuracy: Record<string, any> = {};
  const stages = snapshotOpps && snapshotOpps.length > 0 
    ? Array.from(new Set(snapshotOpps.map(o => o.stage))) 
    : [];

  for (const stage of stages) {
    const stageOpps = snapshotOpps.filter(o => o.stage === stage);
    const stageForecast = stageOpps.reduce((sum, o) => 
      sum + parseFloat(o.weightedAmount?.toString() || '0'), 0
    );

    // Find which of these actually closed
    const stageOppIds = stageOpps.map(o => o.opportunityId);
    const stageActuals = actualDeals.filter(d => stageOppIds.includes(d.id));
    const stageActualAmount = stageActuals.reduce((sum, d) => 
      sum + parseFloat(d.amount?.toString() || '0'), 0
    );

    stageAccuracy[stage] = {
      forecasted: stageForecast,
      actual: stageActualAmount,
      accuracy: stageForecast > 0 ? (stageActualAmount / stageForecast) * 100 : 0,
      opportunityCount: stageOpps.length,
      closedCount: stageActuals.length,
      closeRate: stageOpps.length > 0 ? (stageActuals.length / stageOpps.length) * 100 : 0,
    };
  }

  return {
    snapshot: {
      id: snapshot.id,
      snapshotDate: snapshot.snapshotDate,
      periodType: snapshot.periodType,
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      forecastAmount: forecastedAmount,
      weightedAmount: weightedForecast,
      opportunityCount: snapshot.opportunityCount,
    },
    actuals: {
      amount: actualAmount,
      dealCount: actualDeals.length,
      deals: actualDeals,
    },
    accuracy: {
      forecastAccuracy: forecastAccuracy,
      weightedAccuracy: weightedAccuracy,
      variance: actualAmount - forecastedAmount,
      weightedVariance: actualAmount - weightedForecast,
    },
    stageAccuracy,
  };
}

/**
 * Get all forecast snapshots
 */
export async function getAllForecastSnapshots(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select()
    .from(forecastSnapshots)
    .orderBy(desc(forecastSnapshots.snapshotDate));

  if (ownerId) {
    query = query.where(eq(forecastSnapshots.ownerId, ownerId)) as any;
  }

  return await query;
}

/**
 * ========================================
 * CUSTOM REPORT BUILDER
 * ========================================
 */

/**
 * Execute a custom report query
 */
export async function executeCustomReport(config: {
  modules: string[]; // ['accounts', 'opportunities', 'engagement']
  fields: string[]; // ['accountName', 'opportunityName', 'engagementScore']
  filters: Array<{
    field: string;
    operator: string; // '>', '<', '=', 'contains', 'between'
    value: any;
  }>;
  sorting?: { field: string; direction: 'asc' | 'desc' }[];
  groupBy?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { modules, fields, filters, sorting, groupBy, limit = 1000 } = config;

  // Build a dynamic query based on modules
  // For simplicity, we'll support common cross-module queries

  // Example: Accounts with Opportunities and Engagement
  if (modules.includes('accounts') && modules.includes('opportunities') && modules.includes('engagement')) {
    // Get all accounts with their opportunities
    const accountsData = await db.select({
      accountId: accounts.id,
      accountName: accounts.accountName,
      industry: accounts.industry,
      region: accounts.region,
      vertical: accounts.vertical,
    }).from(accounts);

    // Get opportunities for these accounts
    const oppsData = await db.select({
      id: opportunities.id,
      accountId: opportunities.accountId,
      opportunityName: opportunities.opportunityName,
      stage: opportunities.stage,
      amount: opportunities.amount,
      probability: opportunities.probability,
      closeDate: opportunities.closeDate,
    }).from(opportunities);

    // Build results
    const results = [];
    for (const account of accountsData) {
      const accountOpps = oppsData.filter(o => o.accountId === account.accountId);
      const pipelineValue = accountOpps
        .filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage))
        .reduce((sum, o) => sum + parseFloat(o.amount?.toString() || '0'), 0);

      // Get engagement score
      const engagementData = await getAccountEngagementScore(account.accountId);

      const row: any = {
        accountId: account.accountId,
        accountName: account.accountName,
        industry: account.industry,
        region: account.region,
        vertical: account.vertical,
        opportunityCount: accountOpps.length,
        pipelineValue,
        engagementScore: engagementData?.engagementScore || 0,
        engagementLevel: engagementData?.engagementLevel || 'Low',
      };

      // Apply filters
      let passesFilters = true;
      for (const filter of filters) {
        const fieldValue = row[filter.field];
        switch (filter.operator) {
          case '>':
            if (!(fieldValue > filter.value)) passesFilters = false;
            break;
          case '<':
            if (!(fieldValue < filter.value)) passesFilters = false;
            break;
          case '=':
            if (fieldValue !== filter.value) passesFilters = false;
            break;
          case '>=':
            if (!(fieldValue >= filter.value)) passesFilters = false;
            break;
          case '<=':
            if (!(fieldValue <= filter.value)) passesFilters = false;
            break;
          case 'contains':
            if (!String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())) {
              passesFilters = false;
            }
            break;
          case 'in':
            if (!Array.isArray(filter.value) || !filter.value.includes(fieldValue)) {
              passesFilters = false;
            }
            break;
          case 'not_in':
            if (Array.isArray(filter.value) && filter.value.includes(fieldValue)) {
              passesFilters = false;
            }
            break;
          case 'between':
            if (filter.value.start && filter.value.end) {
              const val = typeof fieldValue === 'number' ? fieldValue : new Date(fieldValue).getTime();
              const start = typeof filter.value.start === 'number' ? filter.value.start : new Date(filter.value.start).getTime();
              const end = typeof filter.value.end === 'number' ? filter.value.end : new Date(filter.value.end).getTime();
              if (!(val >= start && val <= end)) passesFilters = false;
            }
            break;
        }
      }

      if (passesFilters) {
        results.push(row);
      }
    }

    // Apply sorting
    if (sorting && sorting.length > 0) {
      results.sort((a, b) => {
        for (const sort of sorting) {
          const aVal = a[sort.field];
          const bVal = b[sort.field];
          if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return results.slice(0, limit);
  }

  // Add more module combinations as needed
  return [];
}

/**
 * Get available fields for report builder
 */
export function getAvailableReportFields() {
  return {
    accounts: [
      { field: 'accountId', label: 'Account ID', type: 'number' },
      { field: 'accountName', label: 'Account Name', type: 'string' },
      { field: 'industry', label: 'Industry', type: 'string' },
      { field: 'region', label: 'Region', type: 'string' },
      { field: 'vertical', label: 'Vertical', type: 'string' },
    ],
    opportunities: [
      { field: 'opportunityCount', label: 'Opportunity Count', type: 'number' },
      { field: 'pipelineValue', label: 'Pipeline Value', type: 'number' },
      { field: 'stage', label: 'Stage', type: 'string' },
      { field: 'amount', label: 'Amount', type: 'number' },
      { field: 'probability', label: 'Probability', type: 'number' },
    ],
    engagement: [
      { field: 'engagementScore', label: 'Engagement Score', type: 'number' },
      { field: 'engagementLevel', label: 'Engagement Level', type: 'string' },
      { field: 'activityCount', label: 'Activity Count', type: 'number' },
    ],
  };
}

/**
 * Save a custom report template
 */
export async function saveReportTemplate(params: {
  reportName: string;
  reportType: 'PreBuilt' | 'Custom';
  category?: string;
  description?: string;
  queryConfig: any;
  columns: any;
  filters: any;
  sorting?: any;
  grouping?: any;
  isPublic?: boolean;
  isFavorite?: boolean;
  scheduleFrequency?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  scheduleDay?: number;
  scheduleTime?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(savedReports).values({
    reportName: params.reportName,
    reportType: params.reportType,
    category: params.category || null,
    description: params.description || null,
    queryConfig: params.queryConfig,
    columns: params.columns,
    filters: params.filters,
    sorting: params.sorting || null,
    grouping: params.grouping || null,
    isPublic: params.isPublic || false,
    isFavorite: params.isFavorite || false,
    scheduleFrequency: params.scheduleFrequency || 'None',
    scheduleDay: params.scheduleDay || null,
    scheduleTime: params.scheduleTime || null,
    createdBy: params.createdBy,
  });

  return result.insertId;
}

/**
 * Get all saved reports
 */
export async function getSavedReports(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(savedReports)
    .where(or(
      eq(savedReports.createdBy, userId),
      eq(savedReports.isPublic, true)
    ))
    .orderBy(desc(savedReports.createdAt));
}

/**
 * Get a specific saved report
 */
export async function getSavedReport(reportId: number) {
  const db = await getDb();
  if (!db) return null;

  const reports = await db.select()
    .from(savedReports)
    .where(eq(savedReports.id, reportId))
    .limit(1);

  return reports.length > 0 ? reports[0] : null;
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(reportId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(savedReports)
    .where(and(
      eq(savedReports.id, reportId),
      eq(savedReports.createdBy, userId)
    ));

  return true;
}

/**
 * Log report execution
 */
export async function logReportExecution(params: {
  reportId: number;
  executedBy: number;
  rowCount: number;
  executionTimeMs: number;
  parameters?: any;
  status: 'Success' | 'Failed' | 'Timeout';
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(reportExecutions).values({
    reportId: params.reportId,
    executedBy: params.executedBy,
    rowCount: params.rowCount,
    executionTimeMs: params.executionTimeMs,
    parameters: params.parameters || null,
    status: params.status,
    errorMessage: params.errorMessage || null,
  });

  return result.insertId;
}

/**
 * ========================================
 * EMAIL DIGEST SYSTEM
 * ========================================
 */

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const prefs = await db.select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return prefs.length > 0 ? prefs[0] : null;
}

/**
 * Create or update user preferences
 */
export async function upsertUserPreferences(params: {
  userId: number;
  dashboardWidgets?: any;
  digestEnabled?: boolean;
  digestFrequency?: 'None' | 'Daily' | 'Weekly';
  digestDay?: number;
  digestTime?: string;
  includeAtRiskDeals?: boolean;
  includeLowEngagement?: boolean;
  includeForecastSummary?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;

  // Check if preferences exist
  const existing = await getUserPreferences(params.userId);

  if (existing) {
    // Update
    await db.update(userPreferences)
      .set({
        dashboardWidgets: params.dashboardWidgets ?? existing.dashboardWidgets,
        digestEnabled: params.digestEnabled ?? existing.digestEnabled,
        digestFrequency: params.digestFrequency ?? existing.digestFrequency,
        digestDay: params.digestDay ?? existing.digestDay,
        digestTime: params.digestTime ?? existing.digestTime,
        includeAtRiskDeals: params.includeAtRiskDeals ?? existing.includeAtRiskDeals,
        includeLowEngagement: params.includeLowEngagement ?? existing.includeLowEngagement,
        includeForecastSummary: params.includeForecastSummary ?? existing.includeForecastSummary,
      })
      .where(eq(userPreferences.userId, params.userId));

    return existing.id;
  } else {
    // Insert
    const [result] = await db.insert(userPreferences).values({
      userId: params.userId,
      dashboardWidgets: params.dashboardWidgets || null,
      digestEnabled: params.digestEnabled ?? true,
      digestFrequency: params.digestFrequency ?? 'Weekly',
      digestDay: params.digestDay ?? 1, // Monday
      digestTime: params.digestTime ?? '09:00',
      includeAtRiskDeals: params.includeAtRiskDeals ?? true,
      includeLowEngagement: params.includeLowEngagement ?? true,
      includeForecastSummary: params.includeForecastSummary ?? false,
    });

    return result.insertId;
  }
}

/**
 * Get at-risk deals for digest
 */
export async function getAtRiskDealsForDigest(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    notInArray(opportunities.stage, ['Closed Won', 'Closed Lost']),
  ];

  if (userId) {
    conditions.push(eq(opportunities.ownerId, userId));
  }

  const opps = await db.select({
    id: opportunities.id,
    opportunityName: opportunities.opportunityName,
    accountId: opportunities.accountId,
    stage: opportunities.stage,
    amount: opportunities.amount,
    closeDate: opportunities.closeDate,
    healthScore: opportunities.healthScore,
    lastActivityDate: opportunities.lastActivityDate,
    nextSteps: opportunities.nextSteps,
  })
    .from(opportunities)
    .where(and(...conditions))
    .orderBy(asc(opportunities.healthScore));

  // Filter for at-risk (health score < 40 or stale)
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const atRisk = opps.filter(opp => {
    const healthScore = opp.healthScore || 0;
    const lastActivity = opp.lastActivityDate ? new Date(opp.lastActivityDate) : null;
    const isStale = !lastActivity || lastActivity < fourteenDaysAgo;
    
    return healthScore < 40 || isStale;
  });

  // Get account names
  if (atRisk.length > 0) {
    const accountIds = atRisk.map(o => o.accountId).filter((id): id is number => id !== null);
    const accountsData = accountIds.length > 0
      ? await db.select({ id: accounts.id, accountName: accounts.accountName })
          .from(accounts)
          .where(inArray(accounts.id, accountIds))
      : [];

    const accountMap = new Map(accountsData.map(a => [a.id, a.accountName]));

    return atRisk.map(opp => ({
      ...opp,
      accountName: opp.accountId ? (accountMap.get(opp.accountId) || 'Unknown') : 'Unknown',
    }));
  }

  return [];
}

/**
 * Get low-engagement accounts for digest
 */
export async function getLowEngagementAccountsForDigest(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all accounts
  const accountsData = await db.select({
    id: accounts.id,
    accountName: accounts.accountName,
    industry: accounts.industry,
    region: accounts.region,
  }).from(accounts);

  // Calculate engagement for each
  const results = [];
  for (const account of accountsData) {
    const engagement = await getAccountEngagementScore(account.id);
    if (engagement && engagement.engagementScore < 40) {
      results.push({
        ...account,
        engagementScore: engagement.engagementScore,
        engagementLevel: engagement.engagementLevel,
        activityCount: engagement.activityCount,
        daysSinceLastActivity: engagement.daysSinceLastActivity,
      });
    }
  }

  // Sort by engagement score ascending (worst first)
  results.sort((a, b) => a.engagementScore - b.engagementScore);

  return results.slice(0, 10); // Top 10 worst
}

/**
 * Log email digest
 */
export async function logEmailDigest(params: {
  userId: number;
  digestType: 'AtRiskDeals' | 'LowEngagement' | 'Combined';
  itemCount: number;
  status: 'Sent' | 'Failed' | 'Skipped';
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(emailDigests).values({
    userId: params.userId,
    digestType: params.digestType,
    itemCount: params.itemCount,
    status: params.status,
    errorMessage: params.errorMessage || null,
  });

  return result.insertId;
}

/**
 * Get users who should receive digest now
 */
export async function getUsersForDigest(frequency: 'Daily' | 'Weekly', currentDay: number, currentHour: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(userPreferences.digestEnabled, true),
    eq(userPreferences.digestFrequency, frequency),
  ];

  if (frequency === 'Weekly') {
    conditions.push(eq(userPreferences.digestDay, currentDay));
  }

  const prefs = await db.select({
    userId: userPreferences.userId,
    digestTime: userPreferences.digestTime,
    includeAtRiskDeals: userPreferences.includeAtRiskDeals,
    includeLowEngagement: userPreferences.includeLowEngagement,
    includeForecastSummary: userPreferences.includeForecastSummary,
  })
    .from(userPreferences)
    .where(and(...conditions));

  // Filter by time (within current hour)
  return prefs.filter(pref => {
    const [hour] = pref.digestTime?.split(':').map(Number) || [9];
    return hour === currentHour;
  });
}

/**
 * ========================================
 * DASHBOARD WIDGETS
 * ========================================
 */

/**
 * Get top at-risk opportunities widget data
 */
export async function getTopAtRiskOpportunitiesWidget(userId?: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    notInArray(opportunities.stage, ['Closed Won', 'Closed Lost']),
  ];

  if (userId) {
    conditions.push(eq(opportunities.ownerId, userId));
  }

  const opps = await db.select({
    id: opportunities.id,
    opportunityName: opportunities.opportunityName,
    accountId: opportunities.accountId,
    stage: opportunities.stage,
    amount: opportunities.amount,
    closeDate: opportunities.closeDate,
    healthScore: opportunities.healthScore,
    lastActivityDate: opportunities.lastActivityDate,
  })
    .from(opportunities)
    .where(and(...conditions))
    .orderBy(asc(opportunities.healthScore))
    .limit(limit);

  // Get account names
  if (opps.length > 0) {
    const accountIds = opps.map(o => o.accountId).filter((id): id is number => id !== null);
    const accountsData = accountIds.length > 0
      ? await db.select({ id: accounts.id, accountName: accounts.accountName })
          .from(accounts)
          .where(inArray(accounts.id, accountIds))
      : [];

    const accountMap = new Map(accountsData.map(a => [a.id, a.accountName]));

    return opps.map(opp => ({
      ...opp,
      accountName: opp.accountId ? (accountMap.get(opp.accountId) || 'Unknown') : 'Unknown',
    }));
  }

  return [];
}

/**
 * Get forecast accuracy trend widget data (last 6 months)
 */
export async function getForecastAccuracyTrendWidget(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  // Get last 6 months of snapshots
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const conditions = [
    gte(forecastSnapshots.snapshotDate, sixMonthsAgo),
    eq(forecastSnapshots.periodType, 'Month'),
  ];

  if (userId) {
    conditions.push(eq(forecastSnapshots.ownerId, userId));
  } else {
    conditions.push(isNull(forecastSnapshots.ownerId));
  }

  const snapshots = await db.select()
    .from(forecastSnapshots)
    .where(and(...conditions))
    .orderBy(asc(forecastSnapshots.periodStart));

  // Return empty array if no snapshots exist
  if (snapshots.length === 0) {
    return [];
  }

  // Calculate accuracy for each
  const trend = [];
  for (const snapshot of snapshots) {
    try {
      const accuracy = await getForecastAccuracy({
        periodType: 'Month',
        periodStart: new Date(snapshot.periodStart),
        periodEnd: new Date(snapshot.periodEnd),
        ownerId: userId,
      });

      if (accuracy) {
        trend.push({
          month: new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          forecastAmount: parseFloat(snapshot.forecastAmount.toString()),
          actualAmount: accuracy.actuals.actualAmount,
          accuracy: accuracy.accuracy.forecastAccuracy,
        });
      }
    } catch (error) {
      console.error('Error calculating forecast accuracy for snapshot:', error);
      // Continue to next snapshot
    }
  }

  return trend;
}

/**
 * Get low engagement accounts widget data
 */
export async function getLowEngagementAccountsWidget(userId?: number, limit: number = 5) {
  return await getLowEngagementAccountsForDigest(userId);
}

/**
 * Get pipeline by stage widget data
 */
export async function getPipelineByStageWidget(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    notInArray(opportunities.stage, ['Closed Won', 'Closed Lost']),
  ];

  if (userId) {
    conditions.push(eq(opportunities.ownerId, userId));
  }

  const pipeline = await db.select({
    stage: opportunities.stage,
    count: sql<number>`count(*)`,
    totalValue: sql<number>`sum(${opportunities.amount})`,
  })
    .from(opportunities)
    .where(and(...conditions))
    .groupBy(opportunities.stage);

  return pipeline.map(p => ({
    stage: p.stage,
    count: Number(p.count),
    totalValue: parseFloat(p.totalValue?.toString() || '0'),
  }));
}

/**
 * Get win rate trend widget data (last 6 months)
 */
export async function getWinRateTrendWidget(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  const results = [];
  
  for (let i = 5; i >= 0; i--) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - i);
    endDate.setDate(1); // First of month
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 1);

    const conditions = [
      gte(opportunities.closeDate, startDate),
      lte(opportunities.closeDate, endDate),
      inArray(opportunities.stage, ['Closed Won', 'Closed Lost']),
    ];

    if (userId) {
      conditions.push(eq(opportunities.ownerId, userId));
    }

    const deals = await db.select({
      stage: opportunities.stage,
    })
      .from(opportunities)
      .where(and(...conditions));

    const won = deals.filter(d => d.stage === 'Closed Won').length;
    const total = deals.length;
    const winRate = total > 0 ? (won / total) * 100 : 0;

    results.push({
      month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      winRate: Math.round(winRate),
      won,
      lost: total - won,
    });
  }

  return results;
}

/**
 * ========================================
 * FILTER PRESETS
 * ========================================
 */

/**
 * Create system filter presets
 */
export async function createSystemFilterPresets() {
  const db = await getDb();
  if (!db) return;

  const systemPresets = [
    {
      presetName: "Enterprise deals closing this quarter",
      description: "Opportunities over $500K closing in the current quarter",
      category: "Opportunities",
      filters: [
        { field: "amount", operator: ">=", value: 500000 },
        { field: "closeDate", operator: "between", value: { start: new Date(), end: new Date(new Date().setMonth(new Date().getMonth() + 3)) } },
        { field: "stage", operator: "not_in", value: ["Closed Won", "Closed Lost"] },
      ],
      isSystem: true,
      isPublic: true,
      createdBy: 1, // System user
    },
    {
      presetName: "Stale opportunities (30+ days)",
      description: "Open opportunities with no activity in 30+ days",
      category: "Opportunities",
      filters: [
        { field: "lastActivityDate", operator: "<", value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { field: "stage", operator: "not_in", value: ["Closed Won", "Closed Lost"] },
      ],
      isSystem: true,
      isPublic: true,
      createdBy: 1,
    },
    {
      presetName: "High-value low-engagement accounts",
      description: "Accounts with pipeline >$1M but engagement score <40",
      category: "Accounts",
      filters: [
        { field: "pipelineValue", operator: ">", value: 1000000 },
        { field: "engagementScore", operator: "<", value: 40 },
      ],
      isSystem: true,
      isPublic: true,
      createdBy: 1,
    },
    {
      presetName: "At-risk deals closing this month",
      description: "Deals with health score <40 closing within 30 days",
      category: "Opportunities",
      filters: [
        { field: "healthScore", operator: "<", value: 40 },
        { field: "closeDate", operator: "<=", value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        { field: "stage", operator: "not_in", value: ["Closed Won", "Closed Lost"] },
      ],
      isSystem: true,
      isPublic: true,
      createdBy: 1,
    },
    {
      presetName: "Enterprise accounts in North America",
      description: "Enterprise segment accounts in North America region",
      category: "Accounts",
      filters: [
        { field: "vertical", operator: "=", value: "Enterprise" },
        { field: "region", operator: "=", value: "North America" },
      ],
      isSystem: true,
      isPublic: true,
      createdBy: 1,
    },
  ];

  // Check if presets already exist
  const existing = await db.select()
    .from(filterPresets)
    .where(eq(filterPresets.isSystem, true))
    .limit(1);

  if (existing.length === 0) {
    for (const preset of systemPresets) {
      await db.insert(filterPresets).values(preset);
    }
    console.log('[FilterPresets] Created system filter presets');
  }
}

/**
 * Get all filter presets
 */
export async function getFilterPresets(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(filterPresets)
    .where(or(
      eq(filterPresets.createdBy, userId),
      eq(filterPresets.isPublic, true)
    ))
    .orderBy(desc(filterPresets.isSystem), desc(filterPresets.createdAt));
}

/**
 * Get a specific filter preset
 */
export async function getFilterPreset(presetId: number) {
  const db = await getDb();
  if (!db) return null;

  const presets = await db.select()
    .from(filterPresets)
    .where(eq(filterPresets.id, presetId))
    .limit(1);

  return presets.length > 0 ? presets[0] : null;
}

/**
 * Save a filter preset
 */
export async function saveFilterPreset(params: {
  presetName: string;
  description?: string;
  category: string;
  filters: any;
  isPublic?: boolean;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(filterPresets).values({
    presetName: params.presetName,
    description: params.description || null,
    category: params.category,
    filters: params.filters,
    isSystem: false,
    isPublic: params.isPublic || false,
    createdBy: params.createdBy,
  });

  return result.insertId;
}

/**
 * Delete a filter preset
 */
export async function deleteFilterPreset(presetId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  // Can't delete system presets
  const preset = await getFilterPreset(presetId);
  if (preset?.isSystem) {
    return false;
  }

  await db.delete(filterPresets)
    .where(and(
      eq(filterPresets.id, presetId),
      eq(filterPresets.createdBy, userId)
    ));

  return true;
}
