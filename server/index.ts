import 'dotenv/config'; // Load environment variables first
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupAuth } from "./auth.js";
import { connectToMongoDB } from "./mongodb.js";
import { pool, db } from "./db.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database connections
    await connectToMongoDB();
    
    // Only connect to PostgreSQL pool in production
    if (process.env.NODE_ENV !== 'development' && pool) {
      await pool.connect();
    }
    
    // Create test users after MongoDB is connected
    const { createTestUsers } = await import('./setup-test-users.js');
    await createTestUsers();
    
    // Setup authentication
    setupAuth(app);
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use PORT from environment variable with fallback to 5000
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Fix for macOS: Use TCP options and explicitly handle errors
    try {
      server.listen(port, () => {
        log(`serving on port ${port}`);
      });
    } catch (err) {
      console.error('Server startup error:', err);
      // Try alternative binding if first attempt fails
      server.listen(port, '127.0.0.1', () => {
        log(`serving on localhost:${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
