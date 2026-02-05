# Contributing to Tru-CRM

Thank you for your interest in contributing to Tru-CRM! This document provides guidelines and best practices for contributing to the project.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Requirements](#testing-requirements)
5. [Pull Request Process](#pull-request-process)
6. [Commit Message Guidelines](#commit-message-guidelines)

---

## Getting Started

### Prerequisites

- **Node.js**: v22 or higher
- **pnpm**: v8 or higher
- **MySQL**: v8.0 or higher
- **Git**: Latest version

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Tru-CRM.git
   cd Tru-CRM
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Luckdawg/Tru-CRM.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

6. **Set up database**:
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE trucrm;"
   
   # Run migrations
   pnpm db:push
   ```

7. **Start development server**:
   ```bash
   pnpm dev
   ```

8. **Verify setup**:
   - Open http://localhost:3000
   - Run tests: `pnpm test`

---

## Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Urgent production fixes

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes
git fetch upstream

# Rebase on develop
git rebase upstream/develop

# Force push to your fork (if needed)
git push origin feature/your-feature-name --force-with-lease
```

---

## Code Standards

### TypeScript

- **Use TypeScript** for all new code
- **Avoid `any` type** - use proper types or `unknown`
- **Use interfaces** for object shapes
- **Use enums** for fixed sets of values
- **Export types** from shared files

### Code Style

We use **Prettier** for formatting and **ESLint** for linting.

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `user-preferences.ts` |
| **Components** | PascalCase | `OpportunityDetail.tsx` |
| **Functions** | camelCase | `calculateLeadScore()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| **Interfaces** | PascalCase | `ForecastSnapshot` |
| **Types** | PascalCase | `LogLevel` |

### File Organization

```
server/
├── _core/           # Framework-level code
│   ├── index.ts     # Server setup
│   ├── trpc.ts      # tRPC configuration
│   ├── logger.ts    # Logging utility
│   └── ...
├── db.ts            # Database queries
├── routers.ts       # tRPC procedures
├── emailSync.ts     # Email sync logic
├── *.test.ts        # Test files
└── ...

client/
├── src/
│   ├── pages/       # Page components
│   ├── components/  # Reusable components
│   ├── hooks/       # Custom hooks
│   ├── lib/         # Utilities
│   └── ...
```

### Import Order

1. External packages
2. Internal modules
3. Types
4. Relative imports

```typescript
// External packages
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// Internal modules
import { logger } from './_core/logger';
import { getDb } from './db';

// Types
import type { TrpcContext } from './_core/context';

// Relative imports
import { calculateLeadScore } from './leadScoring';
```

---

## Testing Requirements

### Test Coverage

All new code must include tests:

- **Unit tests**: For pure functions and utilities
- **Integration tests**: For tRPC procedures
- **Domain logic tests**: For business rules

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test opportunities.test.ts

# Generate coverage report
pnpm test --coverage
```

### Writing Tests

Follow the **Arrange-Act-Assert** pattern:

```typescript
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Feature Name", () => {
  it("should perform expected behavior", async () => {
    // Arrange: Set up test data
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Act: Perform the action
    const result = await caller.feature.method({ /* params */ });

    // Assert: Verify the result
    expect(result).toBeDefined();
    expect(result.field).toBe("expected value");
  });
});
```

### Test Requirements for PRs

- All tests must pass
- New features must have test coverage
- Bug fixes must include regression tests
- Coverage should not decrease

---

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run tests**:
   ```bash
   pnpm test
   ```

3. **Check types**:
   ```bash
   pnpm check
   ```

4. **Format code**:
   ```bash
   pnpm format
   ```

5. **Lint code**:
   ```bash
   pnpm lint
   ```

### PR Template

When creating a PR, include:

**Title**: Use conventional commit format (e.g., `feat: add lead scoring`)

**Description**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Address feedback** and update PR
4. **Approval** from maintainer
5. **Merge** to develop branch

---

## Commit Message Guidelines

We follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| **feat** | New feature |
| **fix** | Bug fix |
| **docs** | Documentation changes |
| **style** | Code style changes (formatting, etc.) |
| **refactor** | Code refactoring |
| **test** | Adding or updating tests |
| **chore** | Maintenance tasks |
| **perf** | Performance improvements |

### Examples

```bash
# Feature
git commit -m "feat(opportunities): add MEDDIC fields to opportunity form"

# Bug fix
git commit -m "fix(email-sync): prevent duplicate activities from webhook retries"

# Documentation
git commit -m "docs(readme): add Gmail OAuth setup instructions"

# Refactoring
git commit -m "refactor(db): extract common query logic into helper functions"

# Breaking change
git commit -m "feat(api)!: change opportunity stage enum values

BREAKING CHANGE: Stage values changed from snake_case to Title Case"
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit subject line to 50 characters
- Capitalize subject line
- Do not end subject line with a period
- Separate subject from body with a blank line
- Wrap body at 72 characters
- Use body to explain what and why, not how

---

## Code Review Guidelines

### For Authors

- Keep PRs small and focused (< 400 lines changed)
- Provide context in PR description
- Respond to feedback promptly
- Be open to suggestions
- Update PR based on feedback

### For Reviewers

- Be respectful and constructive
- Focus on code, not the person
- Explain reasoning for suggestions
- Approve when satisfied
- Request changes if needed

### Review Checklist

- [ ] Code follows project standards
- [ ] Tests are adequate and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Error handling is robust
- [ ] Logging is appropriate

---

## Development Tips

### Debugging

```bash
# Enable debug logging
LOG_LEVEL=debug pnpm dev

# Run single test with debugging
pnpm test --reporter=verbose opportunities.test.ts
```

### Database

```bash
# Generate migration
pnpm db:generate

# Push schema changes
pnpm db:push

# Open database studio
pnpm db:studio
```

### Useful Commands

```bash
# Check for type errors
pnpm check

# Build for production
pnpm build

# Start production server
pnpm start

# Clean build artifacts
rm -rf client/dist
```

---

## Getting Help

- **Documentation**: Check [docs/](./docs/) folder
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers at dev@trucrm.com

---

## License

By contributing to Tru-CRM, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Tru-CRM! 🎉
