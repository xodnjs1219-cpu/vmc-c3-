import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';
import { BOOKING_CANCELLATION_WINDOW_HOURS } from '@/features/bookings/constants';

const MIN_JWT_SECRET_LENGTH = 32;
const ACCESS_TOKEN_EXPIRATION_MINUTES = 60;

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(MIN_JWT_SECRET_LENGTH),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    auth: {
      jwtSecret: parsed.data.JWT_SECRET,
      bookingAccessTokenExpiresInMinutes: ACCESS_TOKEN_EXPIRATION_MINUTES,
    },
    booking: {
      cancellationWindowHours: BOOKING_CANCELLATION_WINDOW_HOURS,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
