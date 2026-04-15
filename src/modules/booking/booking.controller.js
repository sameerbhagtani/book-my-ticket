import db from "../../db/index.js";
import { showSeats } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

export async function createBooking(req, res) {
    const { showId, seatId } = req.validatedData;
    const userId = req.user.id;

    await db.transaction(async (tx) => {
        const [seat] = await tx
            .select()
            .from(showSeats)
            .where(
                and(eq(showSeats.showId, showId), eq(showSeats.seatId, seatId)),
            )
            .for("update");

        if (!seat) {
            throw ApiError.badRequest("Invalid seat");
        }

        if (seat.bookedBy !== null) {
            throw ApiError.conflict("Seat already booked");
        }

        await tx
            .update(showSeats)
            .set({ bookedBy: userId })
            .where(
                and(eq(showSeats.showId, showId), eq(showSeats.seatId, seatId)),
            );
    });

    return ApiResponse.ok(res, "Seat booked successfully");
}
