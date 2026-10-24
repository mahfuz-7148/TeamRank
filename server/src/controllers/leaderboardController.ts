import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

// GET /api/leaderboard
// Points are never stored — computed live via $lookup + $size.
export async function getLeaderboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const results = await mongoose.connection
      .collection("users")
      .aggregate<{
        _id: mongoose.Types.ObjectId;
        username: string;
        createdAt: Date;
        points: number;
      }>([
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "checkedBy",
            as: "passedPosts",
          },
        },
        {
          $addFields: {
            points: { $size: "$passedPosts" },
          },
        },
        {
          $project: {
            _id: 1,
            username: 1,
            createdAt: 1,
            points: 1,
          },
        },
        {
          $sort: { points: -1, username: 1 as const },
        },
      ])
      .toArray();

    res.status(StatusCodes.OK).json({
      success: true,
      data: results.map((r) => ({
        id: r._id.toString(),
        username: r.username,
        points: r.points,
      })),
    });
  } catch (err) {
    next(err);
  }
}
