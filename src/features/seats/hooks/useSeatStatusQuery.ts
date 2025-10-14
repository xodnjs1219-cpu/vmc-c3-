'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  SeatStatusResponseSchema,
  type SeatStatusResponse,
} from '@/features/seats/lib/dto';
import {
  SEAT_POLLING_INTERVAL_MS,
  SEAT_SELECTION_QUERY_KEYS,
  SEATS_FEATURE_KEY,
} from '@/features/seats/constants';

const SEAT_STATUS_FETCH_ERROR_MESSAGE = '좌석 상태를 동기화하는 중 오류가 발생했습니다.';

export const useSeatStatusQuery = (concertId: string, enabled = true) => {
  return useQuery<SeatStatusResponse, Error>({
    queryKey: [
      SEATS_FEATURE_KEY,
      SEAT_SELECTION_QUERY_KEYS.status,
      concertId,
    ],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/seats/status', {
          params: { concertId },
        });

        return SeatStatusResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, SEAT_STATUS_FETCH_ERROR_MESSAGE);
        throw new Error(message);
      }
    },
    enabled: Boolean(concertId) && enabled,
    refetchInterval: SEAT_POLLING_INTERVAL_MS,
    staleTime: 0,
  });
};
