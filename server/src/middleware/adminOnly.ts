import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server configuration error: ADMIN_KEY is not set",
    });
    return;
  }
  const provided = req.header("x-admin-key");
  if (!provided || provided !== adminKey) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or missing admin key",
    });
    return;
  }
  next();
}
