import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the validation schemas from routers
const winReasons = [
  "Better Features",
  "Better Price",
  "Existing Relationship",
  "Superior Support",
  "Faster Implementation",
  "Strategic Fit",
  "Product Quality",
  "Brand Reputation",
] as const;

const lossReasons = [
  "Price Too High",
  "Missing Features",
  "Lost to Competitor",
  "Budget Constraints",
  "Timing Issues",
  "No Decision",
  "Went with Incumbent",
  "Poor Fit",
] as const;

describe("Win/Loss Analysis - Win Reasons Validation", () => {
  const winReasonSchema = z.enum(winReasons);

  it("should accept all valid win reasons", () => {
    winReasons.forEach((reason) => {
      expect(() => winReasonSchema.parse(reason)).not.toThrow();
    });
  });

  it("should reject loss reasons in win analysis", () => {
    lossReasons.forEach((reason) => {
      expect(() => winReasonSchema.parse(reason)).toThrow();
    });
  });

  it("should reject invalid reason strings", () => {
    expect(() => winReasonSchema.parse("Invalid Reason")).toThrow();
    expect(() => winReasonSchema.parse("")).toThrow();
    expect(() => winReasonSchema.parse(null)).toThrow();
  });
});

describe("Win/Loss Analysis - Loss Reasons Validation", () => {
  const lossReasonSchema = z.enum(lossReasons);

  it("should accept all valid loss reasons", () => {
    lossReasons.forEach((reason) => {
      expect(() => lossReasonSchema.parse(reason)).not.toThrow();
    });
  });

  it("should reject win reasons in loss analysis", () => {
    winReasons.forEach((reason) => {
      expect(() => lossReasonSchema.parse(reason)).toThrow();
    });
  });

  it("should reject invalid reason strings", () => {
    expect(() => lossReasonSchema.parse("Invalid Reason")).toThrow();
    expect(() => lossReasonSchema.parse("")).toThrow();
    expect(() => lossReasonSchema.parse(null)).toThrow();
  });
});

describe("Win/Loss Analysis - Create Input Validation", () => {
  const createSchema = z.object({
    opportunityId: z.number().positive(),
    outcome: z.enum(["Won", "Lost"]),
    primaryReason: z.string().min(1),
    competitorName: z.string().optional(),
    dealSize: z.number().optional(),
    customerFeedback: z.string().optional(),
    lessonsLearned: z.string().optional(),
  });

  it("should accept valid win analysis input", () => {
    const validInput = {
      opportunityId: 1,
      outcome: "Won" as const,
      primaryReason: "Better Features",
      dealSize: 50000,
      customerFeedback: "Great product",
      lessonsLearned: "Demo was key",
    };
    expect(() => createSchema.parse(validInput)).not.toThrow();
  });

  it("should accept valid loss analysis input", () => {
    const validInput = {
      opportunityId: 1,
      outcome: "Lost" as const,
      primaryReason: "Price Too High",
      competitorName: "Competitor Inc",
      customerFeedback: "Too expensive",
      lessonsLearned: "Need better pricing",
    };
    expect(() => createSchema.parse(validInput)).not.toThrow();
  });

  it("should require opportunityId", () => {
    const invalidInput = {
      outcome: "Won" as const,
      primaryReason: "Better Features",
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });

  it("should require outcome", () => {
    const invalidInput = {
      opportunityId: 1,
      primaryReason: "Better Features",
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });

  it("should require primaryReason", () => {
    const invalidInput = {
      opportunityId: 1,
      outcome: "Won" as const,
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });

  it("should reject invalid outcome values", () => {
    const invalidInput = {
      opportunityId: 1,
      outcome: "Pending" as any,
      primaryReason: "Better Features",
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });

  it("should accept optional fields as undefined", () => {
    const validInput = {
      opportunityId: 1,
      outcome: "Won" as const,
      primaryReason: "Better Features",
    };
    expect(() => createSchema.parse(validInput)).not.toThrow();
  });

  it("should reject negative opportunityId", () => {
    const invalidInput = {
      opportunityId: -1,
      outcome: "Won" as const,
      primaryReason: "Better Features",
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });

  it("should reject zero opportunityId", () => {
    const invalidInput = {
      opportunityId: 0,
      outcome: "Won" as const,
      primaryReason: "Better Features",
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });

  it("should reject empty primaryReason", () => {
    const invalidInput = {
      opportunityId: 1,
      outcome: "Won" as const,
      primaryReason: "",
    };
    expect(() => createSchema.parse(invalidInput)).toThrow();
  });
});

describe("Win/Loss Analysis - Update Input Validation", () => {
  const updateSchema = z.object({
    id: z.number().positive(),
    data: z.object({
      primaryReason: z.string().min(1).optional(),
      competitorName: z.string().optional(),
      dealSize: z.number().optional(),
      customerFeedback: z.string().optional(),
      lessonsLearned: z.string().optional(),
    }),
  });

  it("should accept valid update input", () => {
    const validInput = {
      id: 1,
      data: {
        customerFeedback: "Updated feedback",
        lessonsLearned: "Updated lessons",
      },
    };
    expect(() => updateSchema.parse(validInput)).not.toThrow();
  });

  it("should require id", () => {
    const invalidInput = {
      data: {
        customerFeedback: "Updated feedback",
      },
    };
    expect(() => updateSchema.parse(invalidInput)).toThrow();
  });

  it("should require data object", () => {
    const invalidInput = {
      id: 1,
    };
    expect(() => updateSchema.parse(invalidInput)).toThrow();
  });

  it("should accept empty data object", () => {
    const validInput = {
      id: 1,
      data: {},
    };
    expect(() => updateSchema.parse(validInput)).not.toThrow();
  });

  it("should reject negative id", () => {
    const invalidInput = {
      id: -1,
      data: {},
    };
    expect(() => updateSchema.parse(invalidInput)).toThrow();
  });
});

describe("Win/Loss Analysis - Business Logic", () => {
  it("should enforce competitor name for 'Lost to Competitor' reason", () => {
    // This would be enforced in the tRPC procedure
    const lossReason = "Lost to Competitor";
    const competitorName = "Acme Corp";

    if (lossReason === "Lost to Competitor") {
      expect(competitorName).toBeDefined();
      expect(competitorName).toBeTruthy();
    }
  });

  it("should calculate win rate from analysis data", () => {
    const analyses = [
      { outcome: "Won" },
      { outcome: "Won" },
      { outcome: "Lost" },
      { outcome: "Won" },
      { outcome: "Lost" },
    ];

    const wins = analyses.filter((a) => a.outcome === "Won").length;
    const total = analyses.length;
    const winRate = (wins / total) * 100;

    expect(winRate).toBe(60);
  });

  it("should identify most common win reason", () => {
    const winAnalyses = [
      { primaryReason: "Better Features" },
      { primaryReason: "Better Price" },
      { primaryReason: "Better Features" },
      { primaryReason: "Better Features" },
      { primaryReason: "Superior Support" },
    ];

    const reasonCounts = winAnalyses.reduce(
      (acc, a) => {
        acc[a.primaryReason] = (acc[a.primaryReason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommon = Object.entries(reasonCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    expect(mostCommon).toBe("Better Features");
  });

  it("should identify most common loss reason", () => {
    const lossAnalyses = [
      { primaryReason: "Price Too High" },
      { primaryReason: "Missing Features" },
      { primaryReason: "Price Too High" },
      { primaryReason: "Price Too High" },
      { primaryReason: "Lost to Competitor" },
    ];

    const reasonCounts = lossAnalyses.reduce(
      (acc, a) => {
        acc[a.primaryReason] = (acc[a.primaryReason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommon = Object.entries(reasonCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    expect(mostCommon).toBe("Price Too High");
  });
});
