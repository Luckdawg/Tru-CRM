import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
  }),
});

export type AppRouter = typeof appRouter;
