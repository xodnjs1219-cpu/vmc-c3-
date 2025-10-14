"use client";

import { useMutation } from '@tanstack/react-query';
import {
  apiClient,
  extractApiErrorMessage,
} from '@/lib/remote/api-client';
import { BOOKING_API_PATH } from '@/features/bookings/constants';
import {
  BookingVerifyRequestSchema,
  BookingVerifyResponseSchema,
  type BookingVerifyRequest,
  type BookingVerifyResponse,
} from '@/features/bookings/lib/dto';

const VERIFY_ENDPOINT = (bookingId: string) => `/api${BOOKING_API_PATH}/${bookingId}/verify`;
const VERIFY_ERROR_MESSAGE = '예약 인증에 실패했습니다. 다시 시도해주세요.';

export const useBookingVerifyMutation = (bookingId: string) =>
  useMutation<BookingVerifyResponse, Error, BookingVerifyRequest>({
    mutationFn: async (payload) => {
      const validated = BookingVerifyRequestSchema.parse(payload);

      try {
        const { data } = await apiClient.post(VERIFY_ENDPOINT(bookingId), validated);
        return BookingVerifyResponseSchema.parse(data);
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, VERIFY_ERROR_MESSAGE));
      }
    },
  });
