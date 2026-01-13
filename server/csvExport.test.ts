import { describe, it, expect } from "vitest";
import {
  arrayToCSV,
  formatDateForCSV,
  formatDateTimeForCSV,
  formatCurrencyForCSV,
  accountCSVColumns,
  opportunityCSVColumns,
  leadCSVColumns,
} from "./csvExport";

describe("CSV Export Utilities", () => {
  describe("arrayToCSV", () => {
    it("should convert simple array to CSV", () => {
      const data = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];
      const columns = [
        { header: "Name", key: "name" },
        { header: "Age", key: "age" },
      ];
      
      const result = arrayToCSV(data, columns);
      expect(result).toContain("Name,Age");
      expect(result).toContain("John,30");
      expect(result).toContain("Jane,25");
    });

    it("should handle empty array", () => {
      const data: any[] = [];
      const columns = [
        { header: "Name", key: "name" },
        { header: "Age", key: "age" },
      ];
      
      const result = arrayToCSV(data, columns);
      expect(result).toBe("Name,Age");
    });

    it("should escape commas in values", () => {
      const data = [
        { name: "Doe, John", company: "Acme Corp" },
      ];
      const columns = [
        { header: "Name", key: "name" },
        { header: "Company", key: "company" },
      ];
      
      const result = arrayToCSV(data, columns);
      expect(result).toContain('"Doe, John"');
    });

    it("should escape quotes in values", () => {
      const data = [
        { name: 'John "Johnny" Doe', company: "Acme" },
      ];
      const columns = [
        { header: "Name", key: "name" },
        { header: "Company", key: "company" },
      ];
      
      const result = arrayToCSV(data, columns);
      expect(result).toContain('"John ""Johnny"" Doe"');
    });

    it("should handle null and undefined values", () => {
      const data = [
        { name: "John", age: null, email: undefined },
      ];
      const columns = [
        { header: "Name", key: "name" },
        { header: "Age", key: "age" },
        { header: "Email", key: "email" },
      ];
      
      const result = arrayToCSV(data, columns);
      expect(result).toContain("John,,");
    });

    it("should apply custom formatters", () => {
      const data = [
        { name: "John", amount: 1000.5 },
      ];
      const columns = [
        { header: "Name", key: "name" },
        { header: "Amount", key: "amount", formatter: (v) => `$${v.toFixed(2)}` },
      ];
      
      const result = arrayToCSV(data, columns);
      expect(result).toContain("$1000.50");
    });
  });

  describe("formatDateForCSV", () => {
    it("should format date to YYYY-MM-DD", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const result = formatDateForCSV(date);
      expect(result).toBe("2024-01-15");
    });

    it("should handle null date", () => {
      const result = formatDateForCSV(null);
      expect(result).toBe("");
    });

    it("should handle undefined date", () => {
      const result = formatDateForCSV(undefined);
      expect(result).toBe("");
    });
  });

  describe("formatDateTimeForCSV", () => {
    it("should format datetime to YYYY-MM-DD HH:mm:ss", () => {
      const date = new Date("2024-01-15T10:30:45Z");
      const result = formatDateTimeForCSV(date);
      expect(result).toBe("2024-01-15 10:30:45");
    });

    it("should handle null datetime", () => {
      const result = formatDateTimeForCSV(null);
      expect(result).toBe("");
    });
  });

  describe("formatCurrencyForCSV", () => {
    it("should format currency to 2 decimal places", () => {
      const result = formatCurrencyForCSV(1000.5);
      expect(result).toBe("1000.50");
    });

    it("should handle null amount", () => {
      const result = formatCurrencyForCSV(null);
      expect(result).toBe("");
    });

    it("should handle zero", () => {
      const result = formatCurrencyForCSV(0);
      expect(result).toBe("0.00");
    });

    it("should handle large numbers", () => {
      const result = formatCurrencyForCSV(1234567.89);
      expect(result).toBe("1234567.89");
    });
  });

  describe("CSV Column Definitions", () => {
    it("should have correct account CSV columns", () => {
      expect(accountCSVColumns).toBeDefined();
      expect(accountCSVColumns.length).toBeGreaterThan(0);
      expect(accountCSVColumns[0].header).toBe("ID");
      expect(accountCSVColumns[1].header).toBe("Account Name");
    });

    it("should have correct opportunity CSV columns", () => {
      expect(opportunityCSVColumns).toBeDefined();
      expect(opportunityCSVColumns.length).toBeGreaterThan(0);
      expect(opportunityCSVColumns[0].header).toBe("ID");
      expect(opportunityCSVColumns[1].header).toBe("Opportunity Name");
    });

    it("should have correct lead CSV columns", () => {
      expect(leadCSVColumns).toBeDefined();
      expect(leadCSVColumns.length).toBeGreaterThan(0);
      expect(leadCSVColumns[0].header).toBe("ID");
      expect(leadCSVColumns[1].header).toBe("First Name");
    });
  });

  describe("Integration Tests", () => {
    it("should export account data correctly", () => {
      const accounts = [
        {
          id: 1,
          accountName: "Acme Corp",
          industry: "Manufacturing",
          size: 500,
          region: "North America",
          vertical: "Enterprise",
          securityPosture: "Mature",
          website: "https://acme.com",
          phone: "+1-555-1234",
          description: "Leading manufacturer",
          ownerId: 1,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-15T00:00:00Z"),
        },
      ];
      
      const result = arrayToCSV(accounts, accountCSVColumns);
      expect(result).toContain("Acme Corp");
      expect(result).toContain("Manufacturing");
      expect(result).toContain("500");
      expect(result).toContain("2024-01-01");
    });

    it("should export opportunity data correctly", () => {
      const opportunities = [
        {
          id: 1,
          opportunityName: "Enterprise Deal",
          accountId: 1,
          accountName: "Acme Corp",
          stage: "Discovery",
          amount: 50000,
          probability: 10,
          type: "New Business",
          closeDate: new Date("2024-06-30"),
          nextSteps: "Schedule demo",
          metrics: "Reduce costs by 30%",
          economicBuyerId: 1,
          decisionCriteria: "ROI and security",
          decisionProcess: "Board approval required",
          identifiedPain: "Manual processes",
          championId: 2,
          ownerId: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        },
      ];
      
      const result = arrayToCSV(opportunities, opportunityCSVColumns);
      expect(result).toContain("Enterprise Deal");
      expect(result).toContain("Discovery");
      expect(result).toContain("50000.00");
      expect(result).toContain("2024-06-30");
    });
  });
});
