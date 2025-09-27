import { Router } from "express";

const router = Router();

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from Vercel API 🚀" });
});

// example login
router.post("/login", (req: any, res: any) => {
  const { username, password } = req.body;
  // TODO: use your real auth logic here
  const user = { id: 1, username: username || "demo" };
  
  // For now, skip session handling until iron-session is properly configured
  res.json({ success: true, userId: user.id });
});

// example progress
router.get("/progress", (req: any, res: any) => {
  // For now, return mock data without session check
  res.json({ userId: 1, gamesPlayed: 5, score: 120 });
});

// example battle
router.post("/battle", (req: any, res: any) => {
  // For now, return mock data without session check
  res.json({ result: "You won 🎉", opponent: req.body.opponentId || "bot" });
});

export default router;