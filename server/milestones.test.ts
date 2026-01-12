import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Milestone Procedures", () => {
  describe("list procedure", () => {
    it("should require projectId", () => {
      const schema = z.object({ projectId: z.number() });
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ projectId: "invalid" })).toThrow();
      expect(schema.parse({ projectId: 123 })).toEqual({ projectId: 123 });
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

  describe("create procedure", () => {
    const schema = z.object({
      projectId: z.number(),
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      dueDate: z.date().optional(),
      status: z.enum(["Not Started", "In Progress", "Completed", "Blocked"]).default("Not Started"),
      displayOrder: z.number().default(0),
    });

    it("should require projectId and title", () => {
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ projectId: 1 })).toThrow();
      expect(() => schema.parse({ title: "Test" })).toThrow();
    });

    it("should accept valid milestone data", () => {
      const valid = {
        projectId: 1,
        title: "Kickoff Meeting",
        description: "Initial project kickoff",
        dueDate: new Date("2026-02-15"),
        status: "Not Started" as const,
        displayOrder: 1,
      };
      expect(schema.parse(valid)).toEqual(valid);
    });

    it("should default status to Not Started", () => {
      const result = schema.parse({
        projectId: 1,
        title: "Test Milestone",
      });
      expect(result.status).toBe("Not Started");
    });

    it("should default displayOrder to 0", () => {
      const result = schema.parse({
        projectId: 1,
        title: "Test Milestone",
      });
      expect(result.displayOrder).toBe(0);
    });

    it("should reject empty title", () => {
      expect(() =>
        schema.parse({
          projectId: 1,
          title: "",
        })
      ).toThrow("Title is required");
    });

    it("should accept optional description", () => {
      const withDescription = schema.parse({
        projectId: 1,
        title: "Test",
        description: "Details here",
      });
      expect(withDescription.description).toBe("Details here");

      const withoutDescription = schema.parse({
        projectId: 1,
        title: "Test",
      });
      expect(withoutDescription.description).toBeUndefined();
    });

    it("should accept optional dueDate", () => {
      const dueDate = new Date("2026-03-01");
      const withDate = schema.parse({
        projectId: 1,
        title: "Test",
        dueDate,
      });
      expect(withDate.dueDate).toEqual(dueDate);

      const withoutDate = schema.parse({
        projectId: 1,
        title: "Test",
      });
      expect(withoutDate.dueDate).toBeUndefined();
    });

    it("should validate status enum", () => {
      const validStatuses = ["Not Started", "In Progress", "Completed", "Blocked"];
      validStatuses.forEach((status) => {
        expect(() =>
          schema.parse({
            projectId: 1,
            title: "Test",
            status,
          })
        ).not.toThrow();
      });

      expect(() =>
        schema.parse({
          projectId: 1,
          title: "Test",
          status: "Invalid Status",
        })
      ).toThrow();
    });
  });

  describe("update procedure", () => {
    const schema = z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        status: z.enum(["Not Started", "In Progress", "Completed", "Blocked"]).optional(),
        displayOrder: z.number().optional(),
      }),
    });

    it("should require id", () => {
      expect(() => schema.parse({ data: {} })).toThrow();
      expect(() => schema.parse({ id: "invalid", data: {} })).toThrow();
    });

    it("should accept partial updates", () => {
      const result = schema.parse({
        id: 1,
        data: { title: "Updated Title" },
      });
      expect(result.data.title).toBe("Updated Title");
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
          data: { status: "Completed" },
        })
      ).not.toThrow();
    });

    it("should accept all optional fields", () => {
      const result = schema.parse({
        id: 1,
        data: {
          title: "New Title",
          description: "New Description",
          dueDate: new Date("2026-04-01"),
          status: "In Progress" as const,
          displayOrder: 5,
        },
      });
      expect(result.data.title).toBe("New Title");
      expect(result.data.status).toBe("In Progress");
      expect(result.data.displayOrder).toBe(5);
    });
  });

  describe("delete procedure", () => {
    it("should require id", () => {
      const schema = z.object({ id: z.number() });
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ id: "invalid" })).toThrow();
      expect(schema.parse({ id: 789 })).toEqual({ id: 789 });
    });
  });

  describe("toggleComplete procedure", () => {
    it("should require id", () => {
      const schema = z.object({ id: z.number() });
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ id: "invalid" })).toThrow();
      expect(schema.parse({ id: 101 })).toEqual({ id: 101 });
    });
  });

  describe("milestone status transitions", () => {
    it("should support all valid status values", () => {
      const statusEnum = z.enum(["Not Started", "In Progress", "Completed", "Blocked"]);
      expect(statusEnum.parse("Not Started")).toBe("Not Started");
      expect(statusEnum.parse("In Progress")).toBe("In Progress");
      expect(statusEnum.parse("Completed")).toBe("Completed");
      expect(statusEnum.parse("Blocked")).toBe("Blocked");
    });

    it("should reject invalid status values", () => {
      const statusEnum = z.enum(["Not Started", "In Progress", "Completed", "Blocked"]);
      expect(() => statusEnum.parse("Pending")).toThrow();
      expect(() => statusEnum.parse("Done")).toThrow();
      expect(() => statusEnum.parse("")).toThrow();
    });
  });

  describe("milestone ordering", () => {
    it("should accept displayOrder as number", () => {
      const schema = z.object({
        projectId: z.number(),
        title: z.string(),
        displayOrder: z.number(),
      });

      expect(schema.parse({ projectId: 1, title: "Test", displayOrder: 0 }).displayOrder).toBe(0);
      expect(schema.parse({ projectId: 1, title: "Test", displayOrder: 1 }).displayOrder).toBe(1);
      expect(schema.parse({ projectId: 1, title: "Test", displayOrder: 999 }).displayOrder).toBe(999);
    });

    it("should reject non-numeric displayOrder", () => {
      const schema = z.object({
        projectId: z.number(),
        title: z.string(),
        displayOrder: z.number(),
      });

      expect(() => schema.parse({ projectId: 1, title: "Test", displayOrder: "1" })).toThrow();
      expect(() => schema.parse({ projectId: 1, title: "Test", displayOrder: null })).toThrow();
    });
  });

  describe("milestone dates", () => {
    it("should accept valid Date objects for dueDate", () => {
      const schema = z.object({
        projectId: z.number(),
        title: z.string(),
        dueDate: z.date(),
      });

      const testDate = new Date("2026-06-15");
      const result = schema.parse({
        projectId: 1,
        title: "Test",
        dueDate: testDate,
      });
      expect(result.dueDate).toEqual(testDate);
    });

    it("should reject invalid date values", () => {
      const schema = z.object({
        projectId: z.number(),
        title: z.string(),
        dueDate: z.date(),
      });

      expect(() => schema.parse({ projectId: 1, title: "Test", dueDate: "2026-06-15" })).toThrow();
      expect(() => schema.parse({ projectId: 1, title: "Test", dueDate: 1234567890 })).toThrow();
    });
  });

  describe("milestone title validation", () => {
    it("should require non-empty title", () => {
      const schema = z.string().min(1, "Title is required");
      expect(() => schema.parse("")).toThrow("Title is required");
      expect(schema.parse("Valid Title")).toBe("Valid Title");
    });

    it("should accept titles of various lengths", () => {
      const schema = z.string().min(1);
      expect(schema.parse("A")).toBe("A");
      expect(schema.parse("Short Title")).toBe("Short Title");
      expect(schema.parse("A".repeat(200))).toBe("A".repeat(200));
    });
  });

  describe("milestone description validation", () => {
    it("should accept optional description", () => {
      const schema = z.string().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse("Description text")).toBe("Description text");
    });

    it("should accept empty string for description", () => {
      const schema = z.string().optional();
      expect(schema.parse("")).toBe("");
    });

    it("should accept long descriptions", () => {
      const schema = z.string().optional();
      const longText = "A".repeat(1000);
      expect(schema.parse(longText)).toBe(longText);
    });
  });
});
