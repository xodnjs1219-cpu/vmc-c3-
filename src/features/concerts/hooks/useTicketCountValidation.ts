'use client';

import { useMemo } from 'react';
import { MIN_TICKET_COUNT } from '@/features/concerts/constants';

const MIN_TICKET_MESSAGE = '최소 1매 이상 선택해주세요.';
const MAX_TICKET_MESSAGE_PREFIX = '1회 최대 ';
const MAX_TICKET_MESSAGE_SUFFIX = '매까지만 예매 가능합니다.';
const INSUFFICIENT_SEATS_MESSAGE = '잔여 좌석이 부족합니다. 인원 수를 조정해주세요.';

type ValidationResult = {
  isValid: boolean;
  validationMessage: string | null;
};

export const useTicketCountValidation = (
  ticketCount: number,
  maxTicketsPerBooking: number,
  totalAvailableSeats: number,
): ValidationResult => {
  return useMemo(() => {
    if (ticketCount < MIN_TICKET_COUNT) {
      return {
        isValid: false,
        validationMessage: MIN_TICKET_MESSAGE,
      };
    }

    if (maxTicketsPerBooking > 0 && ticketCount > maxTicketsPerBooking) {
      return {
        isValid: false,
        validationMessage: `${MAX_TICKET_MESSAGE_PREFIX}${maxTicketsPerBooking}${MAX_TICKET_MESSAGE_SUFFIX}`,
      };
    }

    if (totalAvailableSeats >= 0 && ticketCount > totalAvailableSeats) {
      return {
        isValid: false,
        validationMessage: INSUFFICIENT_SEATS_MESSAGE,
      };
    }

    return {
      isValid: true,
      validationMessage: null,
    };
  }, [ticketCount, maxTicketsPerBooking, totalAvailableSeats]);
};
