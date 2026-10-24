import { Router } from "express";
import { createUser, deleteUser, listUsers } from "../controllers/userController";
import { adminOnly } from "../middleware/adminOnly";
import { validateObjectId } from "../middleware/validateObjectId";
import { createUserSchema } from "../types/schemas";
import { validate } from "../types";

const router = Router();

router.post("/", validate(createUserSchema), createUser);
router.get("/", listUsers);
router.delete("/:id", adminOnly, validateObjectId("id"), deleteUser);

export { router as userRoutes };
