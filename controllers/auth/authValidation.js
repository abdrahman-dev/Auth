import { z } from 'zod';

export const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be at most 50 characters long")
        .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z
        .string()
        .email("Invalid email address")
        .min(5, "Email must be at least 5 characters")
        .max(100, "Email must be at most 100 characters"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be at most 100 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
}).refine((data) => data.name.trim().length > 0, {
    message: "Name cannot be empty or just whitespace",
    path: ["name"]
});

export const loginSchema = z.object({
    email: z
        .string()
        .email("Invalid email format")
        .min(5, "Email must be at least 5 characters")
        .max(100, "Email must be at most 100 characters"),
    password: z
        .string()
        .min(1, "Password is required")
        .max(100, "Password must be at most 100 characters")
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format")
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be at most 100 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});