import * as z from "zod";

export const createShowSchema = z.strictObject({
    screenId: z.number(),
    movieTitle: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "Movie Title is required"
                    : "Movie Title must be a string",
        })
        .trim()
        .min(1, "Movie Title is required")
        .max(100, "Movie Title should be of 100 chars max"),
    startTime: z.string(),
    endTime: z.string(),
});
