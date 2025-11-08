import { betterAuth } from "better-auth";

// Better Auth configuration
export const auth = betterAuth({
  database: {
    // Using Supabase as the database adapter
    provider: "postgres",
    url:
      process.env["DATABASE_URL"] ??
      "postgresql://postgres:postgres@localhost:54322/postgres",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // For local dev
  },
  socialProviders: {
    // Add social providers later (Google, GitHub, etc.)
  },
  secret: process.env["BETTER_AUTH_SECRET"] ?? "development-secret-key",
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000",
});

export type Auth = typeof auth;
