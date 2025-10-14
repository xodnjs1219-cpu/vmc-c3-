'use client';

import { useQuery } from '@tanstack/react-query';
import {
  SeatAvailabilityResponseSchema,
} from '@/features/concerts/lib/dto';
import {
  CONCERT_SEAT_AVAILABILITY_QUERY_KEY,
  SEAT_AVAILABILITY_POLLING_INTERVAL,
} from '@/features/concerts/constants';
import {
  apiClient,
  extractApiErrorMessage,
} from '@/lib/remote/api-client';

const AVAILABILITY_ERROR_FALLBACK = '좌석 정보를 불러오지 못했습니다.';

export const useConcertSeatAvailability = (concertId: string, enabled = true) => {
  return useQuery({
    queryKey: [CONCERT_SEAT_AVAILABILITY_QUERY_KEY, concertId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/api/concerts/${concertId}/seats/availability`);
        return SeatAvailabilityResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, AVAILABILITY_ERROR_FALLBACK);
        throw new Error(message);
      }
    },
    enabled: enabled && Boolean(concertId),
    refetchInterval: SEAT_AVAILABILITY_POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: SEAT_AVAILABILITY_POLLING_INTERVAL / 2,
    retry: 1,
  });
};
