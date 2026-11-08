import { Router } from "express";
import {
  awardPoint,
  createPost,
  deletePost,
  getPost,
  listPosts,
  selfRespond,
} from "../controllers/postController";
import { adminOnly } from "../middleware/adminOnly";
import { requireAuth } from "../middleware/requireAuth";
import { validateObjectId } from "../middleware/validateObjectId";
import { awardSchema, createPostSchema } from "../types/schemas";
import { validate } from "../types";

const router = Router();

router.post(
  "/",
  requireAuth,
  adminOnly,
  validate(createPostSchema),
  createPost
);
router.get("/", requireAuth, listPosts);
router.get("/:id", requireAuth, validateObjectId("id"), getPost);
router.post(
  "/:id/respond",
  requireAuth,
  validateObjectId("id"),
  selfRespond
);
// Backward-compatible alias for older clients
router.post("/:id/pass", requireAuth, validateObjectId("id"), selfRespond);
router.delete(
  "/:id",
  requireAuth,
  adminOnly,
  validateObjectId("id"),
  deletePost
);
router.post(
  "/:id/award",
  requireAuth,
  adminOnly,
  validateObjectId("id"),
  validate(awardSchema),
  awardPoint
);

export { router as postRoutes };
