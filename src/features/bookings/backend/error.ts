export const bookingErrorCodes = {
  validationError: 'BOOKING_VALIDATION_ERROR',
  seatUnavailable: 'SEAT_UNAVAILABLE',
  sessionExpired: 'SESSION_EXPIRED',
  sessionMismatch: 'SESSION_MISMATCH',
  concertNotFound: 'CONCERT_NOT_FOUND',
  transactionFailed: 'TRANSACTION_FAILED',
  hashingFailed: 'PASSWORD_HASHING_FAILED',
  databaseError: 'BOOKING_DATABASE_ERROR',
} as const;

export type BookingServiceError =
  (typeof bookingErrorCodes)[keyof typeof bookingErrorCodes];
