import { z } from 'zod';

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  PORT: z.string().optional(),
  API_ALLOWED_ORIGINS: z.string().optional(), // comma-separated
});

export const env = EnvSchema.parse(process.env);


