'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  ReleaseSeatRequestSchema,
  ReleaseSeatResponseSchema,
  type ReleaseSeatRequest,
  type ReleaseSeatResponse,
} from '@/features/seats/lib/dto';

const SEAT_RELEASE_ERROR_MESSAGE = '좌석 선택을 취소하는 중 문제가 발생했습니다.';

export const useReleaseSeatMutation = () => {
  return useMutation<ReleaseSeatResponse, Error, ReleaseSeatRequest>({
    mutationFn: async (payload) => {
      const safePayload = ReleaseSeatRequestSchema.parse(payload);

      try {
        const { data } = await apiClient.post('/api/seats/release', safePayload);
        return ReleaseSeatResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, SEAT_RELEASE_ERROR_MESSAGE);
        throw new Error(message);
      }
    },
  });
};
