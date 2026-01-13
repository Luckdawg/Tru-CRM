import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// Mock context for testing
const mockContext = {
  user: { id: 1, name: "Test User", email: "test@example.com", role: "user" as const },
};

describe("Reports & Forecast Tracking", () => {
  const caller = appRouter.createCaller(mockContext);

  describe("Custom Report Builder", () => {
    it("should execute custom report with filters", async () => {
      const result = await caller.reports.executeCustomReport({
        modules: ['accounts', 'opportunities', 'engagement'],
        fields: [],
        filters: [
          { field: 'pipelineValue', operator: '>', value: 1000000 },
          { field: 'engagementScore', operator: '<', value: 40 },
        ],
        sorting: [],
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('rowCount');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("should return available fields for report builder", async () => {
      const fields = await caller.reports.getAvailableFields();

      expect(fields).toBeDefined();
      expect(fields).toHaveProperty('accounts');
      expect(fields).toHaveProperty('opportunities');
      expect(fields).toHaveProperty('engagement');
      expect(Array.isArray(fields.accounts)).toBe(true);
    });

    it("should handle empty filters", async () => {
      const result = await caller.reports.executeCustomReport({
        modules: ['accounts', 'opportunities', 'engagement'],
        fields: [],
        filters: [],
        sorting: [],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("should apply multiple filters correctly", async () => {
      const result = await caller.reports.executeCustomReport({
        modules: ['accounts', 'opportunities', 'engagement'],
        fields: [],
        filters: [
          { field: 'pipelineValue', operator: '>', value: 500000 },
          { field: 'engagementScore', operator: '<', value: 50 },
          { field: 'opportunityCount', operator: '>=', value: 1 },
        ],
        sorting: [],
      });

      expect(result).toBeDefined();
      // All results should match all filters
      result.results.forEach((row: any) => {
        if (row.pipelineValue !== undefined) {
          expect(row.pipelineValue).toBeGreaterThan(500000);
        }
        if (row.engagementScore !== undefined) {
          expect(row.engagementScore).toBeLessThan(50);
        }
        if (row.opportunityCount !== undefined) {
          expect(row.opportunityCount).toBeGreaterThanOrEqual(1);
        }
      });
    });
  });

  describe("Saved Reports", () => {
    it("should save a custom report", async () => {
      const reportId = await caller.reports.saveReport({
        reportName: "Test Report",
        reportType: "Custom",
        category: "Test",
        description: "Test report description",
        queryConfig: { modules: ['accounts'] },
        columns: [],
        filters: [{ field: 'pipelineValue', operator: '>', value: 1000000 }],
      });

      expect(reportId).toBeDefined();
      expect(typeof reportId).toBe('number');
    });

    it("should retrieve saved reports", async () => {
      const reports = await caller.reports.getSavedReports();

      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
    });

    it("should get a specific saved report", async () => {
      // First save a report
      const reportId = await caller.reports.saveReport({
        reportName: "Specific Test Report",
        reportType: "Custom",
        category: "Test",
        queryConfig: { modules: ['accounts'] },
        columns: [],
        filters: [],
      });

      // Then retrieve it
      const report = await caller.reports.getSavedReport({ reportId: Number(reportId) });

      expect(report).toBeDefined();
      if (report) {
        expect(report.reportName).toBe("Specific Test Report");
        expect(report.reportType).toBe("Custom");
      }
    });

    it("should delete a saved report", async () => {
      // First save a report
      const reportId = await caller.reports.saveReport({
        reportName: "Report to Delete",
        reportType: "Custom",
        category: "Test",
        queryConfig: { modules: ['accounts'] },
        columns: [],
        filters: [],
      });

      // Then delete it
      const result = await caller.reports.deleteReport({ reportId: Number(reportId) });

      expect(result).toBe(true);

      // Verify it's deleted
      const deletedReport = await caller.reports.getSavedReport({ reportId: Number(reportId) });
      expect(deletedReport).toBeNull();
    });

    it("should support report scheduling options", async () => {
      const reportId = await caller.reports.saveReport({
        reportName: "Scheduled Report",
        reportType: "Custom",
        category: "Test",
        queryConfig: { modules: ['accounts'] },
        columns: [],
        filters: [],
        scheduleFrequency: "Weekly",
        scheduleDay: 1, // Monday
        scheduleTime: "09:00",
      });

      const report = await caller.reports.getSavedReport({ reportId: Number(reportId) });

      expect(report).toBeDefined();
      if (report) {
        expect(report.scheduleFrequency).toBe("Weekly");
        expect(report.scheduleDay).toBe(1);
        expect(report.scheduleTime).toBe("09:00");
      }
    });
  });

  describe("Report Execution Logging", () => {
    it("should log report execution", async () => {
      // First save a report
      const reportId = await caller.reports.saveReport({
        reportName: "Logged Report",
        reportType: "Custom",
        category: "Test",
        queryConfig: { modules: ['accounts'] },
        columns: [],
        filters: [],
      });

      // Log execution
      const executionId = await caller.reports.logExecution({
        reportId: Number(reportId),
        rowCount: 10,
        executionTimeMs: 150,
        status: "Success",
      });

      expect(executionId).toBeDefined();
      expect(typeof executionId).toBe('number');
    });

    it("should log failed execution with error message", async () => {
      const reportId = await caller.reports.saveReport({
        reportName: "Failed Report",
        reportType: "Custom",
        category: "Test",
        queryConfig: { modules: ['accounts'] },
        columns: [],
        filters: [],
      });

      const executionId = await caller.reports.logExecution({
        reportId: Number(reportId),
        rowCount: 0,
        executionTimeMs: 50,
        status: "Failed",
        errorMessage: "Test error message",
      });

      expect(executionId).toBeDefined();
    });
  });

  describe("Forecast Tracking", () => {
    it("should create a forecast snapshot", async () => {
      const periodStart = new Date('2025-01-01');
      const periodEnd = new Date('2025-01-31');

      const snapshotId = await caller.forecast.createSnapshot({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe('number');
    });

    it("should get all forecast snapshots", async () => {
      const snapshots = await caller.forecast.getAllSnapshots();

      expect(snapshots).toBeDefined();
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it("should get forecast accuracy for a period", async () => {
      const periodStart = new Date('2025-01-01');
      const periodEnd = new Date('2025-01-31');

      // First create a snapshot
      await caller.forecast.createSnapshot({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      // Then get accuracy
      const accuracy = await caller.forecast.getAccuracy({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      // May be null if no snapshot exists
      if (accuracy) {
        expect(accuracy).toHaveProperty('snapshot');
        expect(accuracy).toHaveProperty('actuals');
        expect(accuracy).toHaveProperty('accuracy');
        expect(accuracy).toHaveProperty('stageAccuracy');
      }
    });

    it("should calculate forecast accuracy correctly", async () => {
      const periodStart = new Date('2025-02-01');
      const periodEnd = new Date('2025-02-28');

      await caller.forecast.createSnapshot({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      const accuracy = await caller.forecast.getAccuracy({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      if (accuracy) {
        expect(accuracy.accuracy.forecastAccuracy).toBeGreaterThanOrEqual(0);
        expect(accuracy.accuracy.weightedAccuracy).toBeGreaterThanOrEqual(0);
        expect(typeof accuracy.accuracy.variance).toBe('number');
        expect(typeof accuracy.accuracy.weightedVariance).toBe('number');
      }
    });

    it("should track stage-level accuracy", async () => {
      const periodStart = new Date('2025-03-01');
      const periodEnd = new Date('2025-03-31');

      await caller.forecast.createSnapshot({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      const accuracy = await caller.forecast.getAccuracy({
        periodType: 'Month',
        periodStart,
        periodEnd,
      });

      if (accuracy && accuracy.stageAccuracy) {
        Object.values(accuracy.stageAccuracy).forEach((stageData: any) => {
          expect(stageData).toHaveProperty('forecasted');
          expect(stageData).toHaveProperty('actual');
          expect(stageData).toHaveProperty('accuracy');
          expect(stageData).toHaveProperty('opportunityCount');
          expect(stageData).toHaveProperty('closedCount');
          expect(stageData).toHaveProperty('closeRate');
        });
      }
    });
  });

  describe("Integration Tests", () => {
    it("should execute, save, and retrieve custom report", async () => {
      // Execute report
      const result = await caller.reports.executeCustomReport({
        modules: ['accounts', 'opportunities', 'engagement'],
        fields: [],
        filters: [{ field: 'pipelineValue', operator: '>', value: 1000000 }],
        sorting: [],
      });

      // Save report
      const reportId = await caller.reports.saveReport({
        reportName: "Integration Test Report",
        reportType: "Custom",
        category: "Test",
        queryConfig: { modules: ['accounts', 'opportunities', 'engagement'] },
        columns: [],
        filters: [{ field: 'pipelineValue', operator: '>', value: 1000000 }],
      });

      // Log execution
      await caller.reports.logExecution({
        reportId: Number(reportId),
        rowCount: result.rowCount,
        executionTimeMs: result.executionTime,
        status: "Success",
      });

      // Retrieve report
      const savedReport = await caller.reports.getSavedReport({ reportId: Number(reportId) });

      expect(savedReport).toBeDefined();
      expect(savedReport?.reportName).toBe("Integration Test Report");
    });
  });
});
