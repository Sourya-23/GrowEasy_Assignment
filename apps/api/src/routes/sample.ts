import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const templatePath = join(here, "..", "assets", "sample-template.csv");

export const sampleRouter = Router();

sampleRouter.get("/", (_req, res) => {
  const csv = readFileSync(templatePath, "utf8");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="groweasy-sample-template.csv"'
  );
  res.send(csv);
});
