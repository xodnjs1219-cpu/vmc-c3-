"use client";

import { useQuery } from '@tanstack/react-query';
import {
  apiClient,
  extractApiErrorMessage,
} from '@/lib/remote/api-client';
import { BOOKING_API_PATH } from '@/features/bookings/constants';
import {
  BookingDetailResponseSchema,
  type BookingDetailResponse,
} from '@/features/bookings/lib/dto';

const DETAIL_ENDPOINT = (bookingId: string) => `/api${BOOKING_API_PATH}/${bookingId}/detail`;
const DETAIL_QUERY_KEY = (bookingId: string) => ['booking-detail', bookingId] as const;
const DETAIL_ERROR_MESSAGE = '예약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

export const useBookingDetailQuery = (bookingId: string, accessToken: string | null) =>
  useQuery<BookingDetailResponse, Error>({
    queryKey: DETAIL_QUERY_KEY(bookingId),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Access token is required.');
      }

      try {
        const { data } = await apiClient.get(DETAIL_ENDPOINT(bookingId), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        return BookingDetailResponseSchema.parse(data);
      } catch (error) {
        throw new Error(extractApiErrorMessage(error, DETAIL_ERROR_MESSAGE));
      }
    },
    enabled: Boolean(bookingId) && Boolean(accessToken),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
