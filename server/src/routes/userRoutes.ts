import { Router } from "express";
import { createUser, listUsers } from "../controllers/userController";
import { createUserSchema } from "../types/schemas";
import { validate } from "../types";

const router = Router();

router.post("/", validate(createUserSchema), createUser);
router.get("/", listUsers);

export { router as userRoutes };
