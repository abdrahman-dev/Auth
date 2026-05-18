import { z } from "zod";

export const envSchema = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "PORT must be a number")
    .transform(Number)
    .refine((port) => port > 0 && port <= 65535, {
      message: "PORT must be between 1 and 65535",
    }),

  MONGODB_URL: z
    .string()
    .min(1, "MONGODB_URL is required"),

  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),

  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse(process.env);