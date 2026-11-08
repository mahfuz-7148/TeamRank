import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import User, { type IUser } from "../models/User";
import Post from "../models/Post";
import { HttpError } from "../middleware/validateObjectId";

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
