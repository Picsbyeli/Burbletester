import express from "express";
import serverless from "serverless-http";
import routes from "./routes"; // ✅ local import

const app = express();

app.use(express.json());
app.use("/api", routes);

export default serverless(app);