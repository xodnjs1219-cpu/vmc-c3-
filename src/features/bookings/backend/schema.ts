import { z } from 'zod';
import {
  BOOKING_MAX_SEAT_COUNT,
  BOOKING_MIN_SEAT_COUNT,
  BOOKING_STATUS,
} from '@/features/bookings/constants';

const PHONE_NUMBER_REGEX = /^010-\d{4}-\d{4}$/;
const PASSWORD_REGEX = /^\d{4}$/;
const BOOKER_NAME_MAX_LENGTH = 100;
const SESSION_ID_MIN_LENGTH = 1;
const PASSWORD_LENGTH_ERROR = '조회용 비밀번호는 4자리 숫자여야 합니다.';
const PHONE_NUMBER_ERROR = '휴대폰 번호는 010-0000-0000 형식이어야 합니다.';

export const CreateBookingRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z
    .array(z.string().uuid())
    .min(BOOKING_MIN_SEAT_COUNT)
    .max(BOOKING_MAX_SEAT_COUNT),
  sessionId: z.string().min(SESSION_ID_MIN_LENGTH),
  bookerName: z.string().trim().min(1).max(BOOKER_NAME_MAX_LENGTH),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX, PHONE_NUMBER_ERROR),
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_LENGTH_ERROR),
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

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type BookingResponse = z.infer<typeof BookingResponseSchema>;
