import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@visium.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Lead Scoring Automation", () => {
  it("should calculate score for enterprise lead with partner referral", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a high-value lead
    const lead = await caller.leads.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@enterprise.com",
      company: "Enterprise Corp",
      title: "CISO",
      leadSource: "Partner Referral",
      segment: "Enterprise",
      industry: "Manufacturing",
      phone: "555-1234",
    });

    // Calculate score
    const result = await caller.leadScoring.calculateScore({ leadId: lead.id });

    // Enterprise (30) + Partner Referral (25) + CISO title (25) + Manufacturing (20) = 100
    expect(result.score).toBe(100);
    expect(result.leadId).toBe(lead.id);
  });

  it("should calculate lower score for SMB lead from website", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lead = await caller.leads.create({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@smallbiz.com",
      company: "Small Business Inc",
      title: "Manager",
      leadSource: "Website",
      segment: "SMB",
      industry: "Retail",
      phone: "555-5678",
    });

    const result = await caller.leadScoring.calculateScore({ leadId: lead.id });

    // SMB (10) + Website (10) = 20
    expect(result.score).toBe(20);
  });

  it("should handle mid-market lead with trade show source", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lead = await caller.leads.create({
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob@midmarket.com",
      company: "Mid Market Solutions",
      title: "VP Engineering",
      leadSource: "Trade Show",
      segment: "Mid-Market",
      industry: "Energy",
      phone: "555-9999",
    });

    const result = await caller.leadScoring.calculateScore({ leadId: lead.id });

    // Mid-Market (20) + Trade Show (20) + VP title (25) + Energy (20) = 85
    expect(result.score).toBe(85);
  });
});

describe("Opportunity Analytics", () => {
  it("should calculate total pipeline value correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const account = await caller.accounts.create({
      accountName: "Test Account",
      industry: "Manufacturing",
      region: "North America",
      ownerId: 1,
    });

    await caller.opportunities.create({
      opportunityName: "Deal 1",
      accountId: account.id,
      amount: "100000",
      closeDate: new Date("2026-06-01"),
      stage: "Discovery",
      probability: 25,
      ownerId: 1,
    });

    await caller.opportunities.create({
      opportunityName: "Deal 2",
      accountId: account.id,
      amount: "250000",
      closeDate: new Date("2026-07-01"),
      stage: "Solution Fit",
      probability: 50,
      ownerId: 1,
    });

    const opportunities = await caller.opportunities.list();
    const totalValue = opportunities.reduce((sum, opp) => sum + parseFloat(opp.amount), 0);

    // Test passes if we have at least the two opportunities we created
    expect(totalValue).toBeGreaterThanOrEqual(350000);
    expect(opportunities.length).toBeGreaterThanOrEqual(2);
  });

  it("should track won and lost opportunities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const wonOpps = await caller.dashboard.wonOpportunities();
    const lostOpps = await caller.dashboard.lostOpportunities();

    expect(Array.isArray(wonOpps)).toBe(true);
    expect(Array.isArray(lostOpps)).toBe(true);
  });
});
