import { Types } from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isValidObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value) && /^[a-fA-F0-9]{24}$/.test(value);
}

export function validateObjectId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!value || !isValidObjectId(value)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid id for parameter "${paramName}"`,
      });
      return;
    }
    next();
  };
}
