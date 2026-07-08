import { Router } from "express";
import multer from "multer";
import type { ImportProgressEvent } from "@groweasy/shared";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import { runImport } from "../services/importService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.includes("csv") ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (ok) cb(null, true);
    else cb(new ApiError(400, "Only .csv files are accepted"));
  },
});

export const importRouter = Router();

/**
 * POST /api/import
 * Streams Server-Sent Events by default (parsed -> mapping -> batch... -> done).
 * Pass ?stream=0 to get a single buffered JSON response instead (handy for curl
 * and tests).
 */
importRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "No file uploaded. Use form field 'file'.");

    const content = req.file.buffer.toString("utf8");
    const filename = req.file.originalname;

    const wantsStream =
      req.query.stream !== "0" &&
      (req.query.stream === "1" ||
        (req.headers.accept ?? "").includes("text/event-stream"));

    if (!wantsStream) {
      const result = await runImport(filename, content);
      res.json(result);
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = (event: ImportProgressEvent) =>
      res.write(`data: ${JSON.stringify(event)}\n\n`);

    try {
      await runImport(filename, content, send);
    } catch (err) {
      send({ type: "error", message: (err as Error).message });
    }
    res.end();
  } catch (err) {
    next(err);
  }
});
