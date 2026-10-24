import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import Post, { type IPost } from "../models/Post";
import User from "../models/User";
import { HttpError } from "../middleware/validateObjectId";
import { getValidatedBody } from "../types";
import type { AwardInput, CreatePostInput } from "../types/schemas";

interface PopulatedUser {
  _id: import("mongoose").Types.ObjectId;
  username: string;
}

type PostWithPopulated = Omit<IPost, "checkedBy"> & {
  checkedBy: PopulatedUser[];
};

interface ExamSummaryDto {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  passedCount: number;
  uniqueUsers: number;
}

interface ExamDetailDto extends ExamSummaryDto {
  checkedBy: { id: string; username: string; passes: number }[];
}

function toSummaryDto(post: IPost): ExamSummaryDto {
  return {
    id: post._id.toString(),
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    passedCount: post.checkedBy.length,
    uniqueUsers: new Set(post.checkedBy.map((id) => id.toString())).size,
  };
}

// POST /api/posts — create exam (admin only)
export async function createPost(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidatedBody<CreatePostInput>(res);
    const post = await Post.create({
      title: body.title,
      content: body.content ?? "",
      checkedBy: [],
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: toSummaryDto(post),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts — list all exams, newest first
export async function listPosts(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({
      success: true,
      data: posts.map(toSummaryDto),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id — one exam with checkedBy populated (username only)
export async function getPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const post = await Post.findById(req.params.id).populate<{
      checkedBy: PopulatedUser[];
    }>({
      path: "checkedBy",
      select: "username",
      model: User,
    });

    if (!post) {
      throw new HttpError(StatusCodes.NOT_FOUND, "পরীক্ষাটি খুঁজে পাওয়া যায়নি");
    }

    const data: ExamDetailDto = {
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      passedCount: post.checkedBy.length,
      uniqueUsers: new Set(
        post.checkedBy.map((u) => u._id.toString())
      ).size,
      checkedBy: (post as unknown as PostWithPopulated).checkedBy.reduce<
        { id: string; username: string; passes: number }[]
      >((acc, u) => {
        const key = u._id.toString();
        const existing = acc.find((x) => x.id === key);
        if (existing) {
          existing.passes += 1;
        } else {
          acc.push({ id: key, username: u.username, passes: 1 });
        }
        return acc;
      }, []),
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id — delete an exam (admin only)
export async function deletePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      throw new HttpError(StatusCodes.NOT_FOUND, "পরীক্ষাটি খুঁজে পাওয়া যায়নি");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { id: post._id.toString(), title: post.title },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts/:id/award — add one pass for the user ($push, duplicates allowed)
// Each click = +1 pass. Points are computed from the array size, never stored.
export async function awardPoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidatedBody<AwardInput>(res);

    const user = await User.findById(body.userId);
    if (!user) {
      throw new HttpError(StatusCodes.NOT_FOUND, "ইউজার খুঁজে পাওয়া যায়নি");
    }

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { checkedBy: user._id } },
      { new: true }
    );

    if (!updated) {
      throw new HttpError(StatusCodes.NOT_FOUND, "পরীক্ষাটি খুঁজে পাওয়া যায়নি");
    }

    const userPasses = updated.checkedBy.filter(
      (id) => id.toString() === body.userId
    ).length;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: updated._id.toString(),
        passed: true,
        userPasses,
        passedCount: updated.checkedBy.length,
      },
    });
  } catch (err) {
    next(err);
  }
}
