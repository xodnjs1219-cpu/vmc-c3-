import { z } from 'zod';
import {
  BOOKING_PASSWORD_LENGTH,
  BOOKING_PASSWORD_REGEX,
  BOOKING_PHONE_NUMBER_REGEX,
} from '@/features/bookings/constants';

const PHONE_NUMBER_ERROR = '휴대폰 번호는 010-0000-0000 형식이어야 합니다.';
const PASSWORD_ERROR = `조회용 비밀번호는 ${BOOKING_PASSWORD_LENGTH}자리 숫자여야 합니다.`;

export const bookingLookupSchema = z.object({
  phoneNumber: z.string().regex(BOOKING_PHONE_NUMBER_REGEX, PHONE_NUMBER_ERROR),
  password: z.string().regex(BOOKING_PASSWORD_REGEX, PASSWORD_ERROR),
});

export const bookingLookupFormSchema = bookingLookupSchema;

export type BookingLookupFormData = z.infer<typeof bookingLookupSchema>;
