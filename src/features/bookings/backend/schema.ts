import { z } from 'zod';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  BOOKING_CANCELLATION_WINDOW_HOURS,
  BOOKING_MAX_SEAT_COUNT,
  BOOKING_MIN_SEAT_COUNT,
  BOOKING_PASSWORD_REGEX,
  BOOKING_PHONE_NUMBER_REGEX,
  BOOKING_STATUS,
  BOOKING_PASSWORD_LENGTH,
} from '@/features/bookings/constants';

const BOOKER_NAME_MAX_LENGTH = 100;
const SESSION_ID_MIN_LENGTH = 1;
const PASSWORD_LENGTH_ERROR = `조회용 비밀번호는 ${BOOKING_PASSWORD_LENGTH}자리 숫자여야 합니다.`;
const PHONE_NUMBER_ERROR = '휴대폰 번호는 010-0000-0000 형식이어야 합니다.';
const ACCESS_TOKEN_ERROR = '접근 토큰 값을 확인해주세요.';
const STORAGE_KEY_ERROR = '저장 키는 비워둘 수 없습니다.';

export const CreateBookingRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z
    .array(z.string().uuid())
    .min(BOOKING_MIN_SEAT_COUNT)
    .max(BOOKING_MAX_SEAT_COUNT),
  sessionId: z.string().min(SESSION_ID_MIN_LENGTH),
  bookerName: z.string().trim().min(1).max(BOOKER_NAME_MAX_LENGTH),
  phoneNumber: z.string().regex(BOOKING_PHONE_NUMBER_REGEX, PHONE_NUMBER_ERROR),
  password: z.string().regex(BOOKING_PASSWORD_REGEX, PASSWORD_LENGTH_ERROR),
});

export const BookingSeatSchema = z.object({
  id: z.string().uuid(),
  section: z.string(),
  rowNumber: z.string(),
  seatNumber: z.string(),
  grade: z.string(),
  price: z.number().nonnegative(),
});

export const BookingResponseSchema = z.object({
  id: z.string().uuid(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  venue: z.string(),
  startDate: z.string().datetime({ offset: true }),
  bookerName: z.string(),
  phoneNumber: z.string(),
  seats: z.array(BookingSeatSchema),
  totalAmount: z.number().nonnegative(),
  status: z.enum([BOOKING_STATUS.confirmed, BOOKING_STATUS.cancelled] as const),
  createdAt: z.string().datetime({ offset: true }),
});

export const BookingDetailParamSchema = z.object({
  bookingId: z.string().uuid(),
});

export const BookingVerifyRequestSchema = z.object({
  phoneNumber: z.string().regex(BOOKING_PHONE_NUMBER_REGEX, PHONE_NUMBER_ERROR),
  password: z.string().regex(BOOKING_PASSWORD_REGEX, PASSWORD_LENGTH_ERROR),
});

export const BookingVerifyResponseSchema = z.object({
  accessToken: z.string().min(1, ACCESS_TOKEN_ERROR),
});

export const BookingDetailWithSeatSchema = z.object({
  id: z.string().uuid(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertVenue: z.string(),
  concertStartDate: z.string().datetime({ offset: true }),
  concertEndDate: z.string().datetime({ offset: true }),
  bookerName: z.string(),
  phoneNumber: z.string(),
  totalAmount: z.number().nonnegative(),
  status: z.enum([BOOKING_STATUS.confirmed, BOOKING_STATUS.cancelled] as const),
  seats: z.array(BookingSeatSchema),
  createdAt: z.string().datetime({ offset: true }),
  cancelledAt: z.string().datetime({ offset: true }).nullable(),
});

export const BookingDetailResponseSchema = z.object({
  booking: BookingDetailWithSeatSchema,
});

export const CancelBookingResponseSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum([BOOKING_STATUS.confirmed, BOOKING_STATUS.cancelled] as const),
  cancelledAt: z.string().datetime({ offset: true }),
  cancellationDeadline: z.string().datetime({ offset: true }),
  concertStartDate: z.string().datetime({ offset: true }),
  message: z.string(),
});

export const BookingLookupRequestSchema = z.object({
  phoneNumber: z.string().regex(BOOKING_PHONE_NUMBER_REGEX, PHONE_NUMBER_ERROR),
  password: z.string().regex(BOOKING_PASSWORD_REGEX, PASSWORD_LENGTH_ERROR),
});

export const BookingLookupResponseSchema = z.object({
  bookings: z.array(BookingDetailWithSeatSchema),
});

export const BookingAccessTokenSchema = z.object({
  storageKey: z
    .string()
    .min(1, STORAGE_KEY_ERROR)
    .default(ACCESS_TOKEN_STORAGE_KEY),
  bookingId: z.string().uuid(),
  accessToken: z.string().min(1, ACCESS_TOKEN_ERROR),
});

export const CancellationPolicySchema = z.object({
  cancellationWindowHours: z.number().nonnegative().default(BOOKING_CANCELLATION_WINDOW_HOURS),
});

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type BookingResponse = z.infer<typeof BookingResponseSchema>;
export type BookingVerifyRequest = z.infer<typeof BookingVerifyRequestSchema>;
export type BookingVerifyResponse = z.infer<typeof BookingVerifyResponseSchema>;
export type BookingDetailWithSeat = z.infer<typeof BookingDetailWithSeatSchema>;
export type BookingDetailResponse = z.infer<typeof BookingDetailResponseSchema>;
export type CancelBookingResponse = z.infer<typeof CancelBookingResponseSchema>;
export type BookingLookupRequest = z.infer<typeof BookingLookupRequestSchema>;
export type BookingLookupResponse = z.infer<typeof BookingLookupResponseSchema>;
