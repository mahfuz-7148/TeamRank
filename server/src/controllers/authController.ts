import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Auth from "../models/User";
import { HttpError } from "../middleware/validateObjectId";
import { getAuthUser, toAuthUserDto } from "../middleware/requireAuth";
import { getValidatedBody } from "../types";
import type { LoginInput, SignupInput } from "../types/schemas";
import {
  clearAuthCookie,
  hashPassword,
  setAuthCookie,
  verifyPassword,
} from "../lib/auth";

// POST /api/auth/signup — create an account (or claim a pre-auth account)
export async function signup(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidatedBody<SignupInput>(res);
    const username = body.username.trim();

    let user = await Auth.findOne({ username }).select("+passwordHash");

    if (user) {
      if (user.passwordHash) {
        throw new HttpError(
          StatusCodes.CONFLICT,
          "এই ইউজারনেম আগেই নেওয়া হয়েছে — লগইন করুন"
        );
      }
      // Legacy account created before passwords existed: set one now so the
      // user keeps their existing passes and leaderboard points.
      user.passwordHash = await hashPassword(body.password);
      await user.save();
    } else {
      try {
        user = await Auth.create({
          username,
          passwordHash: await hashPassword(body.password),
        });
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: number }).code === 11000
        ) {
          throw new HttpError(
            StatusCodes.CONFLICT,
            "এই ইউজারনেম আগেই নেওয়া হয়েছে — লগইন করুন"
          );
        }
        throw err;
      }
    }

    setAuthCookie(res, user._id.toString());
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: toAuthUserDto(user),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidatedBody<LoginInput>(res);
    const username = body.username.trim();

    const user = await Auth.findOne({ username }).select("+passwordHash");
    const valid =
      user?.passwordHash !== undefined &&
      (await verifyPassword(body.password, user.passwordHash));

    if (!user || !valid) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        "ইউজারনেম বা পাসওয়ার্ড ভুল"
      );
    }

    setAuthCookie(res, user._id.toString());
    res.status(StatusCodes.OK).json({
      success: true,
      data: toAuthUserDto(user),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout — clear the httpOnly cookie
export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    clearAuthCookie(res);
    res.status(StatusCodes.OK).json({
      success: true,
      data: { loggedOut: true },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — current session user
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getAuthUser(req);
    res.status(StatusCodes.OK).json({
      success: true,
      data: toAuthUserDto(user),
    });
  } catch (err) {
    next(err);
  }
}
