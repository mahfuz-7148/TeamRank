import { Router } from "express";
import {
  awardPoint,
  createPost,
  deletePost,
  getPost,
  listPosts,
  selfPass,
} from "../controllers/postController";
import { adminOnly } from "../middleware/adminOnly";
import { validateObjectId } from "../middleware/validateObjectId";
import { awardSchema, createPostSchema, selfPassSchema } from "../types/schemas";
import { validate } from "../types";

const router = Router();

router.post("/", adminOnly, validate(createPostSchema), createPost);
router.get("/", listPosts);
router.get("/:id", validateObjectId("id"), getPost);
router.post(
  "/:id/pass",
  validateObjectId("id"),
  validate(selfPassSchema),
  selfPass
);
router.delete("/:id", adminOnly, validateObjectId("id"), deletePost);
router.post(
  "/:id/award",
  adminOnly,
  validateObjectId("id"),
  validate(awardSchema),
  awardPoint
);

export { router as postRoutes };
