import { SEAT_SELECTION_SESSION_STORAGE_KEY } from '@/features/seats/constants';
import type { Seat } from '@/features/seats/lib/dto';

export type SeatSelectionSessionSnapshot = {
  concertId: string;
  sessionId: string;
  numberOfTickets: number;
  selectedSeats: Seat[];
  totalAmount: number;
  expiresAt: string | null;
  savedAt: string;
};

const isBrowser = () => typeof window !== 'undefined';

export const saveSelectionToSession = (snapshot: SeatSelectionSessionSnapshot) => {
  if (!isBrowser()) {
    return;
  }

  const payload = JSON.stringify(snapshot);
  window.sessionStorage.setItem(SEAT_SELECTION_SESSION_STORAGE_KEY, payload);
};

export const loadSelectionFromSession = (): SeatSelectionSessionSnapshot | null => {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(SEAT_SELECTION_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SeatSelectionSessionSnapshot;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to parse seat selection session storage payload', error);
    return null;
  }
};

export const clearSelectionFromSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(SEAT_SELECTION_SESSION_STORAGE_KEY);
};
