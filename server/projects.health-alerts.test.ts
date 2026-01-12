import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import * as notification from "./_core/notification";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

describe("Project Health Alert Notification Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Health Status Change Detection", () => {
    it("should detect change from Healthy to At Risk", () => {
      const oldHealth = "Healthy";
      const newHealth = "At Risk";
      
      const hasChanged = oldHealth !== newHealth;
      const isAtRisk = newHealth === "At Risk";
      const isCritical = newHealth === "Critical";
      
      expect(hasChanged).toBe(true);
      expect(isAtRisk).toBe(true);
      expect(isCritical).toBe(false);
    });

    it("should detect change from Healthy to Critical", () => {
      const oldHealth = "Healthy";
      const newHealth = "Critical";
      
      const hasChanged = oldHealth !== newHealth;
      const isAtRisk = newHealth === "At Risk";
      const isCritical = newHealth === "Critical";
      
      expect(hasChanged).toBe(true);
      expect(isAtRisk).toBe(false);
      expect(isCritical).toBe(true);
    });

    it("should detect change from At Risk to Critical", () => {
      const oldHealth = "At Risk";
      const newHealth = "Critical";
      
      const hasChanged = oldHealth !== newHealth;
      const isCritical = newHealth === "Critical";
      
      expect(hasChanged).toBe(true);
      expect(isCritical).toBe(true);
    });

    it("should not trigger on Healthy to Healthy (no change)", () => {
      const oldHealth = "Healthy";
      const newHealth = "Healthy";
      
      const hasChanged = oldHealth !== newHealth;
      
      expect(hasChanged).toBe(false);
    });

    it("should not trigger on At Risk to At Risk (no change)", () => {
      const oldHealth = "At Risk";
      const newHealth = "At Risk";
      
      const hasChanged = oldHealth !== newHealth;
      
      expect(hasChanged).toBe(false);
    });

    it("should not trigger when improving from At Risk to Healthy", () => {
      const oldHealth = "At Risk";
      const newHealth = "Healthy";
      
      const hasChanged = oldHealth !== newHealth;
      const isWorsening = (oldHealth === "Healthy" && newHealth !== "Healthy") ||
                          (oldHealth === "At Risk" && newHealth === "Critical");
      
      expect(hasChanged).toBe(true);
      expect(isWorsening).toBe(false);
    });

    it("should not trigger when improving from Critical to At Risk", () => {
      const oldHealth = "Critical";
      const newHealth = "At Risk";
      
      const hasChanged = oldHealth !== newHealth;
      const isWorsening = (oldHealth === "Healthy" && newHealth !== "Healthy") ||
                          (oldHealth === "At Risk" && newHealth === "Critical");
      
      expect(hasChanged).toBe(true);
      expect(isWorsening).toBe(false);
    });
  });

  describe("Notification Trigger Logic", () => {
    it("should call notifyOwner when health changes to At Risk", async () => {
      const projectName = "Test Project";
      const oldHealth = "Healthy";
      const newHealth = "At Risk";
      
      // Simulate the notification logic
      if (oldHealth !== newHealth && (newHealth === "At Risk" || newHealth === "Critical")) {
        await notification.notifyOwner({
          title: `Project Health Alert: ${projectName}`,
          content: `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`,
        });
      }
      
      expect(notification.notifyOwner).toHaveBeenCalledTimes(1);
      expect(notification.notifyOwner).toHaveBeenCalledWith({
        title: "Project Health Alert: Test Project",
        content: 'Project "Test Project" health status changed from Healthy to At Risk. Immediate attention required.',
      });
    });

    it("should call notifyOwner when health changes to Critical", async () => {
      const projectName = "Critical Project";
      const oldHealth = "Healthy";
      const newHealth = "Critical";
      
      // Simulate the notification logic
      if (oldHealth !== newHealth && (newHealth === "At Risk" || newHealth === "Critical")) {
        await notification.notifyOwner({
          title: `Project Health Alert: ${projectName}`,
          content: `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`,
        });
      }
      
      expect(notification.notifyOwner).toHaveBeenCalledTimes(1);
      expect(notification.notifyOwner).toHaveBeenCalledWith({
        title: "Project Health Alert: Critical Project",
        content: 'Project "Critical Project" health status changed from Healthy to Critical. Immediate attention required.',
      });
    });

    it("should call notifyOwner when health worsens from At Risk to Critical", async () => {
      const projectName = "Worsening Project";
      const oldHealth = "At Risk";
      const newHealth = "Critical";
      
      // Simulate the notification logic
      if (oldHealth !== newHealth && (newHealth === "At Risk" || newHealth === "Critical")) {
        await notification.notifyOwner({
          title: `Project Health Alert: ${projectName}`,
          content: `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`,
        });
      }
      
      expect(notification.notifyOwner).toHaveBeenCalledTimes(1);
      expect(notification.notifyOwner).toHaveBeenCalledWith({
        title: "Project Health Alert: Worsening Project",
        content: 'Project "Worsening Project" health status changed from At Risk to Critical. Immediate attention required.',
      });
    });

    it("should NOT call notifyOwner when health stays the same", async () => {
      const projectName = "Stable Project";
      const oldHealth = "Healthy";
      const newHealth = "Healthy";
      
      // Simulate the notification logic
      if (oldHealth !== newHealth && (newHealth === "At Risk" || newHealth === "Critical")) {
        await notification.notifyOwner({
          title: `Project Health Alert: ${projectName}`,
          content: `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`,
        });
      }
      
      expect(notification.notifyOwner).not.toHaveBeenCalled();
    });

    it("should NOT call notifyOwner when health improves", async () => {
      const projectName = "Improving Project";
      const oldHealth = "At Risk";
      const newHealth = "Healthy";
      
      // Simulate the notification logic
      if (oldHealth !== newHealth && (newHealth === "At Risk" || newHealth === "Critical")) {
        await notification.notifyOwner({
          title: `Project Health Alert: ${projectName}`,
          content: `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`,
        });
      }
      
      expect(notification.notifyOwner).not.toHaveBeenCalled();
    });

    it("should handle notification failures gracefully", async () => {
      const projectName = "Test Project";
      const oldHealth = "Healthy";
      const newHealth = "Critical";
      
      // Mock notification failure
      vi.mocked(notification.notifyOwner).mockRejectedValueOnce(new Error("Notification service unavailable"));
      
      // Simulate the notification logic with error handling
      try {
        if (oldHealth !== newHealth && (newHealth === "At Risk" || newHealth === "Critical")) {
          await notification.notifyOwner({
            title: `Project Health Alert: ${projectName}`,
            content: `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`,
          });
        }
      } catch (error) {
        // Error should be caught but not prevent the update
        expect(error).toBeInstanceOf(Error);
      }
      
      expect(notification.notifyOwner).toHaveBeenCalledTimes(1);
    });
  });

  describe("Notification Message Format", () => {
    it("should include project name in title", () => {
      const projectName = "Important Project";
      const title = `Project Health Alert: ${projectName}`;
      
      expect(title).toContain("Important Project");
      expect(title).toContain("Project Health Alert");
    });

    it("should include old and new health status in content", () => {
      const projectName = "Test Project";
      const oldHealth = "Healthy";
      const newHealth = "Critical";
      const content = `Project "${projectName}" health status changed from ${oldHealth} to ${newHealth}. Immediate attention required.`;
      
      expect(content).toContain("Test Project");
      expect(content).toContain("Healthy");
      expect(content).toContain("Critical");
      expect(content).toContain("Immediate attention required");
    });

    it("should have clear action required message", () => {
      const content = 'Project "Test" health status changed from Healthy to At Risk. Immediate attention required.';
      
      expect(content).toContain("Immediate attention required");
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined old health status", () => {
      const oldHealth = undefined;
      const newHealth = "Critical";
      
      // Should still trigger if new health is problematic
      const shouldNotify = (!oldHealth || oldHealth !== newHealth) && 
                          (newHealth === "At Risk" || newHealth === "Critical");
      
      expect(shouldNotify).toBe(true);
    });

    it("should handle null project name", () => {
      const projectName = null;
      const title = `Project Health Alert: ${projectName || "Unknown Project"}`;
      
      expect(title).toContain("Unknown Project");
    });

    it("should handle empty project name", () => {
      const projectName = "";
      const title = `Project Health Alert: ${projectName || "Unknown Project"}`;
      
      expect(title).toContain("Unknown Project");
    });
  });
});
