import express from "express";
import serverless from "serverless-http";
import routes from "./routes.js"; // ✅ note the .js extension (after compile)
const app = express();
app.use(express.json());
app.use("/api", routes);
export default serverless(app);
