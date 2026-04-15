import { Router } from "express";

import { createShow, getShows, getShowSeats } from "./show.controller.js";
import { createShowSchema } from "./show.schema.js";

import validate from "../../middlewares/validate.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getShows));

router.get("/:showId/seats", asyncHandler(getShowSeats));

router.post(
    "/",
    requireAuth,
    requireAdmin,
    validate(createShowSchema),
    asyncHandler(createShow),
);

export default router;
