import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { HttpError } from "../middleware/validateObjectId";
import type { ApiFail } from "../types";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  } satisfies ApiFail);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
    } satisfies ApiFail);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};
    for (const [field, e] of Object.entries(err.errors)) {
      errors[field] = [e.message];
    }
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors,
    } satisfies ApiFail);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: `Invalid value for ${err.path}`,
    } satisfies ApiFail);
    return;
  }

  // MongoDB duplicate key (e.g. username already taken)
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: "এই রিসোর্সটি আগেই তৈরি করা হয়েছে (duplicate key)",
    } satisfies ApiFail);
    return;
  }

  console.error("[error] Unhandled error:", err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal server error",
  } satisfies ApiFail);
}
