import { differenceInSeconds, isBefore } from 'date-fns';
import { SEAT_STATUS, SESSION_TIMEOUT_SECONDS } from '@/features/seats/constants';
import type { Seat, SeatStatusItem } from '@/features/seats/lib/dto';

export const canSelectSeat = (
  seat: Seat,
  selectedSeats: Seat[],
  numberOfTickets: number,
) => {
  if (seat.status !== SEAT_STATUS.available) {
    return false;
  }

  if (selectedSeats.some((selected) => selected.id === seat.id)) {
    return false;
  }

  return selectedSeats.length < numberOfTickets;
};

export const canReleaseSeat = (
  seatId: string,
  selectedSeats: Seat[],
) => selectedSeats.some((seat) => seat.id === seatId);

export const isSessionExpired = (expiresAt: string | null) => {
  if (!expiresAt) {
    return false;
  }

  return isBefore(new Date(expiresAt), new Date());
};

export const calculateRemainingSeconds = (expiresAt: string | null) => {
  if (!expiresAt) {
    return SESSION_TIMEOUT_SECONDS;
  }

  const diff = differenceInSeconds(new Date(expiresAt), new Date());
  return Math.max(0, diff);
};

export const filterSelectableSeats = (
  seats: Seat[],
  seatStatuses: SeatStatusItem[],
) => {
  const statusMap = new Map<string, SeatStatusItem>();
  seatStatuses.forEach((status) => statusMap.set(status.id, status));

  return seats.filter((seat) => {
    const status = statusMap.get(seat.id);
    return !status || status.status === SEAT_STATUS.available;
  });
};
