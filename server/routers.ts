import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { leads, emailConnections } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),
  }),

  accounts: router({
    list: protectedProcedure
      .input(z.object({ ownerId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllAccounts(input?.ownerId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccountById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        accountName: z.string().min(1),
        industry: z.enum([
          "Utilities", "Manufacturing", "Public Sector", "Healthcare", 
          "Financial Services", "Telecommunications", "Energy", "Transportation", "Other"
        ]).optional(),
        size: z.number().optional(),
        region: z.enum([
          "North America", "South America", "Europe", "Asia Pacific", "Middle East", "Africa"
        ]).optional(),
        vertical: z.enum(["Enterprise", "Mid-Market", "SMB", "Government", "Defense"]).optional(),
        securityPosture: z.enum(["Immature", "Developing", "Mature", "Advanced"]).optional(),
        installedTechnologies: z.string().optional(),
        parentAccountId: z.number().optional(),
        website: z.string().optional(),
        phone: z.string().optional(),
        billingAddress: z.string().optional(),
        shippingAddress: z.string().optional(),
        description: z.string().optional(),
        ownerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.createAccount(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          accountName: z.string().optional(),
          industry: z.enum([
            "Utilities", "Manufacturing", "Public Sector", "Healthcare", 
            "Financial Services", "Telecommunications", "Energy", "Transportation", "Other"
          ]).optional(),
          size: z.number().optional(),
          region: z.enum([
            "North America", "South America", "Europe", "Asia Pacific", "Middle East", "Africa"
          ]).optional(),
          vertical: z.enum(["Enterprise", "Mid-Market", "SMB", "Government", "Defense"]).optional(),
          securityPosture: z.enum(["Immature", "Developing", "Mature", "Advanced"]).optional(),
          installedTechnologies: z.string().optional(),
          parentAccountId: z.number().optional(),
          website: z.string().optional(),
          phone: z.string().optional(),
          billingAddress: z.string().optional(),
          shippingAddress: z.string().optional(),
          description: z.string().optional(),
          ownerId: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateAccount(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteAccount(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchAccounts(input.searchTerm);
      }),
    
    getChildren: protectedProcedure
      .input(z.object({ parentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getChildAccounts(input.parentId);
      }),
  }),

  contacts: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllContacts();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactById(input.id);
      }),
    
    getByAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactsByAccount(input.accountId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        role: z.enum([
          "CISO", "CIO", "CTO", "Security Architect", "OT Engineer", 
          "IT Manager", "Procurement", "Executive", "Partner Rep", "Other"
        ]).optional(),
        accountId: z.number(),
        title: z.string().optional(),
        department: z.string().optional(),
        isPrimary: z.boolean().optional(),
        linkedInUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createContact(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          role: z.enum([
            "CISO", "CIO", "CTO", "Security Architect", "OT Engineer", 
            "IT Manager", "Procurement", "Executive", "Partner Rep", "Other"
          ]).optional(),
          accountId: z.number().optional(),
          title: z.string().optional(),
          department: z.string().optional(),
          isPrimary: z.boolean().optional(),
          linkedInUrl: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateContact(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteContact(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchContacts(input.searchTerm);
      }),
  }),

  leads: router({
    list: protectedProcedure
      .input(z.object({ assignedTo: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllLeads(input?.assignedTo);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeadById(input.id);
      }),
    
    getByStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        return await db.getLeadsByStatus(input.status);
      }),
    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().min(1),
        title: z.string().optional(),
        leadSource: z.enum([
          "Website", "Trade Show", "Partner Referral", "Cold Outreach", 
          "Webinar", "Content Download", "Social Media", "Other"
        ]),
        campaignId: z.number().optional(),
        score: z.number().optional(),
        segment: z.enum(["Enterprise", "Mid-Market", "SMB"]).optional(),
        status: z.enum(["New", "Working", "Qualified", "Disqualified", "Converted"]).optional(),
        industry: z.string().optional(),
        region: z.string().optional(),
        estimatedBudget: z.string().optional(),
        timeline: z.string().optional(),
        painPoints: z.string().optional(),
        assignedTo: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createLead(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          title: z.string().optional(),
          leadSource: z.enum([
            "Website", "Trade Show", "Partner Referral", "Cold Outreach", 
            "Webinar", "Content Download", "Social Media", "Other"
          ]).optional(),
          score: z.number().optional(),
          segment: z.enum(["Enterprise", "Mid-Market", "SMB"]).optional(),
          status: z.enum(["New", "Working", "Qualified", "Disqualified", "Converted"]).optional(),
          industry: z.string().optional(),
          region: z.string().optional(),
          estimatedBudget: z.string().optional(),
          timeline: z.string().optional(),
          painPoints: z.string().optional(),
          assignedTo: z.number().optional(),
          disqualificationReason: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateLead(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteLead(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchLeads(input.searchTerm);
      }),

    convertToOpportunity: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead) {
          throw new Error("Lead not found");
        }

        // Create or find account
        let accountId: number;
        const existingAccounts = await db.getAllAccounts();
        const existingAccount = existingAccounts.find(
          (a: any) => a.accountName?.toLowerCase() === lead.company?.toLowerCase()
        );

        if (existingAccount) {
          accountId = existingAccount.id;
        } else {
          const newAccount = await db.createAccount({
            accountName: lead.company || "Unknown Company",
            ownerId: 1, // Default owner
          });
          accountId = newAccount?.id || 0;
        }

        // Create contact
        await db.createContact({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || undefined,
          accountId,
        });

        // Get the newly created contact ID
        const contacts = await db.getContactsByAccount(accountId);
        const contact = contacts[contacts.length - 1];

        // Create opportunity
        const closeDate = new Date();
        closeDate.setMonth(closeDate.getMonth() + 3); // 3 months from now
        
        await db.createOpportunity({
          opportunityName: `${lead.company} - ${lead.firstName} ${lead.lastName}`,
          accountId,
          stage: "Discovery",
          amount: "0",
          closeDate,
          ownerId: 1, // Default owner
        });

        // Get the newly created opportunity ID
        const opportunities = await db.getOpportunitiesByAccount(accountId);
        const opportunity = opportunities[opportunities.length - 1];

        // Update lead status to Converted
        await db.updateLead(input.leadId, { status: "Converted" });

        return {
          success: true,
          accountId,
          contactId: contact?.id || 0,
          opportunityId: opportunity?.id || 0,
        };
      }),
  }),

  products: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        productName: z.string().min(1),
        productCode: z.string().optional(),
        description: z.string().optional(),
        category: z.enum([
          "Platform License", "Professional Services", "Training", "Support", "Custom Development"
        ]).optional(),
        listPrice: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProduct(input);
      }),
  }),

  opportunities: router({
    list: protectedProcedure
      .input(z.object({ ownerId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllOpportunities(input?.ownerId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getOpportunityById(input.id);
      }),
    
    getByStage: protectedProcedure
      .input(z.object({ stage: z.string() }))
      .query(async ({ input }) => {
        return await db.getOpportunitiesByStage(input.stage);
      }),
    
    getByAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOpportunitiesByAccount(input.accountId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        opportunityName: z.string().min(1),
        accountId: z.number(),
        stage: z.enum([
          "Discovery", "Solution Fit", "PoC/Trial", "Security Review", 
          "Procurement", "Verbal Commit", "Closed Won", "Closed Lost"
        ]).optional(),
        amount: z.string(),
        closeDate: z.date(),
        probability: z.number().optional(),
        type: z.enum(["New Business", "Expansion", "Renewal"]).optional(),
        metrics: z.string().optional(),
        economicBuyerId: z.number().optional(),
        decisionProcess: z.string().optional(),
        decisionCriteria: z.string().optional(),
        identifiedPain: z.string().optional(),
        championId: z.number().optional(),
        competition: z.string().optional(),
        nextSteps: z.string().optional(),
        ownerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.createOpportunity(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          opportunityName: z.string().optional(),
          accountId: z.number().optional(),
          stage: z.enum([
            "Discovery", "Solution Fit", "PoC/Trial", "Security Review", 
            "Procurement", "Verbal Commit", "Closed Won", "Closed Lost"
          ]).optional(),
          amount: z.string().optional(),
          closeDate: z.date().optional(),
          probability: z.number().optional(),
          type: z.enum(["New Business", "Expansion", "Renewal"]).optional(),
          metrics: z.string().optional(),
          economicBuyerId: z.number().optional(),
          decisionProcess: z.string().optional(),
          decisionCriteria: z.string().optional(),
          identifiedPain: z.string().optional(),
          championId: z.number().optional(),
          competition: z.string().optional(),
          nextSteps: z.string().optional(),
          lossReason: z.string().optional(),
          closedAt: z.date().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateOpportunity(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteOpportunity(input.id);
      }),
  }),

  lineItems: router({
    getByOpportunity: protectedProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLineItemsByOpportunity(input.opportunityId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        opportunityId: z.number(),
        productId: z.number(),
        quantity: z.number(),
        unitPrice: z.string(),
        discount: z.string().optional(),
        totalPrice: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createLineItem(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          quantity: z.number().optional(),
          unitPrice: z.string().optional(),
          discount: z.string().optional(),
          totalPrice: z.string().optional(),
          description: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateLineItem(input.id, input.data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteLineItem(input.id);
      }),
  }),

  activities: router({
    list: protectedProcedure
      .input(z.object({ ownerId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllActivities(input?.ownerId);
      }),
    
    getByRelated: protectedProcedure
      .input(z.object({ 
        relatedToType: z.enum(["Account", "Contact", "Lead", "Opportunity"]),
        relatedToId: z.number() 
      }))
      .query(async ({ input }) => {
        return await db.getActivitiesByRelated(input.relatedToType, input.relatedToId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        subject: z.string().min(1),
        type: z.enum(["Call", "Email", "Meeting", "Demo", "PoC Milestone", "Task", "Note"]),
        activityDate: z.date(),
        duration: z.number().optional(),
        relatedToType: z.enum(["Account", "Contact", "Lead", "Opportunity"]),
        relatedToId: z.number(),
        notes: z.string().optional(),
        outcome: z.string().optional(),
        ownerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.createActivity(input);
      }),
  }),

  projects: router({
    list: protectedProcedure
      .input(z.object({ ownerId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllProjects(input?.ownerId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),
    
    getByAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectsByAccount(input.accountId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectName: z.string().min(1),
        accountId: z.number(),
        opportunityId: z.number().optional(),
        status: z.enum(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
        goLiveDate: z.date().optional(),
        healthStatus: z.enum(["Healthy", "At Risk", "Critical"]).optional(),
        adoptionLevel: z.enum(["Low", "Medium", "High"]).optional(),
        activeUsers: z.number().optional(),
        customerSentiment: z.enum(["Positive", "Neutral", "Negative"]).optional(),
        notes: z.string().optional(),
        ownerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProject(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          projectName: z.string().optional(),
          status: z.enum(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
          goLiveDate: z.date().optional(),
          actualGoLiveDate: z.date().optional(),
          healthStatus: z.enum(["Healthy", "At Risk", "Critical"]).optional(),
          adoptionLevel: z.enum(["Low", "Medium", "High"]).optional(),
          activeUsers: z.number().optional(),
          customerSentiment: z.enum(["Positive", "Neutral", "Negative"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateProject(input.id, input.data);
      }),
  }),

  cases: router({
    list: protectedProcedure
      .input(z.object({ ownerId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllCases(input?.ownerId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseById(input.id);
      }),
    
    getByAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCasesByAccount(input.accountId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        caseNumber: z.string().min(1),
        subject: z.string().min(1),
        accountId: z.number(),
        contactId: z.number().optional(),
        status: z.enum(["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"]).optional(),
        priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
        type: z.enum(["Technical Issue", "Feature Request", "Question", "Bug Report"]).optional(),
        description: z.string().optional(),
        ownerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCase(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          subject: z.string().optional(),
          status: z.enum(["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"]).optional(),
          priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
          type: z.enum(["Technical Issue", "Feature Request", "Question", "Bug Report"]).optional(),
          description: z.string().optional(),
          resolution: z.string().optional(),
          resolvedAt: z.date().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCase(input.id, input.data);
      }),
  }),

  dashboard: router({
    pipelineByStage: protectedProcedure.query(async () => {
      return await db.getPipelineByStage();
    }),
    
    wonOpportunities: protectedProcedure.query(async () => {
      return await db.getWonOpportunities();
    }),
    
    lostOpportunities: protectedProcedure.query(async () => {
      return await db.getLostOpportunities();
    }),
    
    activeAccountsCount: protectedProcedure.query(async () => {
      return await db.getActiveAccountsCount();
    }),
    
    winRate: protectedProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getWinRate(input?.days || 90);
      }),
    
    averageDealSize: protectedProcedure.query(async () => {
      return await db.getAverageDealSize();
    }),
  }),

  // Lead scoring automation
  leadScoring: router({
    calculateScore: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const lead = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
        if (!lead.length) throw new Error("Lead not found");

        const leadData = lead[0];
        let score = 0;

        // Scoring rules
        // Company size/segment
        if (leadData.segment === "Enterprise") score += 30;
        else if (leadData.segment === "Mid-Market") score += 20;
        else if (leadData.segment === "SMB") score += 10;

        // Lead source quality
        if (leadData.leadSource === "Partner Referral") score += 25;
        else if (leadData.leadSource === "Trade Show") score += 20;
        else if (leadData.leadSource === "Webinar") score += 15;
        else if (leadData.leadSource === "Website") score += 10;
        else score += 5;

        // Engagement indicators
        if (leadData.title && ["CISO", "CIO", "CTO", "VP"].some(t => leadData.title?.includes(t))) {
          score += 25; // Decision maker
        }

        // Industry fit
        const highValueIndustries = ["Manufacturing", "Energy", "Utilities", "Transportation"];
        if (leadData.industry && highValueIndustries.some(i => leadData.industry?.includes(i))) {
          score += 20;
        }

        // Update lead score
        await db.update(leads)
          .set({ score, updatedAt: new Date() })
          .where(eq(leads.id, input.leadId));

        return { leadId: input.leadId, score };
      }),

    autoScore: publicProcedure
      .mutation(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const allLeads = await db.select().from(leads).where(eq(leads.status, "New"));
        let scored = 0;

        for (const lead of allLeads) {
          let score = 0;

          if (lead.segment === "Enterprise") score += 30;
          else if (lead.segment === "Mid-Market") score += 20;
          else if (lead.segment === "SMB") score += 10;

          if (lead.leadSource === "Partner Referral") score += 25;
          else if (lead.leadSource === "Trade Show") score += 20;
          else if (lead.leadSource === "Webinar") score += 15;
          else if (lead.leadSource === "Website") score += 10;
          else score += 5;

          if (lead.title && ["CISO", "CIO", "CTO", "VP"].some(t => lead.title?.includes(t))) {
            score += 25;
          }

          const highValueIndustries = ["Manufacturing", "Energy", "Utilities", "Transportation"];
          if (lead.industry && highValueIndustries.some(i => lead.industry?.includes(i))) {
            score += 20;
          }

          await db.update(leads)
            .set({ score, updatedAt: new Date() })
            .where(eq(leads.id, lead.id));

          scored++;
        }

        return { scored };
      }),
  }),

  // Email integration
  email: router({
    // Get user's email connections
    connections: protectedProcedure.query(async ({ ctx }) => {
      return await db.getEmailConnectionsByUser(ctx.user.id);
    }),

    // Sync emails from connected provider
    syncEmails: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const connection = await db.getEmailConnectionById(input.connectionId);
        if (!connection || connection.userId !== ctx.user.id) {
          throw new Error("Connection not found or unauthorized");
        }

        const { GmailSync, OutlookSync, createActivityFromEmail } = await import('./emailSync');
        
        let emails: any[] = [];
        let createdCount = 0;

        if (connection.provider === "Gmail") {
          const sync = new GmailSync(connection.accessToken, connection.refreshToken || undefined);
          emails = await sync.fetchEmails(50);
        } else if (connection.provider === "Outlook") {
          const sync = new OutlookSync(connection.accessToken);
          emails = await sync.fetchEmails(50);
        }

        // Create activities from emails
        for (const email of emails) {
          const isInbound = !email.labelIds?.includes('SENT'); // Gmail specific
          const activityId = await createActivityFromEmail(
            email,
            connection.provider,
            ctx.user.id,
            isInbound
          );
          if (activityId) createdCount++;
        }

        // Update last sync time
        await db.updateEmailConnection(connection.id, {
          lastSyncAt: new Date(),
        });

        return { synced: emails.length, created: createdCount };
      }),

    // Sync calendar events
    syncCalendar: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const connection = await db.getEmailConnectionById(input.connectionId);
        if (!connection || connection.userId !== ctx.user.id) {
          throw new Error("Connection not found or unauthorized");
        }

        const { GmailSync, OutlookSync, createActivityFromCalendarEvent } = await import('./emailSync');
        
        let events: any[] = [];
        let createdCount = 0;

        if (connection.provider === "Gmail") {
          const sync = new GmailSync(connection.accessToken, connection.refreshToken || undefined);
          events = await sync.fetchCalendarEvents(50);
        } else if (connection.provider === "Outlook") {
          const sync = new OutlookSync(connection.accessToken);
          events = await sync.fetchCalendarEvents(50);
        }

        // Create activities from calendar events
        for (const event of events) {
          const activityId = await createActivityFromCalendarEvent(
            event,
            connection.provider,
            ctx.user.id
          );
          if (activityId) createdCount++;
        }

        return { synced: events.length, created: createdCount };
      }),

    // Delete email connection
    deleteConnection: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const connection = await db.getEmailConnectionById(input.connectionId);
        if (!connection || connection.userId !== ctx.user.id) {
          throw new Error("Connection not found or unauthorized");
         }
        return await db.deleteEmailConnection(input.connectionId);
      }),
  }),

  // Manual webhook renewal endpoint (for testing and manual triggers)
  webhookRenewal: router({
    renewAll: protectedProcedure.mutation(async () => {
      const { renewAllWebhooks } = await import('./webhookRenewal');
      const results = await renewAllWebhooks();
      
      return {
        success: true,
        results: {
          gmail: {
            success: results.gmail.success,
            failed: results.gmail.failed,
            errors: results.gmail.errors,
          },
          outlook: {
            success: results.outlook.success,
            failed: results.outlook.failed,
            errors: results.outlook.errors,
          },
        },
      };
    }),
    
    getStatus: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) {
        return { connections: [] };
      }
      
      const connections = await db
        .select({
          id: emailConnections.id,
          provider: emailConnections.provider,
          email: emailConnections.email,
          webhookExpiry: emailConnections.webhookExpiry,
          lastSyncAt: emailConnections.lastSyncAt,
          isActive: emailConnections.isActive,
        })
        .from(emailConnections)
        .where(eq(emailConnections.isActive, 1));
      
      return {
        connections: connections.map(conn => ({
          ...conn,
          needsRenewal: conn.webhookExpiry ? new Date(conn.webhookExpiry) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : true,
          daysUntilExpiry: conn.webhookExpiry 
            ? Math.ceil((new Date(conn.webhookExpiry).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            : null,
        })),
      };
    }),
   }),

});
