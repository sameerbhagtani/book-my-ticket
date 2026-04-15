import jwt from "jsonwebtoken";
import crypto from "crypto";

export function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

export function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}

export function generateRandomToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
