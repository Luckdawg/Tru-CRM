import { eq, and, or, desc, asc, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  accounts, 
  contacts, 
  leads, 
  opportunities, 
  activities,
  projects,
  cases,
  products,
  lineItems,
  InsertAccount,
  InsertContact,
  InsertLead,
  InsertOpportunity,
  InsertActivity,
  InsertProject,
  InsertCase,
  InsertProduct,
  InsertLineItem
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
  
  return await db.insert(projects).values(project);
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
