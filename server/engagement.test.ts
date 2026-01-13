import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// Mock context for testing
const mockContext = {
  user: { id: 1, name: "Test User", email: "test@example.com", role: "user" as const },
};

describe("Engagement Tracking", () => {
  const caller = appRouter.createCaller(mockContext);

  describe("activityTimeline", () => {
    it("should return activity timeline for account", async () => {
      const result = await caller.engagement.activityTimeline({
        accountId: 1,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return activity timeline for contact", async () => {
      const result = await caller.engagement.activityTimeline({
        contactId: 1,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return activity timeline for opportunity", async () => {
      const result = await caller.engagement.activityTimeline({
        opportunityId: 1,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct activity structure", async () => {
      const result = await caller.engagement.activityTimeline({
        accountId: 1,
        limit: 10,
      });
      
      if (result.length > 0) {
        const activity = result[0];
        expect(activity).toHaveProperty("id");
        expect(activity).toHaveProperty("type");
        expect(activity).toHaveProperty("subject");
        expect(activity).toHaveProperty("activityDate");
        expect(activity).toHaveProperty("relatedToType");
        expect(activity).toHaveProperty("relatedToId");
      }
    });

    it("should respect limit parameter", async () => {
      const result = await caller.engagement.activityTimeline({
        accountId: 1,
        limit: 5,
      });
      
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should return empty array when no entity specified", async () => {
      const result = await caller.engagement.activityTimeline({});
      
      expect(result).toEqual([]);
    });
  });

  describe("accountEngagementScore", () => {
    it("should return engagement score structure", async () => {
      const result = await caller.engagement.accountEngagementScore({
        accountId: 1,
      });
      
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("accountId");
        expect(result).toHaveProperty("engagementScore");
        expect(result).toHaveProperty("engagementLevel");
        expect(result).toHaveProperty("factors");
        expect(result).toHaveProperty("activityCount");
        expect(result).toHaveProperty("activityTypes");
        expect(result).toHaveProperty("lastActivityDate");
      }
    });

    it("should have valid engagement score (0-100)", async () => {
      const result = await caller.engagement.accountEngagementScore({
        accountId: 1,
      });
      
      if (result) {
        expect(result.engagementScore).toBeGreaterThanOrEqual(0);
        expect(result.engagementScore).toBeLessThanOrEqual(100);
      }
    });

    it("should categorize engagement level correctly", async () => {
      const result = await caller.engagement.accountEngagementScore({
        accountId: 1,
      });
      
      if (result) {
        if (result.engagementScore >= 70) {
          expect(result.engagementLevel).toBe("High");
        } else if (result.engagementScore >= 40) {
          expect(result.engagementLevel).toBe("Medium");
        } else {
          expect(result.engagementLevel).toBe("Low");
        }
      }
    });

    it("should include factors array", async () => {
      const result = await caller.engagement.accountEngagementScore({
        accountId: 1,
      });
      
      if (result) {
        expect(Array.isArray(result.factors)).toBe(true);
        expect(result.factors.length).toBeGreaterThan(0);
      }
    });

    it("should include activity types array", async () => {
      const result = await caller.engagement.accountEngagementScore({
        accountId: 1,
      });
      
      if (result) {
        expect(Array.isArray(result.activityTypes)).toBe(true);
      }
    });
  });

  describe("allAccountEngagementScores", () => {
    it("should return array of engagement scores", { timeout: 15000 }, async () => {
      const result = await caller.engagement.allAccountEngagementScores();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct structure for each account", async () => {
      const result = await caller.engagement.allAccountEngagementScores();
      
      if (result.length > 0) {
        const account = result[0];
        expect(account).toHaveProperty("id");
        expect(account).toHaveProperty("accountName");
        expect(account).toHaveProperty("engagementScore");
        expect(account).toHaveProperty("engagementLevel");
        expect(account).toHaveProperty("factors");
      }
    });

    it("should sort by engagement score descending", async () => {
      const result = await caller.engagement.allAccountEngagementScores();
      
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const currentScore = result[i].engagementScore || 0;
          const nextScore = result[i + 1].engagementScore || 0;
          expect(currentScore).toBeGreaterThanOrEqual(nextScore);
        }
      }
    });

    it("should accept optional owner filter", async () => {
      const result = await caller.engagement.allAccountEngagementScores({
        ownerId: 1,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have valid engagement scores for all accounts", async () => {
      const result = await caller.engagement.allAccountEngagementScores();
      
      result.forEach(account => {
        if (account.engagementScore !== undefined) {
          expect(account.engagementScore).toBeGreaterThanOrEqual(0);
          expect(account.engagementScore).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe("Integration Tests", () => {
    it("should have consistent activity counts", async () => {
      const accountId = 1;
      
      const timeline = await caller.engagement.activityTimeline({
        accountId,
        limit: 1000, // Get all activities
      });
      
      const engagementScore = await caller.engagement.accountEngagementScore({
        accountId,
      });
      
      // Timeline should include activities from last 90 days and before
      // Engagement score only counts last 90 days
      if (engagementScore) {
        expect(timeline.length).toBeGreaterThanOrEqual(engagementScore.activityCount);
      }
    });

    it("should reflect activity types in engagement score", async () => {
      const accountId = 1;
      
      const timeline = await caller.engagement.activityTimeline({
        accountId,
        limit: 1000,
      });
      
      const engagementScore = await caller.engagement.accountEngagementScore({
        accountId,
      });
      
      if (engagementScore && timeline.length > 0) {
        // Activity types in score should be subset of timeline types
        const timelineTypes = new Set(timeline.map(a => a.type));
        engagementScore.activityTypes.forEach(type => {
          expect(timelineTypes.has(type)).toBe(true);
        });
      }
    });
  });
});
