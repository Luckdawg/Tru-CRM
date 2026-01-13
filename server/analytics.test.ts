import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { inferProcedureInput } from "@trpc/server";

// Mock context for testing
const mockContext = {
  user: { id: 1, name: "Test User", email: "test@example.com", role: "user" as const },
};

describe("Analytics & Forecasting", () => {
  const caller = appRouter.createCaller(mockContext);

  describe("salesCycleMetrics", () => {
    it("should return sales cycle metrics structure", async () => {
      const result = await caller.analytics.salesCycleMetrics();
      
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("winRate");
        expect(result).toHaveProperty("avgDealSize");
        expect(result).toHaveProperty("avgCycleLength");
        expect(result).toHaveProperty("totalOpportunities");
        expect(result).toHaveProperty("closedWon");
        expect(result).toHaveProperty("closedLost");
        expect(result).toHaveProperty("openOpportunities");
      }
    });

    it("should return numeric values for all metrics", async () => {
      const result = await caller.analytics.salesCycleMetrics();
      
      if (result) {
        expect(typeof result.winRate).toBe("number");
        expect(typeof result.avgDealSize).toBe("number");
        expect(typeof result.avgCycleLength).toBe("number");
        expect(typeof result.totalOpportunities).toBe("number");
        expect(typeof result.closedWon).toBe("number");
        expect(typeof result.closedLost).toBe("number");
        expect(typeof result.openOpportunities).toBe("number");
      }
    });

    it("should calculate win rate correctly", async () => {
      const result = await caller.analytics.salesCycleMetrics();
      
      if (result && result.closedWon + result.closedLost > 0) {
        const expectedWinRate = (result.closedWon / (result.closedWon + result.closedLost)) * 100;
        expect(result.winRate).toBeCloseTo(expectedWinRate, 1);
      }
    });

    it("should accept optional filters", async () => {
      const result = await caller.analytics.salesCycleMetrics({
        ownerId: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });
      
      expect(result).toBeDefined();
    });
  });

  describe("weightedPipelineForecast", () => {
    it("should return weighted forecast structure", async () => {
      const result = await caller.analytics.weightedPipelineForecast();
      
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("totalPipeline");
        expect(result).toHaveProperty("totalWeighted");
        expect(result).toHaveProperty("byStage");
        expect(result).toHaveProperty("opportunityCount");
      }
    });

    it("should return array of stage data", async () => {
      const result = await caller.analytics.weightedPipelineForecast();
      
      if (result) {
        expect(Array.isArray(result.byStage)).toBe(true);
        
        if (result.byStage.length > 0) {
          const firstStage = result.byStage[0];
          expect(firstStage).toHaveProperty("stage");
          expect(firstStage).toHaveProperty("count");
          expect(firstStage).toHaveProperty("totalAmount");
          expect(firstStage).toHaveProperty("weightedAmount");
        }
      }
    });

    it("should have weighted amount less than or equal to total", async () => {
      const result = await caller.analytics.weightedPipelineForecast();
      
      if (result) {
        expect(result.totalWeighted).toBeLessThanOrEqual(result.totalPipeline);
        
        result.byStage.forEach(stage => {
          expect(stage.weightedAmount).toBeLessThanOrEqual(stage.totalAmount);
        });
      }
    });

    it("should accept optional owner filter", async () => {
      const result = await caller.analytics.weightedPipelineForecast({
        ownerId: 1,
      });
      
      expect(result).toBeDefined();
    });
  });

  describe("dealHealthScores", () => {
    it("should return array of health scores", async () => {
      const result = await caller.analytics.dealHealthScores();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct health score structure", async () => {
      const result = await caller.analytics.dealHealthScores();
      
      if (result && result.length > 0) {
        const firstDeal = result[0];
        expect(firstDeal).toHaveProperty("opportunityId");
        expect(firstDeal).toHaveProperty("opportunityName");
        expect(firstDeal).toHaveProperty("stage");
        expect(firstDeal).toHaveProperty("amount");
        expect(firstDeal).toHaveProperty("healthScore");
        expect(firstDeal).toHaveProperty("healthStatus");
        expect(firstDeal).toHaveProperty("factors");
        expect(firstDeal).toHaveProperty("daysToClose");
        expect(firstDeal).toHaveProperty("daysSinceUpdate");
      }
    });

    it("should have valid health scores (0-100)", async () => {
      const result = await caller.analytics.dealHealthScores();
      
      result.forEach(deal => {
        expect(deal.healthScore).toBeGreaterThanOrEqual(0);
        expect(deal.healthScore).toBeLessThanOrEqual(100);
      });
    });

    it("should categorize health status correctly", async () => {
      const result = await caller.analytics.dealHealthScores();
      
      result.forEach(deal => {
        if (deal.healthScore >= 70) {
          expect(deal.healthStatus).toBe("Healthy");
        } else if (deal.healthScore >= 40) {
          expect(deal.healthStatus).toBe("At Risk");
        } else {
          expect(deal.healthStatus).toBe("Critical");
        }
      });
    });

    it("should include factors array", async () => {
      const result = await caller.analytics.dealHealthScores();
      
      result.forEach(deal => {
        expect(Array.isArray(deal.factors)).toBe(true);
        expect(deal.factors.length).toBeGreaterThan(0);
      });
    });

    it("should accept optional owner filter", async () => {
      const result = await caller.analytics.dealHealthScores({
        ownerId: 1,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should have consistent opportunity counts", async () => {
      const metrics = await caller.analytics.salesCycleMetrics();
      const forecast = await caller.analytics.weightedPipelineForecast();
      const healthScores = await caller.analytics.dealHealthScores();
      
      if (metrics && forecast) {
        // Open opportunities in metrics should match forecast count
        expect(metrics.openOpportunities).toBe(forecast.opportunityCount);
        
        // Health scores should only be for open opportunities
        expect(healthScores.length).toBeLessThanOrEqual(metrics.openOpportunities);
      }
    });

    it("should have consistent pipeline values", async () => {
      const forecast = await caller.analytics.weightedPipelineForecast();
      
      if (forecast && forecast.byStage.length > 0) {
        // Sum of stage totals should equal total pipeline
        const stageSum = forecast.byStage.reduce((sum, stage) => sum + stage.totalAmount, 0);
        expect(Math.abs(stageSum - forecast.totalPipeline)).toBeLessThan(0.01); // Allow for rounding
        
        // Sum of weighted amounts should equal total weighted
        const weightedSum = forecast.byStage.reduce((sum, stage) => sum + stage.weightedAmount, 0);
        expect(Math.abs(weightedSum - forecast.totalWeighted)).toBeLessThan(0.01);
      }
    });
  });
});
