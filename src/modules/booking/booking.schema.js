import * as z from "zod";

export const createBookingSchema = z.strictObject({
    showId: z.number(),
    seatId: z.number(),
});
