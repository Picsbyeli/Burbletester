import { Router } from "express";

const router = Router();

router.get("/hello", (_req: any, res: any) => {
  res.json({ message: "Hello from Vercel API 🚀" });
});

// example login
router.post("/login", (req: any, res: any) => {
  const { username, password } = req.body;
  // TODO: use your real auth logic here
  const user = { id: 1, username: username || "demo" };
  
  req.session.userId = user.id;
  
  res.json({ success: true, userId: user.id });
});

// example progress
router.get("/progress", (req: any, res: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ userId: req.session.userId, gamesPlayed: 5, score: 120 });
});

// example battle
router.post("/battle", (req: any, res: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ result: "You won 🎉", opponent: req.body.opponentId });
});

export default router;