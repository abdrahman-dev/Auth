export const validate = (schema) => (req, res, next) => {
    try {
        // Parse & validate request body
        const data = schema.parse(req.body);

        // Replace body with validated data (clean object)
        req.body = data;

        next();
    } catch (error) {
        next(error);
    }
};
