import * as z from "zod";

export const registerSchema = z.strictObject({
    name: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "Name is required"
                    : "Name must be a string",
        })
        .trim()
        .min(1, "Name is required")
        .max(50, "Name should be of 50 chars max"),
    email: z
        .email({
            error: (issue) =>
                issue.input === undefined
                    ? "Email is required"
                    : "Invalid email format",
        })
        .trim()
        .min(1, "Email is required"),
    password: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "Password is required"
                    : "Password must be a string",
        })
        .regex(
            /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[^\s]{6,}$/,
            "Password must contain min 6 characters, use a mix of letters, numbers, and symbols. No spaces.",
        ),
});

export const loginSchema = z.strictObject({
    email: z
        .email({
            error: (issue) =>
                issue.input === undefined
                    ? "Email is required"
                    : "Invalid email format",
        })
        .trim()
        .min(1, "Email is required"),

    password: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "Password is required"
                    : "Password must be a string",
        })
        .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.strictObject({
    email: z
        .email({
            error: (issue) =>
                issue.input === undefined
                    ? "Email is required"
                    : "Invalid email format",
        })
        .trim()
        .min(1, "Email is required"),
});

export const resetPasswordSchema = z.strictObject({
    token: z.string().min(1),
    password: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "Password is required"
                    : "Password must be a string",
        })
        .regex(
            /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[^\s]{6,}$/,
            "Password must contain min 6 characters, use a mix of letters, numbers, and symbols. No spaces.",
        ),
});
