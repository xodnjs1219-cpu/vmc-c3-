export const concertErrorCodes = {
  fetchError: 'CONCERT_FETCH_ERROR',
  validationError: 'CONCERT_VALIDATION_ERROR',
  notFound: 'CONCERT_NOT_FOUND',
  notAvailable: 'CONCERT_NOT_AVAILABLE',
  seatAvailabilityFetchError: 'SEAT_AVAILABILITY_FETCH_ERROR',
} as const;

export type ConcertServiceError =
  (typeof concertErrorCodes)[keyof typeof concertErrorCodes];
