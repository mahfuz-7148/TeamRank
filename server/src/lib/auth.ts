import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HttpError } from "../middleware/validateObjectId";

export const AUTH_COOKIE_NAME = "teamrank_token";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const BCRYPT_ROUNDS = 12;

let cachedJwtSecret: string | null = null;

function getJwtSecret(): string {
  if (cachedJwtSecret) return cachedJwtSecret;

  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length >= 16) {
    cachedJwtSecret = secret;
    return secret;
  }

  // Fallback keeps existing deployments online if JWT_SECRET has not been
  // added yet. Set JWT_SECRET explicitly in production for a dedicated key.
  const adminKey = process.env.ADMIN_KEY?.trim();
  if (adminKey) {
    console.warn(
      "[auth] JWT_SECRET is missing or too short — falling back to ADMIN_KEY. Set JWT_SECRET in production."
    );
    cachedJwtSecret = adminKey;
    return adminKey;
  }

  throw new HttpError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    "Server configuration error: set JWT_SECRET (or ADMIN_KEY)"
  );
}

/** Fail fast on startup if auth cannot work. */
export function assertAuthConfigured(): void {
  getJwtSecret();
}

/**
 * Cross-site cookies (Vercel frontend → Render API) require
 * SameSite=None + Secure. Locally we keep Lax over plain HTTP.
 */
function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    process.env.COOKIE_SECURE === "true"
  );
}

export function authCookieOptions(): CookieOptions {
  const secure = isProduction();
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS * 1000,
  };
}

export function clearAuthCookie(res: Response): void {
  const options = authCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}

export function signAuthToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    subject: userId,
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyAuthToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string") return null;
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, userId: string): void {
  res.cookie(AUTH_COOKIE_NAME, signAuthToken(userId), authCookieOptions());
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
