// api/index.ts
import express from "express";
import serverless from "serverless-http";
import routes from "../server/routes"; // adjust path if needed

const app = express();

app.use(express.json());

// All your API routes
app.use("/api", routes);

// Simple test route
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Vercel API 🚀" });
});

// Export for Vercel
export default serverless(app);