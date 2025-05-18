import { z } from 'zod';

// Schema for user registration
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    firstName: z.string().min(1, { message: 'First name cannot be empty' }),
    lastName: z.string().min(1, { message: 'Last name cannot be empty' }),
  }),
});

// Schema for user login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

// Add other authentication-related schemas as needed (e.g., for password reset, etc.)
