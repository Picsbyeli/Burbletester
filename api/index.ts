import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../server/routes";

const app = express();

// ✅ Basic middleware
app.use(express.json());

// ✅ Request logging (simplified for serverless)
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ✅ Register your existing API routes
(async () => {
  await registerRoutes(app);
})();

// ✅ Example test endpoint
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Vercel API 🚀" });
});

// ✅ Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Export for Vercel
export default serverless(app);