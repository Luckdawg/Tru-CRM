# Testing Guide

This document explains how to run tests, understand the testing strategy, and add new test coverage to Tru-CRM.

---

## Table of Contents

1. [Running Tests](#running-tests)
2. [Testing Strategy](#testing-strategy)
3. [Test Structure](#test-structure)
4. [Writing New Tests](#writing-new-tests)
5. [Mocking External Services](#mocking-external-services)
6. [Coverage Goals](#coverage-goals)
7. [End-to-End Testing](#end-to-end-testing)

---

## Running Tests

### All Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test --watch

# Run tests with coverage report
pnpm test --coverage
```

### Specific Test Files

```bash
# Run a single test file
pnpm test accounts.test.ts

# Run tests matching a pattern
pnpm test opportunities

# Run tests in a specific directory
pnpm test server/
```

### Type Checking

```bash
# Check TypeScript types without running tests
pnpm check
```

---

## Testing Strategy

Tru-CRM uses **Vitest** for unit and integration testing. The testing strategy focuses on three levels:

### 1. Unit Tests (Database Functions)

Test individual database query functions in `server/db.ts` to ensure they correctly interact with the database.

**Example**: `server/accounts.test.ts` tests `createAccount()`, `getAccountById()`, `updateAccount()`, etc.

**Characteristics**:
- Fast execution (< 100ms per test)
- Isolated from business logic
- Direct database interaction (requires test database)

### 2. Integration Tests (tRPC Procedures)

Test tRPC procedures in `server/routers.ts` to ensure they correctly handle requests, validate inputs, and return expected responses.

**Example**: `server/opportunities.test.ts` tests `opportunities.create`, `opportunities.update`, `opportunities.getByStage`, etc.

**Characteristics**:
- Medium execution time (100-500ms per test)
- Tests full request/response cycle
- Includes input validation and error handling

### 3. Domain Logic Tests (Business Rules)

Test complex business logic like forecasting, lead scoring, and win/loss analysis.

**Example**: `server/forecast.test.ts` tests weighted pipeline calculations, forecast categories, and accuracy metrics.

**Characteristics**:
- Fast execution (< 50ms per test)
- Pure functions without database dependencies
- Focus on calculation correctness

---

## Test Structure

### Test File Organization

All test files follow the naming convention `*.test.ts` and are located in the `server/` directory alongside the code they test.

```
server/
├── db.ts                    # Database functions
├── accounts.test.ts         # Tests for account CRUD
├── opportunities.test.ts    # Tests for opportunity CRUD
├── forecast.test.ts         # Tests for forecasting logic
├── leadScoring.test.ts      # Tests for lead scoring
├── emailSync.test.ts        # Tests for email sync
└── ...
```

### Test Structure Pattern

Each test file follows this structure:

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper function to create authenticated context
function createAuthContext(role: "admin" | "user" = "user"): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@visium.com",
    name: "Test User",
    role,
    // ... other required fields
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Feature Name", () => {
  it("should perform expected behavior", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feature.method({ /* params */ });

    expect(result).toBeDefined();
    expect(result.field).toBe("expected value");
  });
});
```

---

## Writing New Tests

### Step 1: Create Test File

Create a new file `server/yourFeature.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  // ... (copy from existing test file)
}

describe("Your Feature", () => {
  it("should do something", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test implementation
  });
});
```

### Step 2: Write Test Cases

Follow the **Arrange-Act-Assert** pattern:

```typescript
it("should create a new project with milestones", async () => {
  // Arrange: Set up test data
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  
  const account = await caller.accounts.create({
    accountName: "Test Account",
    ownerId: 1,
  });

  // Act: Perform the action
  const project = await caller.projects.create({
    projectName: "Implementation Project",
    accountId: account.id,
    status: "Planning",
    ownerId: 1,
  });

  // Assert: Verify the result
  expect(project).toBeDefined();
  expect(project.projectName).toBe("Implementation Project");
  expect(project.status).toBe("Planning");
});
```

### Step 3: Test Edge Cases

Always test edge cases and error conditions:

```typescript
it("should reject invalid email format", async () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  await expect(
    caller.contacts.create({
      firstName: "John",
      lastName: "Doe",
      email: "invalid-email", // Invalid format
      accountId: 1,
      ownerId: 1,
    })
  ).rejects.toThrow();
});

it("should return null for non-existent account", async () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  const account = await caller.accounts.get({ id: 999999 });
  expect(account).toBeNull();
});
```

### Step 4: Run Your Tests

```bash
pnpm test yourFeature.test.ts
```

---

## Mocking External Services

### Gmail API Mocking

For tests that interact with Gmail API, mock the `googleapis` library:

```typescript
import { vi } from "vitest";

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => ({
        setCredentials: vi.fn(),
        getAccessToken: vi.fn().mockResolvedValue({ token: "mock-token" }),
      })),
    },
    gmail: vi.fn(() => ({
      users: {
        messages: {
          list: vi.fn().mockResolvedValue({
            data: { messages: [{ id: "msg1" }] },
          }),
          get: vi.fn().mockResolvedValue({
            data: {
              id: "msg1",
              payload: {
                headers: [
                  { name: "Subject", value: "Test Email" },
                  { name: "From", value: "sender@example.com" },
                ],
              },
            },
          }),
        },
      },
    })),
  },
}));
```

### Database Mocking

For unit tests that don't require a real database, mock the `db.ts` functions:

```typescript
import * as db from "./db";
import { vi } from "vitest";

vi.spyOn(db, "getAccountById").mockResolvedValue({
  id: 1,
  accountName: "Mock Account",
  ownerId: 1,
  // ... other fields
});
```

### Environment Variables

Set test environment variables in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "mysql://test:test@localhost:3306/trucrm_test",
      GMAIL_CLIENT_ID: "test-client-id",
      GMAIL_CLIENT_SECRET: "test-client-secret",
      NODE_ENV: "test",
    },
  },
});
```

---

## Coverage Goals

### Current Coverage

Run coverage report to see current test coverage:

```bash
pnpm test --coverage
```

Output example:

```
File                     | % Stmts | % Branch | % Funcs | % Lines
-------------------------|---------|----------|---------|--------
server/db.ts             |   85.2  |   78.3   |   90.1  |   84.7
server/routers.ts        |   72.4  |   65.8   |   80.2  |   71.9
server/emailSync.ts      |   45.6  |   38.2   |   50.0  |   44.8
server/digestService.ts  |   60.3  |   55.1   |   66.7  |   59.8
```

### Coverage Targets

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| **Core CRUD (db.ts)** | 85% | 90% | High |
| **tRPC Procedures (routers.ts)** | 72% | 85% | High |
| **Email Sync** | 46% | 70% | Medium |
| **Digest Service** | 60% | 75% | Medium |
| **Forecasting** | 90% | 95% | Low (already high) |
| **Lead Scoring** | 88% | 95% | Low (already high) |

### Recommended Additional Tests

#### 1. Email Sync End-to-End Flow

**Test**: Create account → Add contact → Sync email → Verify activity created

```typescript
describe("Email Sync E2E", () => {
  it("should sync Gmail email and create activity linked to contact", async () => {
    // 1. Create account
    const account = await caller.accounts.create({ /* ... */ });
    
    // 2. Create contact with email
    const contact = await caller.contacts.create({
      email: "john.doe@example.com",
      accountId: account.id,
      // ...
    });
    
    // 3. Mock Gmail API response
    // 4. Trigger email sync
    // 5. Verify activity was created
    // 6. Verify activity is linked to contact
  });
});
```

#### 2. Opportunity → Dashboard → Report Flow

**Test**: Create opportunity → Update stage → Verify dashboard metrics → Export report

```typescript
describe("Opportunity to Report E2E", () => {
  it("should reflect opportunity in dashboard and report", async () => {
    // 1. Create opportunity
    const opp = await caller.opportunities.create({ /* ... */ });
    
    // 2. Get dashboard data
    const dashboard = await caller.dashboard.pipelineByStage();
    
    // 3. Verify opportunity appears in correct stage
    const stage = dashboard.find(s => s.stage === opp.stage);
    expect(stage.count).toBeGreaterThan(0);
    
    // 4. Export report
    const report = await caller.reports.execute({ /* ... */ });
    
    // 5. Verify opportunity appears in report
    expect(report.rows).toContainEqual(expect.objectContaining({
      opportunityName: opp.opportunityName,
    }));
  });
});
```

#### 3. Digest Generation Flow

**Test**: Set user preferences → Create at-risk opportunity → Generate digest → Verify content

```typescript
describe("Digest Generation E2E", () => {
  it("should generate digest with at-risk opportunities", async () => {
    // 1. Set user preferences
    await caller.userPreferences.update({
      digestEnabled: true,
      includeAtRiskDeals: true,
    });
    
    // 2. Create opportunity with low health score
    const opp = await caller.opportunities.create({
      // ... with old lastActivityDate
    });
    
    // 3. Generate digest
    const digest = await generateAndSendDigest(userId, userName, userEmail);
    
    // 4. Verify digest contains opportunity
    expect(digest).toContain(opp.opportunityName);
  });
});
```

---

## End-to-End Testing

### Manual E2E Testing Checklist

Before deploying to production, manually test these critical flows:

#### Sales Flow
- [ ] Create account
- [ ] Add contacts to account
- [ ] Create opportunity linked to account
- [ ] Add line items to opportunity
- [ ] Log activity (call, email, meeting)
- [ ] Update opportunity stage
- [ ] Close opportunity as won
- [ ] Verify win/loss analysis is captured

#### Email Integration Flow
- [ ] Connect Gmail account via OAuth
- [ ] Send email to contact
- [ ] Verify email appears in activity timeline
- [ ] Receive email from contact
- [ ] Verify inbound email is captured
- [ ] Disconnect Gmail account
- [ ] Verify webhook subscription is removed

#### Analytics Flow
- [ ] View dashboard with pipeline data
- [ ] Filter opportunities by stage
- [ ] View forecast report
- [ ] Create custom report
- [ ] Schedule report for weekly delivery
- [ ] Export report to CSV

#### Customer Success Flow
- [ ] Create project for account
- [ ] Add milestones to project
- [ ] Update milestone status
- [ ] Change project health status
- [ ] Verify health alert is triggered
- [ ] View engagement metrics

### Automated E2E Testing (Future)

Consider adding Playwright or Cypress for automated browser testing:

```bash
# Install Playwright
pnpm add -D @playwright/test

# Run E2E tests
pnpm test:e2e
```

Example Playwright test:

```typescript
import { test, expect } from '@playwright/test';

test('should create opportunity and view in pipeline', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Opportunities');
  await page.click('text=New Opportunity');
  await page.fill('input[name="opportunityName"]', 'Test Opportunity');
  await page.fill('input[name="amount"]', '100000');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Test Opportunity')).toBeVisible();
});
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain the expected behavior:

```typescript
// ✅ Good
it("should create opportunity with MEDDIC fields and link to account", async () => {});

// ❌ Bad
it("test opportunity creation", async () => {});
```

### 2. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good
it("should update opportunity stage", async () => {
  // Create opportunity within this test
  const opp = await caller.opportunities.create({ /* ... */ });
  await caller.opportunities.update({ id: opp.id, data: { stage: "PoC/Trial" } });
});

// ❌ Bad
let opportunityId: number;

it("should create opportunity", async () => {
  const opp = await caller.opportunities.create({ /* ... */ });
  opportunityId = opp.id; // Shared state
});

it("should update opportunity stage", async () => {
  await caller.opportunities.update({ id: opportunityId, data: { stage: "PoC/Trial" } });
});
```

### 3. Clean Up Test Data

Use `beforeEach` or `afterEach` to clean up test data:

```typescript
import { beforeEach } from "vitest";

beforeEach(async () => {
  // Clear test data before each test
  await db.deleteAllTestData();
});
```

### 4. Test Error Cases

Always test both success and failure scenarios:

```typescript
describe("Opportunity Validation", () => {
  it("should create opportunity with valid data", async () => {
    // Test success case
  });

  it("should reject opportunity with negative amount", async () => {
    await expect(
      caller.opportunities.create({ amount: "-1000", /* ... */ })
    ).rejects.toThrow("Amount must be positive");
  });

  it("should reject opportunity with past close date", async () => {
    await expect(
      caller.opportunities.create({ closeDate: new Date("2020-01-01"), /* ... */ })
    ).rejects.toThrow("Close date must be in the future");
  });
});
```

---

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: trucrm_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      
      - run: pnpm check
        name: Type check
      
      - run: pnpm test
        name: Run tests
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/trucrm_test
      
      - run: pnpm test --coverage
        name: Generate coverage report
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Next Steps

- **[Architecture Guide](./Architecture.md)** - Understand system design and data flows
- **[API Reference](./API.md)** - Detailed tRPC procedure documentation
- **[Contributing Guide](../CONTRIBUTING.md)** - Guidelines for contributing code
