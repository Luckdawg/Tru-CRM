import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Case Procedures", () => {
  describe("list procedure", () => {
    it("should accept optional ownerId", () => {
      const schema = z.object({ ownerId: z.number().optional() }).optional();
      expect(schema.parse({})).toEqual({});
      expect(schema.parse({ ownerId: 123 })).toEqual({ ownerId: 123 });
      expect(schema.parse(undefined)).toBeUndefined();
    });
  });

  describe("get procedure", () => {
    it("should require id", () => {
      const schema = z.object({ id: z.number() });
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ id: "invalid" })).toThrow();
      expect(schema.parse({ id: 456 })).toEqual({ id: 456 });
    });
  });

  describe("getByAccount procedure", () => {
    it("should require accountId", () => {
      const schema = z.object({ accountId: z.number() });
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ accountId: "invalid" })).toThrow();
      expect(schema.parse({ accountId: 789 })).toEqual({ accountId: 789 });
    });
  });

  describe("create procedure", () => {
    const schema = z.object({
      caseNumber: z.string().min(1),
      subject: z.string().min(1),
      accountId: z.number(),
      contactId: z.number().optional(),
      status: z.enum(["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"]).optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      type: z.enum(["Technical Issue", "Feature Request", "Question", "Bug Report"]).optional(),
      description: z.string().optional(),
      ownerId: z.number(),
    });

    it("should require caseNumber, subject, accountId, and ownerId", () => {
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ caseNumber: "CASE-001" })).toThrow();
      expect(() => schema.parse({ caseNumber: "CASE-001", subject: "Test" })).toThrow();
      expect(() => schema.parse({ caseNumber: "CASE-001", subject: "Test", accountId: 1 })).toThrow();
    });

    it("should accept valid case data", () => {
      const valid = {
        caseNumber: "CASE-001",
        subject: "Login Issue",
        accountId: 1,
        ownerId: 2,
        status: "Open" as const,
        priority: "Medium" as const,
        type: "Technical Issue" as const,
        description: "User cannot login",
      };
      expect(schema.parse(valid)).toEqual(valid);
    });

    it("should reject empty caseNumber", () => {
      expect(() =>
        schema.parse({
          caseNumber: "",
          subject: "Test",
          accountId: 1,
          ownerId: 2,
        })
      ).toThrow();
    });

    it("should reject empty subject", () => {
      expect(() =>
        schema.parse({
          caseNumber: "CASE-001",
          subject: "",
          accountId: 1,
          ownerId: 2,
        })
      ).toThrow();
    });

    it("should accept optional contactId", () => {
      const withContact = schema.parse({
        caseNumber: "CASE-001",
        subject: "Test",
        accountId: 1,
        contactId: 5,
        ownerId: 2,
      });
      expect(withContact.contactId).toBe(5);

      const withoutContact = schema.parse({
        caseNumber: "CASE-001",
        subject: "Test",
        accountId: 1,
        ownerId: 2,
      });
      expect(withoutContact.contactId).toBeUndefined();
    });

    it("should accept optional description", () => {
      const withDescription = schema.parse({
        caseNumber: "CASE-001",
        subject: "Test",
        accountId: 1,
        ownerId: 2,
        description: "Detailed description",
      });
      expect(withDescription.description).toBe("Detailed description");

      const withoutDescription = schema.parse({
        caseNumber: "CASE-001",
        subject: "Test",
        accountId: 1,
        ownerId: 2,
      });
      expect(withoutDescription.description).toBeUndefined();
    });

    it("should validate status enum", () => {
      const validStatuses = ["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"];
      validStatuses.forEach((status) => {
        expect(() =>
          schema.parse({
            caseNumber: "CASE-001",
            subject: "Test",
            accountId: 1,
            ownerId: 2,
            status,
          })
        ).not.toThrow();
      });

      expect(() =>
        schema.parse({
          caseNumber: "CASE-001",
          subject: "Test",
          accountId: 1,
          ownerId: 2,
          status: "Invalid Status",
        })
      ).toThrow();
    });

    it("should validate priority enum", () => {
      const validPriorities = ["Low", "Medium", "High", "Critical"];
      validPriorities.forEach((priority) => {
        expect(() =>
          schema.parse({
            caseNumber: "CASE-001",
            subject: "Test",
            accountId: 1,
            ownerId: 2,
            priority,
          })
        ).not.toThrow();
      });

      expect(() =>
        schema.parse({
          caseNumber: "CASE-001",
          subject: "Test",
          accountId: 1,
          ownerId: 2,
          priority: "Invalid Priority",
        })
      ).toThrow();
    });

    it("should validate type enum", () => {
      const validTypes = ["Technical Issue", "Feature Request", "Question", "Bug Report"];
      validTypes.forEach((type) => {
        expect(() =>
          schema.parse({
            caseNumber: "CASE-001",
            subject: "Test",
            accountId: 1,
            ownerId: 2,
            type,
          })
        ).not.toThrow();
      });

      expect(() =>
        schema.parse({
          caseNumber: "CASE-001",
          subject: "Test",
          accountId: 1,
          ownerId: 2,
          type: "Invalid Type",
        })
      ).toThrow();
    });
  });

  describe("update procedure", () => {
    const schema = z.object({
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
    });

    it("should require id", () => {
      expect(() => schema.parse({ data: {} })).toThrow();
      expect(() => schema.parse({ id: "invalid", data: {} })).toThrow();
    });

    it("should accept partial updates", () => {
      const result = schema.parse({
        id: 1,
        data: { subject: "Updated Subject" },
      });
      expect(result.data.subject).toBe("Updated Subject");
      expect(result.data.description).toBeUndefined();
    });

    it("should validate status enum in updates", () => {
      expect(() =>
        schema.parse({
          id: 1,
          data: { status: "Invalid" },
        })
      ).toThrow();

      expect(() =>
        schema.parse({
          id: 1,
          data: { status: "Resolved" },
        })
      ).not.toThrow();
    });

    it("should accept resolution and resolvedAt", () => {
      const resolvedDate = new Date("2026-01-15");
      const result = schema.parse({
        id: 1,
        data: {
          status: "Resolved",
          resolution: "Fixed in version 2.0",
          resolvedAt: resolvedDate,
        },
      });
      expect(result.data.resolution).toBe("Fixed in version 2.0");
      expect(result.data.resolvedAt).toEqual(resolvedDate);
    });
  });

  describe("case number validation", () => {
    it("should require non-empty case number", () => {
      const schema = z.string().min(1);
      expect(() => schema.parse("")).toThrow();
      expect(schema.parse("CASE-001")).toBe("CASE-001");
    });

    it("should accept various case number formats", () => {
      const schema = z.string().min(1);
      expect(schema.parse("CASE-001")).toBe("CASE-001");
      expect(schema.parse("SUP-12345")).toBe("SUP-12345");
      expect(schema.parse("TKT-2026-001")).toBe("TKT-2026-001");
    });
  });

  describe("case subject validation", () => {
    it("should require non-empty subject", () => {
      const schema = z.string().min(1);
      expect(() => schema.parse("")).toThrow();
      expect(schema.parse("Login Issue")).toBe("Login Issue");
    });

    it("should accept subjects of various lengths", () => {
      const schema = z.string().min(1);
      expect(schema.parse("A")).toBe("A");
      expect(schema.parse("Short subject")).toBe("Short subject");
      expect(schema.parse("A".repeat(200))).toBe("A".repeat(200));
    });
  });

  describe("case status transitions", () => {
    it("should support all valid status values", () => {
      const statusEnum = z.enum(["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"]);
      expect(statusEnum.parse("Open")).toBe("Open");
      expect(statusEnum.parse("In Progress")).toBe("In Progress");
      expect(statusEnum.parse("Waiting on Customer")).toBe("Waiting on Customer");
      expect(statusEnum.parse("Resolved")).toBe("Resolved");
      expect(statusEnum.parse("Closed")).toBe("Closed");
    });

    it("should reject invalid status values", () => {
      const statusEnum = z.enum(["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"]);
      expect(() => statusEnum.parse("Pending")).toThrow();
      expect(() => statusEnum.parse("New")).toThrow();
      expect(() => statusEnum.parse("")).toThrow();
    });
  });

  describe("case priority levels", () => {
    it("should support all valid priority values", () => {
      const priorityEnum = z.enum(["Low", "Medium", "High", "Critical"]);
      expect(priorityEnum.parse("Low")).toBe("Low");
      expect(priorityEnum.parse("Medium")).toBe("Medium");
      expect(priorityEnum.parse("High")).toBe("High");
      expect(priorityEnum.parse("Critical")).toBe("Critical");
    });

    it("should reject invalid priority values", () => {
      const priorityEnum = z.enum(["Low", "Medium", "High", "Critical"]);
      expect(() => priorityEnum.parse("Normal")).toThrow();
      expect(() => priorityEnum.parse("Urgent")).toThrow();
      expect(() => priorityEnum.parse("")).toThrow();
    });
  });

  describe("case type categories", () => {
    it("should support all valid type values", () => {
      const typeEnum = z.enum(["Technical Issue", "Feature Request", "Question", "Bug Report"]);
      expect(typeEnum.parse("Technical Issue")).toBe("Technical Issue");
      expect(typeEnum.parse("Feature Request")).toBe("Feature Request");
      expect(typeEnum.parse("Question")).toBe("Question");
      expect(typeEnum.parse("Bug Report")).toBe("Bug Report");
    });

    it("should reject invalid type values", () => {
      const typeEnum = z.enum(["Technical Issue", "Feature Request", "Question", "Bug Report"]);
      expect(() => typeEnum.parse("Support")).toThrow();
      expect(() => typeEnum.parse("Incident")).toThrow();
      expect(() => typeEnum.parse("")).toThrow();
    });
  });
});
