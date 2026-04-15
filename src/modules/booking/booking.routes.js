import { Router } from "express";

import { createBooking } from "./booking.controller.js";
import { createBookingSchema } from "./booking.schema.js";

import validate from "../../middlewares/validate.js";
import { requireAuth, requireVerified } from "../../middlewares/auth.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post(
    "/",
    requireAuth,
    requireVerified,
    validate(createBookingSchema),
    asyncHandler(createBooking),
);

export default router;
