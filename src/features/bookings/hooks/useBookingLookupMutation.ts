"use client";

import { useMutation } from '@tanstack/react-query';
import {
  apiClient,
  extractApiErrorMessage,
} from '@/lib/remote/api-client';
import { BOOKING_API_PATH } from '@/features/bookings/constants';
import {
  BookingLookupRequestSchema,
  BookingLookupResponseSchema,
  type BookingLookupRequest,
  type BookingLookupResponse,
} from '@/features/bookings/lib/dto';

const LOOKUP_ENDPOINT = `/api${BOOKING_API_PATH}/lookup`;
const LOOKUP_ERROR_MESSAGE = '예약 조회에 실패했습니다. 입력하신 정보를 확인해주세요.';

export const useBookingLookupMutation = () =>
  useMutation<BookingLookupResponse, Error, BookingLookupRequest>({
    mutationFn: async (payload) => {
      const validated = BookingLookupRequestSchema.parse(payload);

      try {
        const { data } = await apiClient.post(LOOKUP_ENDPOINT, validated);
        return BookingLookupResponseSchema.parse(data);
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, LOOKUP_ERROR_MESSAGE));
      }
    },
  });
