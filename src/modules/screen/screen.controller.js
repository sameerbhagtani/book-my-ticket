import db from "../../db/index.js";
import { screens } from "../../db/schema.js";

import ApiResponse from "../../utils/ApiResponse.js";

export async function getScreens(_req, res) {
    const allScreens = await db.select().from(screens);

    return ApiResponse.ok(res, "Screens fetched", {
        screens: allScreens,
    });
}
