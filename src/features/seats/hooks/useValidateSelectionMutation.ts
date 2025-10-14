'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  ValidateSelectionRequestSchema,
  ValidateSelectionResponseSchema,
  type ValidateSelectionRequest,
  type ValidateSelectionResponse,
} from '@/features/seats/lib/dto';

const SEAT_VALIDATE_ERROR_MESSAGE = '선택한 좌석을 확인하는 중 문제가 발생했습니다.';

export const useValidateSelectionMutation = () => {
  return useMutation<ValidateSelectionResponse, Error, ValidateSelectionRequest>({
    mutationFn: async (payload) => {
      const safePayload = ValidateSelectionRequestSchema.parse(payload);

      try {
        const { data } = await apiClient.post('/api/bookings/validate', safePayload);
        return ValidateSelectionResponseSchema.parse(data);
      } catch (error) {
        const message = extractApiErrorMessage(error, SEAT_VALIDATE_ERROR_MESSAGE);
        throw new Error(message);
      }
    },
  });
};
