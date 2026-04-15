import ApiError from "../utils/ApiError.js";

export default function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const message = result.error.issues
                .map((issue) => issue.message)
                .join(", ");
            return next(ApiError.badRequest(message));
        }

        req.validatedData = result.data;
        return next();
    };
}
