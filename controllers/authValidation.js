const { z } = require("zod");

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 chars"),
    password: z.string().min(6, "Password must be at least 6 chars")
});

const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});

module.exports = {
    registerSchema,
    loginSchema
}; 