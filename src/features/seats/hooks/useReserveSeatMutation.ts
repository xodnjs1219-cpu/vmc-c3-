'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  ReserveSeatRequestSchema,
  ReserveSeatResponseSchema,
  type ReserveSeatRequest,
  type ReserveSeatResponse,
} from '@/features/seats/lib/dto';

const SEAT_RESERVE_ERROR_MESSAGE = '좌석을 선택하는 중 문제가 발생했습니다.';

export const useReserveSeatMutation = () => {
  return useMutation<ReserveSeatResponse, Error, ReserveSeatRequest>({
    mutationFn: async (payload) => {
      const safePayload = ReserveSeatRequestSchema.parse(payload);

      try {
        const { data } = await apiClient.post('/api/seats/reserve', safePayload);
        return ReserveSeatResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, SEAT_RESERVE_ERROR_MESSAGE);
        throw new Error(message);
      }
    },
  });
};
