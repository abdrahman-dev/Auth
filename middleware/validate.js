export const validate = (schema) => (req, res, next) => {
    try {
        // Parse & validate request body
        const data = schema.parse(req.body);

        // Replace body with validated data (clean object)
        req.body = data;

        next();
    } catch (error) {
        // Extract readable errors from Zod
        const errors = error.errors?.map(err => ({
            field: err.path[0],
            message: err.message
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }
};
