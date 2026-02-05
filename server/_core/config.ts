/**
 * Configuration Management
 * 
 * Validates and provides typed access to environment variables.
 * Fails fast on startup if required configuration is missing.
 */

import { z } from 'zod';
import { logger } from './logger';

/**
 * Environment schema with validation rules
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid MySQL connection string'),

  // Gmail OAuth
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().url().optional(),

  // Google Cloud (for Pub/Sub webhooks)
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_PUBSUB_TOPIC: z.string().optional(),

  // Microsoft OAuth (Outlook)
  OUTLOOK_CLIENT_ID: z.string().optional(),
  OUTLOOK_CLIENT_SECRET: z.string().optional(),
  OUTLOOK_REDIRECT_URI: z.string().url().optional(),
  OUTLOOK_TENANT_ID: z.string().optional(),

  // Session
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Manus SDK (if applicable)
  BUILT_IN_FORGE_API_KEY: z.string().optional(),
  BUILT_IN_FORGE_API_URL: z.string().url().optional(),

  // Feature flags
  ENABLE_EMAIL_SYNC: z.string().default('true').transform(v => v === 'true'),
  ENABLE_DIGESTS: z.string().default('true').transform(v => v === 'true'),
  ENABLE_WEBHOOK_RENEWAL: z.string().default('true').transform(v => v === 'true'),

  // Rate limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes

  // Webhook settings
  WEBHOOK_TIMEOUT_MS: z.string().default('5000').transform(Number),
  WEBHOOK_RETRY_ATTEMPTS: z.string().default('3').transform(Number),

  // Digest settings
  DIGEST_BATCH_SIZE: z.string().default('50').transform(Number),
  DIGEST_MAX_ITEMS: z.string().default('10').transform(Number),
});

export type Config = z.infer<typeof envSchema>;

let config: Config | null = null;

/**
 * Load and validate configuration
 * Call this on application startup
 */
export function loadConfig(): Config {
  if (config) {
    return config;
  }

  try {
    config = envSchema.parse(process.env);
    logger.info('Configuration loaded successfully', {
      nodeEnv: config.NODE_ENV,
      port: config.PORT,
      emailSyncEnabled: config.ENABLE_EMAIL_SYNC,
      digestsEnabled: config.ENABLE_DIGESTS,
    });
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Configuration validation failed', {}, error);
      console.error('❌ Configuration errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Get validated configuration
 * Throws if config hasn't been loaded
 */
export function getConfig(): Config {
  if (!config) {
    throw new Error('Configuration not loaded. Call loadConfig() first.');
  }
  return config;
}

/**
 * Check if email sync is properly configured
 */
export function isEmailSyncConfigured(): boolean {
  const cfg = getConfig();
  return !!(
    cfg.ENABLE_EMAIL_SYNC &&
    cfg.GMAIL_CLIENT_ID &&
    cfg.GMAIL_CLIENT_SECRET &&
    cfg.GMAIL_REDIRECT_URI
  );
}

/**
 * Check if Outlook sync is properly configured
 */
export function isOutlookSyncConfigured(): boolean {
  const cfg = getConfig();
  return !!(
    cfg.ENABLE_EMAIL_SYNC &&
    cfg.OUTLOOK_CLIENT_ID &&
    cfg.OUTLOOK_CLIENT_SECRET &&
    cfg.OUTLOOK_REDIRECT_URI &&
    cfg.OUTLOOK_TENANT_ID
  );
}

/**
 * Check if Google Pub/Sub is properly configured
 */
export function isPubSubConfigured(): boolean {
  const cfg = getConfig();
  return !!(
    cfg.GOOGLE_CLOUD_PROJECT_ID &&
    cfg.GOOGLE_PUBSUB_TOPIC
  );
}

/**
 * Get database connection options
 */
export function getDatabaseConfig() {
  const cfg = getConfig();
  return {
    url: cfg.DATABASE_URL,
    // Add connection pool settings here
    pool: {
      min: 2,
      max: 10,
    },
  };
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  const cfg = getConfig();
  return {
    windowMs: cfg.RATE_LIMIT_WINDOW_MS,
    max: cfg.RATE_LIMIT_MAX_REQUESTS,
  };
}

/**
 * Create .env.example file with all required variables
 */
export function generateEnvExample(): string {
  return `# Node Environment
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=mysql://user:password@localhost:3306/trucrm

# Gmail OAuth
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/oauth/gmail/callback

# Google Cloud (for Pub/Sub webhooks)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_PUBSUB_TOPIC=gmail-notifications

# Microsoft OAuth (Outlook)
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/oauth/outlook/callback
OUTLOOK_TENANT_ID=common

# Session
SESSION_SECRET=your-random-secret-key-at-least-32-characters-long

# Manus SDK (optional)
BUILT_IN_FORGE_API_KEY=your-manus-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im

# Feature Flags
ENABLE_EMAIL_SYNC=true
ENABLE_DIGESTS=true
ENABLE_WEBHOOK_RENEWAL=true

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Webhook Settings
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_RETRY_ATTEMPTS=3

# Digest Settings
DIGEST_BATCH_SIZE=50
DIGEST_MAX_ITEMS=10
`;
}
