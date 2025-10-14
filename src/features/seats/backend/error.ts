export const seatErrorCodes = {
  seatFetchError: 'SEAT_FETCH_ERROR',
  seatStatusFetchError: 'SEAT_STATUS_FETCH_ERROR',
  seatReserveConflict: 'SEAT_RESERVE_CONFLICT',
  seatNotAvailable: 'SEAT_NOT_AVAILABLE',
  sessionExpired: 'SESSION_EXPIRED',
  invalidSelection: 'INVALID_SELECTION',
  validationError: 'SEAT_VALIDATION_ERROR',
} as const;

export type SeatServiceError = typeof seatErrorCodes[keyof typeof seatErrorCodes];
