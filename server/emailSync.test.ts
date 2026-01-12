import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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

describe("Email Integration", () => {
  it("should list email connections for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const connections = await caller.email.connections();
    
    expect(Array.isArray(connections)).toBe(true);
    // Initially should be empty
    expect(connections.length).toBe(0);
  });

  it("should handle activity list query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.activities.list();
    
    expect(Array.isArray(activities)).toBe(true);
  });

  it("should handle activity list query with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.activities.list({
      relatedToType: "Account",
      relatedToId: 1,
    });
    
    expect(Array.isArray(activities)).toBe(true);
  });
});

describe("Email Sync Service", () => {
  it("should match email to CRM contact", async () => {
    const { matchEmailToCRM } = await import("./emailSync");
    
    // This will return null since we don't have test data
    const match = await matchEmailToCRM("nonexistent@example.com");
    
    expect(match.type).toBeNull();
    expect(match.id).toBeNull();
  });
});
