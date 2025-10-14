"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  ConcertQuerySchema,
  ConcertsListResponseSchema,
  type ConcertQueryParams,
} from '@/features/concerts/lib/dto';
import {
  CONCERT_CACHE_TIME_MS,
  CONCERT_FEATURE_KEY,
} from '@/features/concerts/constants';

const buildQueryString = (params: ConcertQueryParams) => {
  const filtered = Object.entries(params).reduce<string[][]>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    const stringified = String(value);

    if (stringified.length === 0) {
      return acc;
    }

    acc.push([key, stringified]);
    return acc;
  }, []);

  return new URLSearchParams(filtered).toString();
};

export const useConcertsQuery = (params: ConcertQueryParams) => {
  const safeParams = useMemo(() => ConcertQuerySchema.parse(params), [params]);

  return useQuery({
    queryKey: [CONCERT_FEATURE_KEY, safeParams],
    queryFn: async () => {
      const queryString = buildQueryString(safeParams);

      try {
        const { data } = await apiClient.get(`/api/concerts${queryString ? `?${queryString}` : ''}`);
        return ConcertsListResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, '콘서트 목록을 불러오지 못했습니다.');
        throw new Error(message);
      }
    },
    staleTime: CONCERT_CACHE_TIME_MS,
  });
};
