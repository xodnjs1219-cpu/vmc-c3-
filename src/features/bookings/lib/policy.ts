import { format, isBefore, isValid, parseISO, subHours } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BOOKING_CANCELLATION_WINDOW_HOURS } from '@/features/bookings/constants';

const DEADLINE_FORMAT = 'yyyy년 M월 d일 (E) HH:mm';

const toDateSafe = (value: string) => {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const getCancellationDeadline = (concertStartDate: string) => {
  const startDate = toDateSafe(concertStartDate);

  if (!startDate) {
    return null;
  }

  return subHours(startDate, BOOKING_CANCELLATION_WINDOW_HOURS);
};

export const canCancelBooking = (concertStartDate: string, now: Date = new Date()) => {
  const deadline = getCancellationDeadline(concertStartDate);

  if (!deadline) {
    return false;
  }

  return isBefore(now, deadline);
};

export const getCancellationMessage = (concertStartDate: string) => {
  const deadline = getCancellationDeadline(concertStartDate);

  if (!deadline) {
    return '취소 가능 시간을 확인할 수 없습니다.';
  }

  const formattedDeadline = format(deadline, DEADLINE_FORMAT, { locale: ko });

  return `공연 시작 ${BOOKING_CANCELLATION_WINDOW_HOURS}시간 전(${formattedDeadline})까지 취소할 수 있습니다.`;
};
