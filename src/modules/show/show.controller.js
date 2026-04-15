import db from "../../db/index.js";
import { shows, seats, showSeats } from "../../db/schema.js";
import { eq } from "drizzle-orm";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { parseDateTimeInIST } from "../../utils/time.js";

export async function getShows(_req, res) {
    const allShows = await db.select().from(shows);

    return ApiResponse.ok(res, "Shows fetched", {
        shows: allShows,
    });
}

export async function getShowSeats(req, res) {
    const showId = Number(req.params.showId);

    if (!showId) {
        throw ApiError.badRequest("Invalid showId");
    }

    const result = await db
        .select({
            seatId: seats.id,
            rowLabel: seats.rowLabel,
            seatNumber: seats.seatNumber,
            booked: showSeats.bookedBy, // we’ll map this
        })
        .from(showSeats)
        .innerJoin(seats, eq(showSeats.seatId, seats.id))
        .where(eq(showSeats.showId, showId));

    const formatted = result.map((seat) => ({
        seatId: seat.seatId,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
        booked: seat.booked !== null,
    }));

    return ApiResponse.ok(res, "Seats fetched", {
        seats: formatted,
    });
}

export async function createShow(req, res) {
    const { screenId, movieTitle, startTime, endTime } = req.validatedData;
    const parsedStartTime = parseDateTimeInIST(startTime);
    const parsedEndTime = parseDateTimeInIST(endTime);

    if (!parsedStartTime || !parsedEndTime) {
        throw ApiError.badRequest("Invalid show timing");
    }

    const screenSeats = await db
        .select()
        .from(seats)
        .where(eq(seats.screenId, screenId));

    if (screenSeats.length === 0) {
        throw ApiError.badRequest("Invalid screen or no seats found");
    }

    const [show] = await db
        .insert(shows)
        .values({
            screenId,
            movieTitle,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
        })
        .returning();

    const showSeatData = screenSeats.map((seat) => ({
        showId: show.id,
        seatId: seat.id,
    }));

    await db.insert(showSeats).values(showSeatData);

    return ApiResponse.created(res, "Show created successfully", {
        show,
    });
}
