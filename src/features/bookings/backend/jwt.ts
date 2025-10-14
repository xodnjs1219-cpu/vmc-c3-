import jwt from 'jsonwebtoken';
import type { AppConfig } from '@/backend/hono/context';

const TOKEN_TYPE = 'booking-access';
const TOKEN_ISSUER = 'vmc-concert-platform';

export type BookingAccessTokenPayload = {
  bookingId: string;
  phoneNumber: string;
  type: string;
};

export const generateAccessToken = (
  config: AppConfig,
  bookingId: string,
  phoneNumber: string,
) => {
  return jwt.sign(
    {
      bookingId,
      phoneNumber,
      type: TOKEN_TYPE,
    },
    config.auth.jwtSecret,
    {
      issuer: TOKEN_ISSUER,
      expiresIn: `${config.auth.bookingAccessTokenExpiresInMinutes}m`,
    },
  );
};

export const verifyAccessToken = (
  config: AppConfig,
  token: string,
): BookingAccessTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      issuer: TOKEN_ISSUER,
    }) as BookingAccessTokenPayload;

    if (decoded.type !== TOKEN_TYPE) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};
