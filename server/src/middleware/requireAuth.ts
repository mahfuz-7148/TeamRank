import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import User, { type IUser } from "../models/User";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../lib/auth";
import { HttpError } from "./validateObjectId";

export interface AuthUserDto {
  id: string;
  username: string;
  createdAt: Date;
}

export interface AuthedRequest extends Request {
  authUser?: IUser;
}

export function toAuthUserDto(user: IUser): AuthUserDto {
  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
}

/** Reads the auth cookie, verifies the JWT and loads the user. */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookies = (req.cookies ?? {}) as Record<string, unknown>;
    const token = cookies[AUTH_COOKIE_NAME];
    if (typeof token !== "string" || token.length === 0) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "প্রথমে লগইন করুন");
    }

    const userId = verifyAuthToken(token);
    if (!userId) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        "সেশন মেয়াদোত্তীর্ণ — আবার লগইন করুন"
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        "অ্যাকাউন্টটি আর নেই — আবার সাইনআপ করুন"
      );
    }

    (req as AuthedRequest).authUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Use inside controllers mounted behind `requireAuth`. */
export function getAuthUser(req: Request): IUser {
  const user = (req as AuthedRequest).authUser;
  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "প্রথমে লগইন করুন");
  }
  return user;
}
