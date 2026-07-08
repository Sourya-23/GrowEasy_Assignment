import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: `Upload error: ${err.message}` });
    return;
  }
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
}
