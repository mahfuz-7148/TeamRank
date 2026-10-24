import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export interface AuthedRequest extends Request {
  admin?: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiFail = ApiError;

export interface ApiOk<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function validate<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "form";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      } satisfies ApiFail);
      return;
    }
    res.locals.validatedBody = result.data;
    next();
  };
}

export function getValidatedBody<T>(res: Response): T {
  return (res.locals.validatedBody as T) ?? ({} as T);
}
