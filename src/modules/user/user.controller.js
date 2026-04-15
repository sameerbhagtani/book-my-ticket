import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import db from "../../db/index.js";
import { users } from "../../db/schema.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateRandomToken,
    hashToken,
} from "../../utils/tokens.js";

import {
    sendVerificationEmail,
    sendResetPasswordEmail,
} from "../../utils/mails.js";

export async function register(req, res) {
    const { name, email, password } = req.validatedData;

    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    if (existingUser.length > 0) {
        throw ApiError.conflict("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rawVerificationToken = generateRandomToken();
    const hashedVerificationToken = hashToken(rawVerificationToken);

    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const [user] = await db
        .insert(users)
        .values({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationToken: hashedVerificationToken,
            verificationExpires,
        })
        .returning();

    if (process.env.SEND_MAILS === "true") {
        await sendVerificationEmail(email, rawVerificationToken);
    } else {
        console.log(`${email} : ${rawVerificationToken}`);
    }

    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return ApiResponse.created(res, "User registered", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
        },
        accessToken,
    });
}

export async function login(req, res) {
    const { email, password } = req.validatedData;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return ApiResponse.ok(res, "Login successful", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
        },
        accessToken,
    });
}

export async function me(req, res) {
    if (!req.user) {
        throw ApiError.unauthorized("Not logged in");
    }

    return ApiResponse.ok(res, "User fetched", {
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            isVerified: req.user.isVerified,
        },
    });
}

export async function logout(_req, res) {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return ApiResponse.ok(res, "Logged out successfully");
}

export async function verifyEmail(req, res) {
    const { token } = req.query;

    if (!token) {
        throw ApiError.badRequest("Invalid or missing token");
    }

    const hashedToken = hashToken(token);

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, hashedToken));

    if (!user) {
        throw ApiError.badRequest("Invalid or expired token");
    }

    if (!user.verificationExpires || user.verificationExpires < new Date()) {
        throw ApiError.badRequest("Token expired");
    }

    await db
        .update(users)
        .set({
            isVerified: true,
            verificationToken: null,
            verificationExpires: null,
        })
        .where(eq(users.id, user.id));

    return ApiResponse.ok(res, "Email verified successfully");
}

export async function resendVerification(req, res) {
    const rawToken = generateRandomToken();
    const hashedToken = hashToken(rawToken);

    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db
        .update(users)
        .set({
            verificationToken: hashedToken,
            verificationExpires,
        })
        .where(eq(users.id, req.user.id));

    if (process.env.SEND_MAILS === "true") {
        await sendVerificationEmail(req.user.email, rawToken);
    } else {
        console.log(`${req.user.email} : ${rawToken}`);
    }

    return ApiResponse.ok(res, "Verification email sent");
}

export async function refresh(req, res) {
    const token = req.cookies.refreshToken;

    if (!token) {
        throw ApiError.unauthorized("No refresh token");
    }

    let payload;

    try {
        payload = verifyRefreshToken(token);
    } catch {
        throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const newAccessToken = generateAccessToken({
        id: payload.id,
        name: payload.name,
        email: payload.email,
        isAdmin: payload.isAdmin,
        isVerified: payload.isVerified,
    });

    return ApiResponse.ok(res, "Token refreshed", {
        accessToken: newAccessToken,
    });
}

export async function forgotPassword(req, res) {
    const { email } = req.validatedData;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        throw ApiError.notFound("User not found");
    }

    const rawToken = generateRandomToken();
    const hashedToken = hashToken(rawToken);

    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db
        .update(users)
        .set({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: resetExpires,
        })
        .where(eq(users.id, user.id));

    if (process.env.SEND_MAILS === "true") {
        await sendResetPasswordEmail(email, rawToken);
    } else {
        console.log(`${email} : ${rawToken}`);
    }

    return ApiResponse.ok(res, "Password reset email sent");
}

export async function resetPassword(req, res) {
    const { token, password } = req.validatedData;

    const hashedToken = hashToken(token);

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetPasswordToken, hashedToken));

    if (!user) {
        throw ApiError.badRequest("Invalid or expired token");
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw ApiError.badRequest("Token expired");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
        .update(users)
        .set({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        })
        .where(eq(users.id, user.id));

    return ApiResponse.ok(res, "Password reset successful");
}
