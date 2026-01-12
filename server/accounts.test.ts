import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@visium.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Accounts Management", () => {
  it("should create a new account with required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.create({
      accountName: "Acme Corporation",
      industry: "Manufacturing",
      vertical: "Enterprise",
      region: "North America",
      size: 5000,
      website: "https://acme.com",
      phone: "+1 (555) 123-4567",
      description: "Leading manufacturer of industrial equipment",
      ownerId: 1,
    });

    expect(result).toBeDefined();
  });

  it("should list all accounts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const accounts = await caller.accounts.list();
    expect(Array.isArray(accounts)).toBe(true);
  });

  it("should retrieve a specific account by ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an account
    await caller.accounts.create({
      accountName: "Test Account",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      const account = await caller.accounts.get({ id: accounts[0]!.id });
      expect(account).toBeDefined();
      expect(account?.accountName).toBeDefined();
    }
  });

  it("should update an existing account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an account first
    await caller.accounts.create({
      accountName: "Original Name",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      const accountId = accounts[0]!.id;
      
      await caller.accounts.update({
        id: accountId,
        data: {
          accountName: "Updated Name",
          industry: "Healthcare",
        },
      });

      const updated = await caller.accounts.get({ id: accountId });
      expect(updated?.accountName).toBe("Updated Name");
      expect(updated?.industry).toBe("Healthcare");
    }
  });

  it("should delete an account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an account first
    await caller.accounts.create({
      accountName: "To Be Deleted",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      const accountId = accounts[0]!.id;
      
      await caller.accounts.delete({ id: accountId });
      
      const deleted = await caller.accounts.get({ id: accountId });
      expect(deleted).toBeNull();
    }
  });
});

describe("Contacts Management", () => {
  it("should create a new contact linked to an account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account first
    await caller.accounts.create({
      accountName: "Contact Test Account",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      const result = await caller.contacts.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 987-6543",
        title: "CTO",
        accountId: accounts[0]!.id,
        ownerId: 1,
      });

      expect(result).toBeDefined();
    }
  });

  it("should list contacts by account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account
    await caller.accounts.create({
      accountName: "Contact List Test",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      const accountId = accounts[0]!.id;

      // Create multiple contacts
      await caller.contacts.create({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice.smith@example.com",
        accountId,
        ownerId: 1,
      });

      await caller.contacts.create({
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        accountId,
        ownerId: 1,
      });

      const contacts = await caller.contacts.getByAccount({ accountId });
      expect(contacts.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("Opportunities Management", () => {
  it("should create a new opportunity", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account first
    await caller.accounts.create({
      accountName: "Opportunity Test Account",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      const result = await caller.opportunities.create({
        opportunityName: "Q1 Enterprise Deal",
        accountId: accounts[0]!.id,
        stage: "Discovery",
        amount: "250000",
        closeDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        probability: 30,
        type: "New Business",
        ownerId: 1,
      });

      expect(result).toBeDefined();
    }
  });

  it("should retrieve opportunities by stage", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const opportunities = await caller.opportunities.getByStage({ stage: "Discovery" });
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it("should update opportunity stage and probability", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account and opportunity
    await caller.accounts.create({
      accountName: "Stage Update Test",
      ownerId: 1,
    });

    const accounts = await caller.accounts.list();
    if (accounts.length > 0) {
      await caller.opportunities.create({
        opportunityName: "Test Opportunity",
        accountId: accounts[0]!.id,
        stage: "Discovery",
        amount: "100000",
        closeDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        probability: 20,
        ownerId: 1,
      });

      const opportunities = await caller.opportunities.list();
      if (opportunities.length > 0) {
        const oppId = opportunities[0]!.id;

        await caller.opportunities.update({
          id: oppId,
          data: {
            stage: "Solution Fit",
            probability: 50,
          },
        });

        const updated = await caller.opportunities.get({ id: oppId });
        expect(updated?.stage).toBe("Solution Fit");
        expect(updated?.probability).toBe(50);
      }
    }
  });
});

describe("Dashboard Analytics", () => {
  it("should retrieve pipeline data by stage", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const pipelineData = await caller.dashboard.pipelineByStage();
    expect(Array.isArray(pipelineData)).toBe(true);
  });

  it("should retrieve won opportunities", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const wonOpps = await caller.dashboard.wonOpportunities();
    expect(Array.isArray(wonOpps)).toBe(true);
  });

  it("should retrieve lost opportunities", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lostOpps = await caller.dashboard.lostOpportunities();
    expect(Array.isArray(lostOpps)).toBe(true);
  });
});
