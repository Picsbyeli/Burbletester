// server/routes.ts
import { Router } from "express";

const router = Router();

// Example login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Replace with your real auth logic
  if (username === "test" && password === "1234") {
    req.session.userId = 1; // works after session typing fix
    res.json({ success: true, userId: req.session.userId });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Example progress route
router.get("/progress", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  // Fake data — replace with DB lookup
  res.json({
    userId: req.session.userId,
    gamesPlayed: 5,
    gamesWon: 3,
    totalScore: 100
  });
});

// Example Battle Arena route
router.post("/battle", (req, res) => {
  const { opponentId } = req.body;

  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  // Fake logic for now
  res.json({
    battleStarted: true,
    opponentId,
    yourId: req.session.userId
  });
});

export default router;
