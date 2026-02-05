# Tru-CRM

**A purpose-built Customer Relationship Management system for Visium Technologies**, designed to streamline sales, customer success, and support operations with deep Gmail integration, real-time analytics, and intelligent health monitoring across the entire customer lifecycle.

![CI Status](https://github.com/Luckdawg/Tru-CRM/workflows/CI/badge.svg)

---

## Value Proposition

Tru-CRM is specifically tailored for Visium's unique go-to-market motion in the industrial cybersecurity space. Unlike generic CRM platforms, Tru-CRM provides native Gmail integration that automatically captures customer communications, MEDDIC-based opportunity tracking for complex enterprise sales, project health monitoring for post-sale implementations, and analytics-first dashboards that surface actionable insights for sales reps, managers, and executives. The system supports the full customer journey from lead capture through renewal tracking, with built-in forecasting, win/loss analysis, and automated digest emails that keep teams aligned on at-risk deals and low-engagement accounts.

---

## Tech Stack

Tru-CRM is built as a modern, type-safe monorepo with the following architecture:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Client** | React 19 + TypeScript + Vite | Fast, type-safe frontend with hot module replacement |
| **UI Components** | Radix UI + Tailwind CSS 4 + shadcn/ui | Accessible, customizable component library |
| **API Layer** | tRPC 11 + Superjson | End-to-end type safety with automatic serialization |
| **Server** | Node.js + Express 4 + TypeScript | RESTful endpoints for OAuth and webhooks |
| **Database** | MySQL + Drizzle ORM | Relational data with type-safe queries |
| **Email Integration** | Gmail API + Google Pub/Sub | Real-time email sync with webhook notifications |
| **Testing** | Vitest + React Testing Library | Comprehensive unit and integration tests |
| **Build Tools** | pnpm + esbuild + tsx | Fast dependency management and bundling |

---

## Quick Start

### Prerequisites

Before setting up Tru-CRM locally, ensure you have the following installed:

- **Node.js** 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 8+ (`npm install -g pnpm`)
- **MySQL** 8.0+ (or compatible cloud database like PlanetScale)
- **Gmail API credentials** (see [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md))

### Installation

```bash
# Clone the repository
git clone https://github.com/Luckdawg/Tru-CRM.git
cd Tru-CRM

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and OAuth settings
```

### Database Setup

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE trucrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Generate and run migrations
pnpm db:push
```

The `db:push` command runs two operations:
1. `drizzle-kit generate` - Creates migration files from schema
2. `drizzle-kit migrate` - Applies migrations to the database

### Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/trucrm"

# Gmail OAuth (see OAUTH_SETUP_GUIDE.md)
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/oauth/gmail/callback"

# Google Pub/Sub (for webhook notifications)
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_PUBSUB_TOPIC="gmail-notifications"

# Application
NODE_ENV="development"
PORT="3000"
SESSION_SECRET="your-random-secret-key"
```

### Running the Application

```bash
# Development mode (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

The application will be available at `http://localhost:3000`.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test accounts.test.ts

# Type checking
pnpm check
```

---

## Project Structure

```
Tru-CRM/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── _core/         # Core utilities and hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Client libraries (tRPC client)
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app component with routing
│   │   ├── main.tsx       # Application entry point
│   │   └── index.css      # Global styles
│   └── index.html         # HTML template
├── server/                # Backend Node.js application
│   ├── _core/             # Core server utilities
│   │   ├── context.ts     # tRPC context builder
│   │   ├── env.ts         # Environment validation
│   │   ├── index.ts       # Express server entry point
│   │   ├── oauth.ts       # OAuth flow handlers
│   │   └── trpc.ts        # tRPC router setup
│   ├── db.ts              # Database query functions
│   ├── routers.ts         # tRPC procedure definitions
│   ├── emailSync.ts       # Gmail/Outlook email sync
│   ├── webhooks.ts        # Webhook handlers
│   ├── webhookRenewal.ts  # Webhook subscription renewal
│   ├── digestService.ts   # Email digest generation
│   ├── scheduler.ts       # Cron job scheduler
│   ├── csvExport.ts       # Report export utilities
│   └── *.test.ts          # Test files
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # Drizzle ORM schema definitions
│   ├── relations.ts       # Table relationships
│   └── migrations/        # SQL migration files
├── shared/                # Shared code between client and server
│   ├── _core/             # Shared utilities
│   ├── const.ts           # Shared constants
│   └── types.ts           # Shared TypeScript types
├── OAUTH_SETUP_GUIDE.md   # Detailed OAuth configuration guide
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite bundler configuration
└── vitest.config.ts       # Test configuration
```

---

## Key Features

### Sales Pipeline Management
- **Opportunity Tracking** with MEDDIC methodology (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)
- **Stage-based Pipeline** with customizable stages and probability weighting
- **Win/Loss Analysis** to capture competitive intelligence and improve future deals
- **Forecasting** with historical snapshot tracking for accuracy measurement

### Email Integration
- **Automatic Email Capture** from Gmail using OAuth 2.0 and Pub/Sub webhooks
- **Bi-directional Sync** for both sent and received messages
- **Smart Matching** to automatically link emails to accounts, contacts, and opportunities
- **Activity Timeline** showing all customer communications in context

### Analytics & Reporting
- **Executive Dashboard** with pipeline coverage, win rates, and ARR/MRR metrics
- **Sales Velocity** tracking to measure deal cycle time
- **Lead Scoring** based on engagement, fit, and behavior
- **Custom Report Builder** with saved views and scheduled delivery
- **CSV Export** for external analysis

### Customer Success
- **Project Tracking** for onboarding and implementation milestones
- **Health Monitoring** with automated alerts for at-risk accounts
- **Adoption Metrics** tracking active users and feature usage
- **Renewal Management** with expansion opportunity identification

### Automation
- **Email Digests** with configurable frequency and content
- **Webhook Renewal** to maintain continuous email sync
- **Scheduled Reports** for regular delivery to stakeholders
- **Health Alerts** triggered by engagement thresholds

---

## Documentation

- **[OAuth Setup Guide](./OAUTH_SETUP_GUIDE.md)** - Step-by-step instructions for configuring Gmail and Outlook integration
- **[Architecture Guide](./docs/Architecture.md)** - System design, data flows, and module responsibilities
- **[Testing Guide](./docs/Testing.md)** - Testing strategy, running tests, and coverage goals
- **[API Reference](./docs/API.md)** - tRPC procedures and database schema documentation

---

## Development Workflow

### Making Changes

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with tests
   - Update schema in `drizzle/schema.ts` if needed
   - Add database functions in `server/db.ts`
   - Create tRPC procedures in `server/routers.ts`
   - Build UI components in `client/src/pages/`
   - Write tests in `server/*.test.ts`

3. **Run tests and type checking**
   ```bash
   pnpm test
   pnpm check
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a pull request** on GitHub

### Database Migrations

When modifying the database schema:

```bash
# 1. Edit drizzle/schema.ts

# 2. Generate migration
pnpm db:push

# 3. Test migration on local database

# 4. Commit both schema.ts and generated migration files
git add drizzle/
git commit -m "feat: add new table for feature X"
```

### Code Style

The project uses Prettier for consistent formatting:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format --check
```

---

## Deployment

### Production Build

```bash
# Build client and server
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

### Environment Variables for Production

Ensure the following environment variables are set in your production environment:

- `DATABASE_URL` - Production MySQL connection string
- `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` - OAuth credentials
- `GMAIL_REDIRECT_URI` - Production callback URL
- `GOOGLE_CLOUD_PROJECT_ID` - GCP project for Pub/Sub
- `SESSION_SECRET` - Strong random secret for session encryption
- `NODE_ENV=production`

### Database Migrations in Production

```bash
# Run migrations before deploying new code
pnpm db:push
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new functionality
3. **Follow the existing code style** (use Prettier)
4. **Update documentation** if adding new features
5. **Submit a pull request** with a clear description

---

## License

MIT License - see LICENSE file for details

---

## Support

For questions or issues:
- **GitHub Issues**: https://github.com/Luckdawg/Tru-CRM/issues
- **Documentation**: See `/docs` directory
- **OAuth Setup**: See [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md)

---

**Built with ❤️ for Visium Technologies**
