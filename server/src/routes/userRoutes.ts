import { Router } from "express";
import { deleteUser, listUsers } from "../controllers/userController";
import { adminOnly } from "../middleware/adminOnly";
import { requireAuth } from "../middleware/requireAuth";
import { validateObjectId } from "../middleware/validateObjectId";

const router = Router();

router.get("/", requireAuth, listUsers);
router.delete(
  "/:id",
  requireAuth,
  adminOnly,
  validateObjectId("id"),
  deleteUser
);

export { router as userRoutes };
