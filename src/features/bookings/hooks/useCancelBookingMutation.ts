"use client";

import { useMutation } from '@tanstack/react-query';
import {
  apiClient,
  extractApiErrorMessage,
} from '@/lib/remote/api-client';
import { BOOKING_API_PATH } from '@/features/bookings/constants';
import {
  CancelBookingResponseSchema,
  type CancelBookingResponse,
} from '@/features/bookings/lib/dto';

const CANCEL_ENDPOINT = (bookingId: string) => `/api${BOOKING_API_PATH}/${bookingId}`;
const CANCEL_ERROR_MESSAGE = '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.';

export type CancelBookingParams = {
  bookingId: string;
  accessToken: string;
};

export const useCancelBookingMutation = () =>
  useMutation<CancelBookingResponse, Error, CancelBookingParams>({
    mutationFn: async ({ bookingId, accessToken }) => {
      try {
        const { data } = await apiClient.delete(CANCEL_ENDPOINT(bookingId), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        return CancelBookingResponseSchema.parse(data);
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, CANCEL_ERROR_MESSAGE));
      }
    },
  });
