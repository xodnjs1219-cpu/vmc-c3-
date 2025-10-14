export const bookingErrorCodes = {
  validationError: 'BOOKING_VALIDATION_ERROR',
  seatUnavailable: 'SEAT_UNAVAILABLE',
  sessionExpired: 'SESSION_EXPIRED',
  sessionMismatch: 'SESSION_MISMATCH',
  concertNotFound: 'CONCERT_NOT_FOUND',
  transactionFailed: 'TRANSACTION_FAILED',
  hashingFailed: 'PASSWORD_HASHING_FAILED',
  databaseError: 'BOOKING_DATABASE_ERROR',
  accessDenied: 'BOOKING_ACCESS_DENIED',
  fetchError: 'BOOKING_FETCH_ERROR',
  detailFetchError: 'BOOKING_DETAIL_FETCH_ERROR',
  invalidAccessToken: 'BOOKING_INVALID_ACCESS_TOKEN',
  notFound: 'BOOKING_NOT_FOUND',
  alreadyCancelled: 'BOOKING_ALREADY_CANCELLED',
  cancelNotAllowed: 'BOOKING_CANCEL_NOT_ALLOWED',
  cancelError: 'BOOKING_CANCEL_ERROR',
} as const;

export type BookingServiceError =
  (typeof bookingErrorCodes)[keyof typeof bookingErrorCodes];
