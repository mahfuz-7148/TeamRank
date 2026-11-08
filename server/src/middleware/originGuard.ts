import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { isAllowedOrigin } from "../config/origins";
import type { ApiFail } from "../types";

/**
 * Cookie-based auth needs CSRF protection. Browsers send `Origin` on
 * cross-site mutating requests, so reject anything not on the allowlist.
 * Requests without an Origin header (curl, server-to-server, health checks)
 * are allowed — they cannot ride a browser cookie.
 */
export function originGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const origin = req.header("origin");
  if (!origin || isAllowedOrigin(origin)) {
    next();
    return;
  }

  res.status(StatusCodes.FORBIDDEN).json({
    success: false,
    message: "Cross-origin request blocked",
  } satisfies ApiFail);
}
