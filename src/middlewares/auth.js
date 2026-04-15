import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function getUser(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
    } catch {
        req.user = null;
    }

    return next();
}

export function requireAuth(req, res, next) {
    if (!req.user) {
        return next(ApiError.unauthorized("Login required"));
    }

    return next();
}

export function requireVerified(req, _res, next) {
    if (!req.user.isVerified) {
        return next(ApiError.forbidden("Email not verified"));
    }

    return next();
}

export function requireNotVerified(req, res, next) {
    if (req.user.isVerified) {
        return next(ApiError.badRequest("You're already verified"));
    }

    return next();
}

export function requireAdmin(req, _res, next) {
    if (!req.user.isAdmin) {
        return next(ApiError.forbidden("Admin access required"));
    }

    return next();
}
