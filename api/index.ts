import express from "express";
import serverless from "serverless-http";
import routes from "./routes"; // ✅ local import

const app = express();

app.use(express.json());

// Simple session middleware for testing (replace with iron-session later)
app.use((req: any, res: any, next: any) => {
  req.session = req.session || {};
  next();
});

app.use("/api", routes);

export default serverless(app);