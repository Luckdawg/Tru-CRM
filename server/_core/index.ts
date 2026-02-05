import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeScheduler, shutdownScheduler } from "../scheduler";
import { loadConfig, getConfig } from "./config";
import { logger, requestLogger } from "./logger";
import { expressErrorHandler } from "./errorHandler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Load and validate configuration first
  try {
    loadConfig();
    logger.info('Configuration loaded and validated successfully');
  } catch (error) {
    logger.error('Failed to load configuration', {}, error as Error);
    process.exit(1);
  }

  const config = getConfig();
  const app = express();
  const server = createServer(app);
  
  // Request logging middleware (before other middleware)
  app.use(requestLogger);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (config.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handling middleware (must be last)
  app.use(expressErrorHandler);

  const preferredPort = parseInt(config.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn('Port conflict resolved', { preferredPort, actualPort: port });
  }

  server.listen(port, () => {
    logger.info('Server started successfully', { 
      port, 
      nodeEnv: config.NODE_ENV,
      emailSyncEnabled: config.ENABLE_EMAIL_SYNC,
      digestsEnabled: config.ENABLE_DIGESTS
    });
    
    // Initialize scheduled jobs after server starts
    initializeScheduler();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    shutdownScheduler();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    shutdownScheduler();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', {}, error);
  process.exit(1);
});
