'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ConcertDetailResponseSchema,
} from '@/features/concerts/lib/dto';
import {
  CONCERT_CACHE_TIME_MS,
  CONCERT_DETAIL_QUERY_KEY,
} from '@/features/concerts/constants';
import {
  apiClient,
  extractApiErrorMessage,
} from '@/lib/remote/api-client';

const DETAIL_ERROR_FALLBACK = '콘서트 상세 정보를 불러오는 중 문제가 발생했습니다.';

export const useConcertDetailQuery = (concertId: string) => {
  return useQuery({
    queryKey: [CONCERT_DETAIL_QUERY_KEY, concertId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/api/concerts/${concertId}`);
        return ConcertDetailResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, DETAIL_ERROR_FALLBACK);
        throw new Error(message);
      }
    },
    enabled: Boolean(concertId),
    staleTime: CONCERT_CACHE_TIME_MS,
    retry: 1,
  });
};
