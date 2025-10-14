'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  SeatsResponseSchema,
  type SeatsResponse,
} from '@/features/seats/lib/dto';
import {
  SEAT_SELECTION_QUERY_KEYS,
  SEATS_FEATURE_KEY,
} from '@/features/seats/constants';

const SEAT_FETCH_ERROR_MESSAGE = '좌석 정보를 불러오는 중 오류가 발생했습니다.';

export const useSeatsQuery = (concertId: string, enabled = true) => {
  return useQuery<SeatsResponse, Error>({
    queryKey: [SEATS_FEATURE_KEY, SEAT_SELECTION_QUERY_KEYS.seats, concertId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/seats', {
          params: { concertId },
        });

        return SeatsResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, SEAT_FETCH_ERROR_MESSAGE);
        throw new Error(message);
      }
    },
    enabled: Boolean(concertId) && enabled,
    staleTime: 0,
  });
};
