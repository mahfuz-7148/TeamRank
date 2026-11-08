import { Router } from "express";
import { login, logout, me, signup } from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";
import { validate } from "../types";
import { loginSchema, signupSchema } from "../types/schemas";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export { router as authRoutes };
