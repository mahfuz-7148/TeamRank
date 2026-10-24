import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

interface PassCount {
  _id: mongoose.Types.ObjectId;
  points: number;
}

// GET /api/leaderboard
// Points are never stored — computed live from the posts collection.
// Every entry in checkedBy counts (so repeated passes add up).
export async function getLeaderboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Count total passes per user: unwind checkedBy across all posts, then group
    const passCounts = await mongoose.connection
      .collection("posts")
      .aggregate<PassCount>([
        { $project: { checkedBy: 1 } },
        { $unwind: "$checkedBy" },
        { $group: { _id: "$checkedBy", points: { $sum: 1 } } },
      ])
      .toArray();

    const pointsByUser = new Map(
      passCounts.map((p) => [p._id.toString(), p.points])
    );

    // Include every user (0 points if no passes yet)
    const users = await mongoose.connection
      .collection("users")
      .find({})
      .project<{ _id: mongoose.Types.ObjectId; username: string }>({
        username: 1,
      })
      .toArray();

    const data = users
      .map((u) => ({
        id: u._id.toString(),
        username: u.username,
        points: pointsByUser.get(u._id.toString()) ?? 0,
      }))
      .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));

    res.status(StatusCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
