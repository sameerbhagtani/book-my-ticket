import { Router } from "express";

import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "./user.schema.js";
import {
    register,
    login,
    me,
    logout,
    verifyEmail,
    resendVerification,
    refresh,
    forgotPassword,
    resetPassword,
} from "./user.controller.js";

import validate from "../../middlewares/validate.js";
import { requireAuth, requireNotVerified } from "../../middlewares/auth.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.get("/me", asyncHandler(me));
router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/logout", asyncHandler(logout));

router.post(
    "/verify-email",
    requireAuth,
    requireNotVerified,
    asyncHandler(verifyEmail),
);
router.post(
    "/resend-verification",
    requireAuth,
    requireNotVerified,
    asyncHandler(resendVerification),
);

router.post("/refresh", asyncHandler(refresh));

router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    asyncHandler(forgotPassword),
);

router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    asyncHandler(resetPassword),
);

export default router;
