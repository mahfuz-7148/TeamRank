import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import User, { type IUser } from "../models/User";
import Post from "../models/Post";
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

// DELETE /api/users/:id — remove a user and all of their passes (admin only)
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new HttpError(StatusCodes.NOT_FOUND, "ইউজার খুঁজে পাওয়া যায়নি");
    }

    // Remove this user's passes from every exam so the leaderboard stays correct
    await Post.updateMany({}, { $pull: { checkedBy: user._id } });
    await User.findByIdAndDelete(user._id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { id: user._id.toString(), username: user.username },
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
