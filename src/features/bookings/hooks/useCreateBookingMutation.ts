"use client";

import { useMutation } from '@tanstack/react-query';
import {
  apiClient,
  extractApiErrorMessage,
  isAxiosError,
} from '@/lib/remote/api-client';
import {
  BOOKING_API_PATH,
  BOOKING_ERROR_FALLBACK_MESSAGE,
} from '@/features/bookings/constants';
import {
  BookingResponseSchema,
  type CreateBookingRequest,
} from '@/features/bookings/lib/dto';
import type {
  BookingInfo,
  BookingMutationError,
} from '@/features/bookings/types';

const BOOKING_ENDPOINT = `/api${BOOKING_API_PATH}`;

const createBookingMutationError = (message: string, code?: string, details?: unknown) => {
  const error = new Error(message) as BookingMutationError & {
    details?: unknown;
  };

  if (code) {
    error.code = code;
  }

  if (details !== undefined) {
    error.details = details;
  }

  return error;
};

export const useCreateBookingMutation = () =>
  useMutation<BookingInfo, BookingMutationError, CreateBookingRequest>({
    mutationFn: async (payload) => {
      try {
        const { data } = await apiClient.post(BOOKING_ENDPOINT, payload);
        return BookingResponseSchema.parse(data);
      } catch (unknownError) {
        if (isAxiosError(unknownError)) {
          const responseData = unknownError.response?.data as {
            error?: {
              code?: string;
              message?: string;
              details?: unknown;
            };
          } | undefined;

          const code = responseData?.error?.code;
          const message =
            responseData?.error?.message ??
            extractApiErrorMessage(unknownError, BOOKING_ERROR_FALLBACK_MESSAGE);

          throw createBookingMutationError(message, code, responseData?.error?.details);
        }

        const message = extractApiErrorMessage(
          unknownError,
          BOOKING_ERROR_FALLBACK_MESSAGE,
        );

        throw createBookingMutationError(message);
      }
    },
  });
