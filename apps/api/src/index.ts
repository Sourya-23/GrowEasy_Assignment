import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { sampleRouter } from "./routes/sample.js";
import { importRouter } from "./routes/import.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRouter);
app.use("/api/sample", sampleRouter);
app.use("/api/import", importRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`GrowEasy API listening on http://localhost:${env.PORT}`);
});
