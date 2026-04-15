import { Router } from "express";
import { getScreens } from "./screen.controller.js";

import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getScreens));

export default router;
