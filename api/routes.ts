import { Router } from "express";

const router = Router();

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from Vercel API 🚀" });
});

// example login
router.post("/login", (req, res) => {
  req.session.userId = 1; // mock user
  res.json({ success: true, userId: req.session.userId });
});

// example progress
router.get("/progress", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ userId: req.session.userId, gamesPlayed: 5, score: 120 });
});

// example battle
router.post("/battle", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ result: "You won 🎉", opponent: req.body.opponentId });
});

export default router;