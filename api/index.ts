import express from "express";
import serverless from "serverless-http";
import { getIronSession } from "iron-session";
import routes from "./routes"; // ✅ local import

const app = express();

app.use(express.json());

// Add iron-session middleware
app.use(async (req: any, res: any, next: any) => {
  req.session = await getIronSession(req, res, {
    cookieName: "burble_sess",
    password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_for_demo_replace_in_production",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    },
  });
  next();
});

app.use("/api", routes);

export default serverless(app);