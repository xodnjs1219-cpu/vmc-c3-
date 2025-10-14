export const concertErrorCodes = {
  fetchError: 'CONCERT_FETCH_ERROR',
  validationError: 'CONCERT_VALIDATION_ERROR',
} as const;

export type ConcertServiceError =
  (typeof concertErrorCodes)[keyof typeof concertErrorCodes];
