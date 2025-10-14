import type {
  BookingResponse,
  BookingDetailWithSeat,
  CreateBookingRequest,
} from '@/features/bookings/lib/dto';

export type SeatInfo = BookingResponse['seats'][number];
export type SeatGrade = SeatInfo['grade'];
export type BookingInfo = BookingResponse;
export type CreateBookingPayload = CreateBookingRequest;

export type BookingDetail = BookingDetailWithSeat;

export type BookingMutationError = Error & {
  code?: string;
};
