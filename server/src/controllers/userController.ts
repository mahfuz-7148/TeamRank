import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import User, { type IUser } from "../models/User";
import { HttpError } from "../middleware/validateObjectId";
import { getValidatedBody } from "../types";
import type { CreateUserInput } from "../types/schemas";

interface UserDto {
  id: string;
  username: string;
  createdAt: Date;
}

function toDto(user: IUser): UserDto {
  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
}

// POST /api/users — create a user or return the existing one
export async function createUser(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidatedBody<CreateUserInput>(res);
    const username = body.username.trim();

    let user: IUser | null = await User.findOne({ username });
    if (!user) {
      try {
        user = await User.create({ username });
      } catch (err) {
        // Handle race condition: another request created it first
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: number }).code === 11000
        ) {
          user = await User.findOne({ username });
        } else {
          throw err;
        }
      }
    }

    if (!user) {
      throw new HttpError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create or find user"
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: toDto(user),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/users — list all users sorted by username
export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await User.find().sort({ username: 1 });
    res.status(StatusCodes.OK).json({
      success: true,
      data: users.map(toDto),
    });
  } catch (err) {
    next(err);
  }
}
