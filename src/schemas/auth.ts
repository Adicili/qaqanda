import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })

  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwrod do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
