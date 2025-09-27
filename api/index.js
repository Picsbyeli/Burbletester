const express = require("express");
const serverless = require("serverless-http");

const app = express();
app.use(express.json());

// Test endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Vercel API 🚀" });
});

// Simple login
app.post("/api/login", (req, res) => {
  const { username } = req.body;
  res.json({ success: true, user: username || "demo" });
});

// Simple progress
app.get("/api/progress", (req, res) => {
  res.json({ gamesPlayed: 5, score: 120 });
});

module.exports = serverless(app);